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
  },
  PRO: {
    maxUsers: 3,
    maxJobsPerMonth: Infinity,
    priceCents: 2900,
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_dummy",
    name: "Pro",
  },
  BUSINESS: {
    maxUsers: 10,
    maxJobsPerMonth: Infinity,
    priceCents: 5900,
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || "price_business_dummy",
    name: "Business",
  },
};

/**
 * Enforce subscription limits server-side
 */
export async function checkPlanLimits(
  organizationId: string,
  type: "jobs" | "users"
): Promise<{ allowed: boolean; reason?: string; current: number; max: number }> {
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
    if (userCount >= limits.maxUsers) {
      return {
        allowed: false,
        reason: `Your ${tier} plan only supports up to ${limits.maxUsers} user(s). Upgrade to add more technicians.`,
        current: userCount,
        max: limits.maxUsers,
      };
    }
    return { allowed: true, current: userCount, max: limits.maxUsers };
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

