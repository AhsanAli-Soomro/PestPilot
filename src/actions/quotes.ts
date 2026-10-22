"use server";

import { getScopedDb } from "@/lib/session";
import { db } from "@/lib/db";
import { quoteSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/notifications";
import { formatMoney } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/url";

export async function createQuoteAction(rawData: {
  customerId: string;
  propertyId?: string | null;
  title: string;
  validUntil?: string | null;
  notes?: string | null;
  lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>;
}) {
  try {
    const scopedDb = await getScopedDb();

    const validated = quoteSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const org = await scopedDb.getOrganization();
    if (!org) throw new Error("Organization not found");

    const quoteNumber = `${org.quotePrefix}${org.nextQuoteNum}`;

    // Update next quote num
    await scopedDb.updateOrganization({
      nextQuoteNum: org.nextQuoteNum + 1,
    });

    const quote = await scopedDb.quotes.create(
      {
        customerId: validated.data.customerId,
        propertyId: validated.data.propertyId || null,
        quoteNumber,
        title: validated.data.title,
        validUntil: validated.data.validUntil ? new Date(validated.data.validUntil) : null,
        notes: validated.data.notes || null,
      },
      validated.data.lineItems
    );

    await scopedDb.logAudit("CREATE", "Quote", quote.id, { quoteNumber, totalCents: quote.totalCents });

    revalidatePath("/quotes");
    revalidatePath(`/customers/${validated.data.customerId}`);
    return { success: true, quoteId: quote.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create quote";
    return { success: false, error: msg };
  }
}

export async function sendQuoteEmailAction(quoteId: string) {
  try {
    const scopedDb = await getScopedDb();
    const quote = await scopedDb.quotes.findUnique(quoteId);
    if (!quote) throw new Error("Quote not found");

    const org = await scopedDb.getOrganization();
    const appUrl = await getBaseUrl();
    const publicUrl = `${appUrl}/quote/${quote.publicToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #1b4332; margin-top: 0;">${org?.name || "PestPilot"} &bull; Pest Service Quote</h2>
        <p>Dear ${quote.customer.firstName},</p>
        <p>Thank you for choosing ${org?.name}. We have prepared a customized pest service quote for your property.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; font-size: 16px;">Quote: ${quote.quoteNumber} - ${quote.title}</p>
          <p style="margin: 5px 0 0 0; color: #4b5563;">Total Estimate: <strong>${formatMoney(quote.totalCents, org?.currency || "USD")}</strong></p>
        </div>

        <p>You can review all line items and accept or decline online with one click:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${publicUrl}" style="background-color: #2d6a4f; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Review & Accept Quote
          </a>
        </div>

        <p style="font-size: 12px; color: #6b7280;">If the button above does not work, copy and paste this link into your browser:<br/><a href="${publicUrl}">${publicUrl}</a></p>
      </div>
    `;

    const emailRes = await sendEmail({
      to: quote.customer.email,
      subject: `Pest Control Quote from ${org?.name || "PestPilot"}: ${quote.quoteNumber}`,
      html,
    });

    if (emailRes.success) {
      await scopedDb.quotes.update(quote.id, {
        status: "SENT",
      });
      revalidatePath("/quotes");
    }

    return { success: emailRes.success, publicUrl };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send quote";
    return { success: false, error: msg };
  }
}

/**
 * Public action: Customer accepts quote online without login
 */
export async function acceptPublicQuoteAction(publicToken: string) {
  try {
    const quote = await db.quote.findUnique({
      where: { publicToken },
      include: { organization: true },
    });

    if (!quote) return { success: false, error: "Quote not found" };
    if (quote.status === "ACCEPTED") return { success: true, message: "Quote was already accepted" };

    await db.quote.update({
      where: { id: quote.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Notify organization
    if (quote.organization.email) {
      await sendEmail({
        to: quote.organization.email,
        subject: `Quote Accepted! ${quote.quoteNumber}`,
        html: `<p>Customer accepted quote <strong>${quote.quoteNumber}</strong> for ${formatMoney(quote.totalCents, quote.organization.currency)}. You can now schedule the initial service job in PestPilot.</p>`,
      });
    }

    revalidatePath(`/quote/${publicToken}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to accept quote";
    return { success: false, error: msg };
  }
}

/**
 * Public action: Customer declines quote online without login
 */
export async function declinePublicQuoteAction(publicToken: string, reason?: string) {
  try {
    const quote = await db.quote.findUnique({
      where: { publicToken },
      include: { organization: true },
    });

    if (!quote) return { success: false, error: "Quote not found" };

    await db.quote.update({
      where: { id: quote.id },
      data: {
        status: "DECLINED",
        declinedAt: new Date(),
        declineReason: reason || "No reason provided",
        version: { increment: 1 },
      },
    });

    revalidatePath(`/quote/${publicToken}`);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to decline quote";
    return { success: false, error: msg };
  }
}

