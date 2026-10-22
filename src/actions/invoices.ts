"use server";

import { getScopedDb } from "@/lib/session";
import { db } from "@/lib/db";
import { invoiceSchema, paymentSchema } from "@/lib/validations";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/notifications";
import { formatMoney } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/url";

export async function createInvoiceAction(rawData: {
  customerId: string;
  jobId?: string | null;
  quoteId?: string | null;
  dueDate: string;
  notes?: string | null;
  lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>;
}) {
  try {
    const scopedDb = await getScopedDb();

    const validated = invoiceSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const org = await scopedDb.getOrganization();
    if (!org) throw new Error("Organization not found");

    const invoiceNumber = `${org.invoicePrefix}${org.nextInvoiceNum}`;

    await scopedDb.updateOrganization({
      nextInvoiceNum: org.nextInvoiceNum + 1,
    });

    const invoice = await scopedDb.invoices.create(
      {
        customerId: validated.data.customerId,
        jobId: validated.data.jobId || null,
        quoteId: validated.data.quoteId || null,
        invoiceNumber,
        dueDate: new Date(validated.data.dueDate),
        notes: validated.data.notes || null,
      },
      validated.data.lineItems
    );

    await scopedDb.logAudit("CREATE", "Invoice", invoice.id, {
      invoiceNumber,
      totalCents: invoice.totalCents,
    });

    revalidatePath("/invoices");
    revalidatePath(`/customers/${validated.data.customerId}`);
    return { success: true, invoiceId: invoice.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create invoice";
    return { success: false, error: msg };
  }
}

export async function recordPaymentAction(rawData: {
  invoiceId: string;
  amountCents: number;
  method: "CASH" | "CARD" | "BANK" | "CHECK";
  reference?: string | null;
  notes?: string | null;
}) {
  try {
    const scopedDb = await getScopedDb();

    const validated = paymentSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const payment = await scopedDb.invoices.addPayment(
      validated.data.invoiceId,
      validated.data.amountCents,
      validated.data.method,
      validated.data.reference || undefined,
      validated.data.notes || undefined
    );

    await scopedDb.logAudit("RECORD_PAYMENT", "Invoice", validated.data.invoiceId, {
      amountCents: validated.data.amountCents,
      method: validated.data.method,
    });

    revalidatePath("/invoices");
    return { success: true, paymentId: payment.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record payment";
    return { success: false, error: msg };
  }
}

export async function sendInvoiceEmailAction(invoiceId: string) {
  try {
    const scopedDb = await getScopedDb();
    const invoice = await scopedDb.invoices.findUnique(invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const org = await scopedDb.getOrganization();
    const appUrl = await getBaseUrl();
    const payUrl = `${appUrl}/invoice/${invoice.publicToken}`;

    const balanceDue = Math.max(0, invoice.totalCents - invoice.paidCents);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1b4332; margin-top: 0;">${org?.name || "PestPilot"} &bull; Invoice</h2>
        <p>Dear ${invoice.customer.firstName},</p>
        <p>Your pest service invoice <strong>${invoice.invoiceNumber}</strong> is ready.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; font-size: 16px;">Invoice: ${invoice.invoiceNumber}</p>
          <p style="margin: 5px 0 0 0; color: #4b5563;">Balance Due: <strong style="color: #1b4332; font-size: 18px;">${formatMoney(balanceDue, org?.currency || "USD")}</strong></p>
        </div>

        <p>You can view the itemized breakdown and pay securely online with any credit or debit card:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${payUrl}" style="background-color: #2d6a4f; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            View & Pay Invoice Online
          </a>
        </div>

        <p style="font-size: 12px; color: #6b7280;">Link: <a href="${payUrl}">${payUrl}</a></p>
      </div>
    `;

    const emailRes = await sendEmail({
      to: invoice.customer.email,
      subject: `Invoice from ${org?.name || "PestPilot"}: ${invoice.invoiceNumber}`,
      html,
    });

    if (emailRes.success && invoice.status === "DRAFT") {
      await db.invoice.update({
        where: { id: invoice.id },
        data: { status: "SENT", version: { increment: 1 } },
      });
      revalidatePath("/invoices");
    }

    return { success: emailRes.success, payUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to email invoice";
    return { success: false, error: msg };
  }
}

/**
 * Creates Stripe Checkout session for a customer to pay an invoice online
 */
export async function createInvoiceStripeCheckoutAction(invoiceId: string) {
  try {
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { organization: true, customer: true },
    });

    if (!invoice) throw new Error("Invoice not found");

    const balanceCents = Math.max(0, invoice.totalCents - invoice.paidCents);
    if (balanceCents <= 0) {
      throw new Error("This invoice is already fully paid.");
    }

    const appUrl = await getBaseUrl();

    // If Stripe key is configured, create Checkout session
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: invoice.customer.email,
        line_items: [
          {
            price_data: {
              currency: invoice.organization.currency.toLowerCase(),
              product_data: {
                name: `Pest Control Invoice: ${invoice.invoiceNumber}`,
                description: `Payment to ${invoice.organization.name}`,
              },
              unit_amount: balanceCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          invoiceId: invoice.id,
          organizationId: invoice.organizationId,
        },
        success_url: `${appUrl}/invoice/${invoice.publicToken}?paid=true`,
        cancel_url: `${appUrl}/invoice/${invoice.publicToken}?cancelled=true`,
      });

      return { success: true, checkoutUrl: session.url };
    }

    // Mock fallback when Stripe keys are simulated
    await db.payment.create({
      data: {
        invoiceId: invoice.id,
        amountCents: balanceCents,
        method: "CARD",
        reference: "DEMO_STRIPE_PAYMENT_SIMULATED",
        notes: "Online card payment in test simulation mode",
      },
    });

    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        paidCents: invoice.totalCents,
        status: "PAID",
        version: { increment: 1 },
      },
    });

    revalidatePath(`/invoice/${invoice.publicToken}`);
    return { success: true, simulated: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to initiate payment";
    return { success: false, error: msg };
  }
}

