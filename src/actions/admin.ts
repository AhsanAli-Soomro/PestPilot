"use server";

import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin";
import { PlanTier, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * 1. Fetch Platform-wide KPI Statistics & Metrics
 */
export async function getPlatformOverviewAction() {
  await requireSuperAdmin();

  try {
    const [
      totalOrgs,
      totalUsers,
      totalCustomers,
      totalJobs,
      totalInvoices,
      orgsByTier,
      recentOrgs,
      recentUsers,
    ] = await Promise.all([
      db.organization.count({ where: { deletedAt: null } }),
      db.user.count({ where: { deletedAt: null } }),
      db.customer.count({ where: { deletedAt: null } }),
      db.job.count({ where: { deletedAt: null } }),
      db.invoice.count({ where: { deletedAt: null } }),
      db.organization.groupBy({
        by: ["planTier"],
        _count: { id: true },
        where: { deletedAt: null },
      }),
      db.organization.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          memberships: {
            where: { role: Role.OWNER },
            include: { user: true },
            take: 1,
          },
          _count: {
            select: {
              customers: true,
              jobs: true,
              invoices: true,
              memberships: true,
            },
          },
        },
      }),
      db.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          memberships: {
            include: { organization: true },
            take: 1,
          },
        },
      }),
    ]);

    // Calculate approximate MRR
    // Free: $0, Pro: $29/mo, Business: $59/mo
    let mrr = 0;
    const tierCounts: Record<string, number> = {
      FREE: 0,
      PRO: 0,
      BUSINESS: 0,
    };

    for (const group of orgsByTier) {
      tierCounts[group.planTier] = group._count.id;
      if (group.planTier === PlanTier.PRO) mrr += group._count.id * 29;
      if (group.planTier === PlanTier.BUSINESS) mrr += group._count.id * 59;
    }

    return {
      success: true,
      stats: {
        totalOrgs,
        totalUsers,
        totalCustomers,
        totalJobs,
        totalInvoices,
        mrr,
        tierCounts,
        recentOrgs: recentOrgs.map((o) => ({
          id: o.id,
          name: o.name,
          slug: o.slug,
          planTier: o.planTier,
          createdAt: o.createdAt,
          ownerName: o.memberships[0]?.user?.name || "N/A",
          ownerEmail: o.memberships[0]?.user?.email || "N/A",
          customerCount: o._count.customers,
          jobCount: o._count.jobs,
          invoiceCount: o._count.invoices,
          memberCount: o._count.memberships,
        })),
        recentUsers: recentUsers.map((u) => ({
          id: u.id,
          name: u.name || "Unnamed",
          email: u.email,
          createdAt: u.createdAt,
          company: u.memberships[0]?.organization?.name || "No Company",
          role: u.memberships[0]?.role || "N/A",
        })),
      },
    };
  } catch (error: any) {
    console.error("Failed to fetch admin overview:", error);
    return { success: false, error: error.message || "Failed to load platform stats" };
  }
}

/**
 * 2. Fetch All Organizations (Tenants)
 */
export async function getAllOrganizationsAction() {
  await requireSuperAdmin();

  try {
    const orgs = await db.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          where: { role: Role.OWNER },
          include: { user: true },
          take: 1,
        },
        subscription: true,
        _count: {
          select: {
            customers: true,
            jobs: true,
            invoices: true,
            memberships: true,
            quotes: true,
          },
        },
      },
    });

    return {
      success: true,
      organizations: orgs.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        planTier: o.planTier,
        currency: o.currency,
        createdAt: o.createdAt,
        ownerName: o.memberships[0]?.user?.name || "No Owner",
        ownerEmail: o.memberships[0]?.user?.email || "N/A",
        subscriptionStatus: o.subscription?.status || "active",
        customerCount: o._count.customers,
        jobCount: o._count.jobs,
        invoiceCount: o._count.invoices,
        memberCount: o._count.memberships,
        quoteCount: o._count.quotes,
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 3. Update Plan Tier for any Organization (Free -> Pro -> Business)
 */
export async function updateOrganizationPlanAction(orgId: string, planTier: PlanTier) {
  await requireSuperAdmin();

  try {
    await db.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: orgId },
        data: { planTier },
      });

      await tx.subscription.upsert({
        where: { organizationId: orgId },
        update: { plan: planTier },
        create: {
          organizationId: orgId,
          plan: planTier,
          status: "active",
        },
      });
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 4. Fetch All Users in the Entire System
 */
export async function getAllPlatformUsersAction() {
  await requireSuperAdmin();

  try {
    const users = await db.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          where: { deletedAt: null },
          include: { organization: true },
        },
      },
    });

    return {
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name || "N/A",
        email: u.email,
        phone: u.phone || "N/A",
        isSuperAdmin: Boolean(u.isSuperAdmin),
        createdAt: u.createdAt,
        companies: u.memberships.map((m) => ({
          orgName: m.organization.name,
          role: m.role,
        })),
      })),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 5. Toggle Super Admin Access for a User
 */
export async function toggleSuperAdminAction(userId: string, isSuperAdmin: boolean) {
  await requireSuperAdmin();

  try {
    await db.user.update({
      where: { id: userId },
      data: { isSuperAdmin },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

