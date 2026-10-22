"use server";

import { getScopedDb } from "@/lib/session";
import { db } from "@/lib/db";
import { stripe, checkPlanLimits, PLAN_LIMITS } from "@/lib/stripe";
import { organizationSettingsSchema } from "@/lib/validations";
import { Role, PlanTier } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getBaseUrl } from "@/lib/url";

export async function createSubscriptionCheckoutAction(planTier: "PRO" | "BUSINESS") {
  try {
    const scopedDb = await getScopedDb();
    if (!scopedDb.isOwner) {
      return { success: false, error: "Only the company owner can manage subscriptions" };
    }

    const org = await scopedDb.getOrganization();
    if (!org) throw new Error("Organization not found");

    const appUrl = await getBaseUrl();
    const limits = PLAN_LIMITS[planTier];

    // If live Stripe keys are present
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
      let customerId = org.subscription?.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          name: org.name,
          email: org.email || scopedDb.userEmail,
          metadata: { organizationId: org.id },
        });
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `PestPilot ${limits.name} Plan`,
                description: `PestPilot Field Service Subscription (${limits.maxUsers} users, unlimited jobs)`,
              },
              unit_amount: limits.priceCents,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        metadata: {
          organizationId: org.id,
          planTier,
        },
        success_url: `${appUrl}/settings?billing=success`,
        cancel_url: `${appUrl}/settings?billing=cancelled`,
      });

      return { success: true, url: session.url };
    }

    // Demo / Simulation Mode: upgrade directly
    const tier = planTier === "PRO" ? PlanTier.PRO : PlanTier.BUSINESS;
    await db.organization.update({
      where: { id: org.id },
      data: { planTier: tier, version: { increment: 1 } },
    });

    await db.subscription.upsert({
      where: { organizationId: org.id },
      update: { plan: tier, status: "active" },
      create: {
        organizationId: org.id,
        plan: tier,
        status: "active",
      },
    });

    revalidatePath("/settings");
    return { success: true, simulated: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to initiate subscription";
    return { success: false, error: msg };
  }
}

export async function createCustomerPortalAction() {
  try {
    const scopedDb = await getScopedDb();
    const org = await scopedDb.getOrganization();
    if (!org?.subscription?.stripeCustomerId) {
      return { success: false, error: "No active Stripe customer found" };
    }

    const appUrl = await getBaseUrl();

    const portal = await stripe.billingPortal.sessions.create({
      customer: org.subscription.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    });

    return { success: true, url: portal.url };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to open billing portal";
    return { success: false, error: msg };
  }
}

export async function inviteTeamMemberAction(formData: FormData) {
  try {
    const scopedDb = await getScopedDb();
    if (!scopedDb.isAdminOrOwner) {
      return { success: false, error: "Only owners and admins can invite team members" };
    }

    // 1. Enforce user plan limits server-side!
    const limitCheck = await checkPlanLimits(scopedDb.organizationId, "users");
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.reason };
    }

    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const name = formData.get("name") as string;
    const role = (formData.get("role") as Role) || Role.TECHNICIAN;

    if (!email) {
      return { success: false, error: "Email is required" };
    }

    // Check if user exists or create placeholder
    let targetUser = await db.user.findUnique({ where: { email } });
    if (!targetUser) {
      targetUser = await db.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
        },
      });
    }

    // Check membership
    const existingMembership = await db.membership.findFirst({
      where: { organizationId: scopedDb.organizationId, userId: targetUser.id, deletedAt: null },
    });

    if (existingMembership) {
      return { success: false, error: "This user is already part of your organization" };
    }

    await db.membership.create({
      data: {
        organizationId: scopedDb.organizationId,
        userId: targetUser.id,
        role,
        inviteAccepted: true,
      },
    });

    await scopedDb.logAudit("INVITE_MEMBER", "User", targetUser.id, { email, role });

    revalidatePath("/settings");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to invite member";
    return { success: false, error: msg };
  }
}

export async function updateCompanySettingsAction(formData: FormData) {
  try {
    const scopedDb = await getScopedDb();

    const rawData = {
      name: formData.get("name") as string,
      currency: (formData.get("currency") as string) || "USD",
      timezone: (formData.get("timezone") as string) || "America/New_York",
      taxRatePercent: formData.get("taxRatePercent") ? Number(formData.get("taxRatePercent")) : 0,
      invoicePrefix: (formData.get("invoicePrefix") as string) || "INV-",
      quotePrefix: (formData.get("quotePrefix") as string) || "QTE-",
      address: (formData.get("address") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      website: (formData.get("website") as string) || null,
    };

    const validated = organizationSettingsSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    await scopedDb.updateOrganization(validated.data);
    await scopedDb.logAudit("UPDATE_SETTINGS", "Organization", scopedDb.organizationId, validated.data);

    revalidatePath("/settings");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update settings";
    return { success: false, error: msg };
  }
}

