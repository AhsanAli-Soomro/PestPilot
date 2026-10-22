import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { PlanTier } from "@prisma/client";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In development or when test secret is omitted
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("[Stripe Webhook Error]:", msg);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        const planTier = session.metadata?.planTier as "PRO" | "BUSINESS" | undefined;
        const invoiceId = session.metadata?.invoiceId;

        // 1. Subscription Checkout
        if (organizationId && planTier) {
          const tier = planTier === "PRO" ? PlanTier.PRO : PlanTier.BUSINESS;

          await db.organization.update({
            where: { id: organizationId },
            data: { planTier: tier, version: { increment: 1 } },
          });

          await db.subscription.upsert({
            where: { organizationId },
            update: {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              plan: tier,
              status: "active",
            },
            create: {
              organizationId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              plan: tier,
              status: "active",
            },
          });
        }

        // 2. Customer Paid an Invoice
        if (invoiceId) {
          const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
          if (invoice) {
            const amountCents = session.amount_total || invoice.totalCents;
            await db.payment.create({
              data: {
                invoiceId: invoice.id,
                amountCents,
                method: "CARD",
                reference: session.payment_intent as string || session.id,
                notes: "Stripe Online Checkout Payment",
              },
            });

            const newPaid = invoice.paidCents + amountCents;
            await db.invoice.update({
              where: { id: invoice.id },
              data: {
                paidCents: newPaid,
                status: newPaid >= invoice.totalCents ? "PAID" : "PARTIALLY_PAID",
                version: { increment: 1 },
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const orgSub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });

        if (orgSub) {
          await db.subscription.update({
            where: { id: orgSub.id },
            data: {
              status: sub.status,
              currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const orgSub = await db.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });

        if (orgSub) {
          await db.organization.update({
            where: { id: orgSub.organizationId },
            data: { planTier: PlanTier.FREE, version: { increment: 1 } },
          });

          await db.subscription.update({
            where: { id: orgSub.id },
            data: { plan: PlanTier.FREE, status: "canceled" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    console.error("[Stripe Webhook Processing Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

