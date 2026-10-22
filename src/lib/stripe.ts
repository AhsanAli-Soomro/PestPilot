import Stripe from "stripe";
import { db } from "./db";
import { PlanTier } from "@prisma/client";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key", {
  apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
  typescript: true,
});

export const PLAN_LIMITS = {
  FREE: {
    maxUsers: 1,
    maxJobsPerMonth: 20,
    priceCents: 0,
    priceId: "",
    name: "Free",
    additionalUserPriceCents: 0,
    additionalUserPriceLabel: "N/A",
    whiteLabelBranding: false,
  },
  PRO: {
    maxUsers: 2,
    maxJobsPerMonth: Infinity,
    priceCents: 1900,
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_starter_dummy",
    name: "Starter",
    additionalUserPriceCents: 900,
    additionalUserPriceLabel: "$9/mo per additional user",
    whiteLabelBranding: true,
  },
  BUSINESS: {
    maxUsers: 5,
    maxJobsPerMonth: Infinity,
    priceCents: 3900,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || "price_professional_dummy",
    name: "Professional",
    additionalUserPriceCents: 900,
    additionalUserPriceLabel: "$9/mo per additional user",
    whiteLabelBranding: true,
  },
};

/**
 * Enforce subscription limits server-side
 */
export async function checkPlanLimits(
  organizationId: string,
  type: "jobs" | "users"
): Promise<{
  allowed: boolean;
  reason?: string;
  current: number;
  max: number;
  isAdditional?: boolean;
  additionalCostPerMonth?: number;
}> {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: true,
    },
  });

  if (!org) return { allowed: false, reason: "Organization not found", current: 0, max: 0 };

  const tier: PlanTier = org.subscription?.plan || org.planTier || PlanTier.FREE;
  const limits = PLAN_LIMITS[tier];

  if (type === "users") {
    const userCount = await db.membership.count({
      where: { organizationId, deletedAt: null },
    });

    if (tier === PlanTier.FREE && userCount >= limits.maxUsers) {
      return {
        allowed: false,
        reason: "Your Free plan includes 1 user. Upgrade to Starter ($19/mo, 2 users included + $9/mo per additional user) to invite technicians.",
        current: userCount,
        max: limits.maxUsers,
      };
    }

    // On Starter (PRO) and Professional (BUSINESS), owners can add extra team members seamlessly at $9/mo each
    const isAdditional = userCount >= limits.maxUsers;
    const extraCount = Math.max(0, userCount - limits.maxUsers);

    return {
      allowed: true,
      current: userCount,
      max: limits.maxUsers,
      isAdditional,
      additionalCostPerMonth: extraCount * 9,
    };
  }

  if (type === "jobs") {
    if (limits.maxJobsPerMonth === Infinity) {
      return { allowed: true, current: 0, max: Infinity };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const jobsThisMonth = await db.job.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonth },
        deletedAt: null,
      },
    });

    if (jobsThisMonth >= limits.maxJobsPerMonth) {
      return {
        allowed: false,
        reason: `Your ${tier} plan limit of ${limits.maxJobsPerMonth} jobs/month reached. Please upgrade to Pro for unlimited jobs.`,
        current: jobsThisMonth,
        max: limits.maxJobsPerMonth,
      };
    }
    return { allowed: true, current: jobsThisMonth, max: limits.maxJobsPerMonth };
  }

  return { allowed: true, current: 0, max: Infinity };
}

