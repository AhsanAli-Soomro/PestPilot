import * as React from "react";
import { requireSuperAdmin } from "@/lib/admin";
import {
  getPlatformOverviewAction,
  getAllOrganizationsAction,
  getAllPlatformUsersAction,
} from "@/actions/admin";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const metadata = {
  title: "Master Super Admin Console | PestPilot",
  description: "Platform-wide management and metrics for PestPilot SaaS founder",
};

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  const [overviewRes, orgsRes, usersRes] = await Promise.all([
    getPlatformOverviewAction(),
    getAllOrganizationsAction(),
    getAllPlatformUsersAction(),
  ]);

  const stats = overviewRes.success
    ? overviewRes.stats
    : {
        totalOrgs: 0,
        totalUsers: 0,
        totalCustomers: 0,
        totalJobs: 0,
        totalInvoices: 0,
        mrr: 0,
        tierCounts: { FREE: 0, PRO: 0, BUSINESS: 0 },
        recentOrgs: [],
        recentUsers: [],
      };

  const organizations = orgsRes.success ? orgsRes.organizations || [] : [];
  const users = usersRes.success ? usersRes.users || [] : [];

  return (
    <AdminDashboardClient
      initialOverview={stats}
      initialOrganizations={organizations}
      initialUsers={users}
    />
  );
}
