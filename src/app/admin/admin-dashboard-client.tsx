"use client";

import * as React from "react";
import {
  Building2,
  Users,
  Calendar,
  Receipt,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Database,
  Server,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanTier } from "@prisma/client";
import { toast } from "sonner";
import { updateOrganizationPlanAction, toggleSuperAdminAction } from "@/actions/admin";

interface AdminDashboardClientProps {
  initialOverview: any;
  initialOrganizations: any[];
  initialUsers: any[];
}

export function AdminDashboardClient({
  initialOverview,
  initialOrganizations,
  initialUsers,
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = React.useState<"overview" | "companies" | "users" | "health">("overview");
  const [organizations, setOrganizations] = React.useState(initialOrganizations);
  const [users, setUsers] = React.useState(initialUsers);
  const [stats, setStats] = React.useState(initialOverview);

  // Search queries
  const [orgSearch, setOrgSearch] = React.useState("");
  const [userSearch, setUserSearch] = React.useState("");
  const [planFilter, setPlanFilter] = React.useState<string>("ALL");

  const [updatingOrgId, setUpdatingOrgId] = React.useState<string | null>(null);

  // Filter organizations
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
      org.slug.toLowerCase().includes(orgSearch.toLowerCase()) ||
      org.ownerEmail.toLowerCase().includes(orgSearch.toLowerCase());
    const matchesTier = planFilter === "ALL" || org.planTier === planFilter;
    return matchesSearch && matchesTier;
  });

  // Filter users
  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.companies.some((c: any) => c.orgName.toLowerCase().includes(userSearch.toLowerCase()))
    );
  });

  // Handle plan upgrade/downgrade
  const handlePlanChange = async (orgId: string, newTier: PlanTier) => {
    setUpdatingOrgId(orgId);
    try {
      const res = await updateOrganizationPlanAction(orgId, newTier);
      if (res.success) {
        toast.success(`Plan updated to ${newTier} successfully!`);
        setOrganizations((prev) =>
          prev.map((o) => (o.id === orgId ? { ...o, planTier: newTier } : o))
        );
      } else {
        toast.error(res.error || "Failed to update plan");
      }
    } catch {
      toast.error("Error updating plan tier");
    } finally {
      setUpdatingOrgId(null);
    }
  };

  // Handle toggle super admin
  const handleToggleSuperAdmin = async (userId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    try {
      const res = await toggleSuperAdminAction(userId, newVal);
      if (res.success) {
        toast.success(newVal ? "User promoted to Super Admin!" : "Super Admin access revoked.");
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isSuperAdmin: newVal } : u))
        );
      } else {
        toast.error(res.error || "Failed to toggle status");
      }
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            Platform Master Console
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Global monitoring, tenant oversight, and platform-wide configuration
          </p>
        </div>

        {/* Tab Buttons (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border rounded-xl overflow-x-auto no-scrollbar w-full sm:w-auto -mx-1 sm:mx-0 px-1 sm:px-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview & Metrics
          </button>
          <button
            onClick={() => setActiveTab("companies")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "companies"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Companies ({organizations.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "users"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 whitespace-nowrap ${
              activeTab === "health"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            System Health
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & KEY METRICS
      ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border shadow-sm bg-gradient-to-br from-card to-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Companies
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalOrgs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active tenants across all regions
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-gradient-to-br from-card to-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Platform Users
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Owners, managers, and field techs
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-gradient-to-br from-card to-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Jobs Executed
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.totalJobs}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalCustomers} end customers serviced
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm bg-gradient-to-br from-card to-emerald-500/10 border-emerald-500/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Platform MRR
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${stats.mrr.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.tierCounts.PRO || 0} Pro • {stats.tierCounts.BUSINESS || 0} Business
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Tier Breakdown */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Subscription Plan Distribution</CardTitle>
              <CardDescription>Breakdown of active companies by paid tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Free Tier</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      $0/mo
                    </span>
                  </div>
                  <div className="text-2xl font-black mt-2 text-foreground">
                    {stats.tierCounts.FREE || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">1 truck starter tier</p>
                </div>

                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Starter (Pro)</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      $19/mo
                    </span>
                  </div>
                  <div className="text-2xl font-black mt-2 text-foreground">
                    {stats.tierCounts.PRO || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">2 users included + $9/mo extra</p>
                </div>

                <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Professional</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                      $39/mo
                    </span>
                  </div>
                  <div className="text-2xl font-black mt-2 text-foreground">
                    {stats.tierCounts.BUSINESS || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">5 users included + $9/mo extra</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Companies & Recent Signups Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Companies */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold">Recent Registered Companies</CardTitle>
                  <CardDescription>Latest organizations onboarded to PestPilot</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("companies")}
                  className="text-xs rounded-xl"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {stats.recentOrgs.map((org: any) => (
                    <div key={org.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                          {org.name}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              org.planTier === "BUSINESS"
                                ? "bg-indigo-500/20 text-indigo-500"
                                : org.planTier === "PRO"
                                ? "bg-amber-500/20 text-amber-500"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {org.planTier}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Owner: {org.ownerName} ({org.ownerEmail})
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs font-semibold text-foreground">
                          {org.customerCount} customers • {org.jobCount} jobs
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold">Recent Registered Users</CardTitle>
                  <CardDescription>New accounts created on the platform</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("users")}
                  className="text-xs rounded-xl"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {stats.recentUsers.map((user: any) => (
                    <div key={user.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-sm text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="sm:text-right">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                          {user.role}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{user.company}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: COMPANIES / TENANTS DIRECTORY
      ========================================================================= */}
      {activeTab === "companies" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* Controls: Search and Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search companies, slugs, owners..."
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground font-medium">Plan:</span>
              {(["ALL", "FREE", "PRO", "BUSINESS"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setPlanFilter(tier)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    planFilter === tier
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Cards View (Visible on small screens) */}
          <div className="space-y-3 md:hidden">
            {filteredOrgs.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-border rounded-xl bg-card">
                No companies found matching your search.
              </div>
            ) : (
              filteredOrgs.map((org) => (
                <div key={org.id} className="p-3.5 rounded-xl border border-border bg-card space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{org.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{org.slug}</p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        org.planTier === "BUSINESS"
                          ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                          : org.planTier === "PRO"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {org.planTier}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Owner: <span className="font-medium text-foreground">{org.ownerName}</span> ({org.ownerEmail})</p>
                    <p className="text-[11px]">Joined: {new Date(org.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-muted/40 rounded-lg text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Customers</span>
                      <span className="font-bold text-foreground">{org.customerCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Jobs</span>
                      <span className="font-bold text-foreground">{org.jobCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Invoices</span>
                      <span className="font-bold text-foreground">{org.invoiceCount}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground font-semibold">Switch Plan:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={updatingOrgId === org.id || org.planTier === PlanTier.FREE}
                        onClick={() => handlePlanChange(org.id, PlanTier.FREE)}
                        className="px-2 py-1 rounded text-[11px] font-bold bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors"
                      >
                        Free
                      </button>
                      <button
                        disabled={updatingOrgId === org.id || org.planTier === PlanTier.PRO}
                        onClick={() => handlePlanChange(org.id, PlanTier.PRO)}
                        className="px-2 py-1 rounded text-[11px] font-bold bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 disabled:opacity-40 transition-colors"
                      >
                        Pro
                      </button>
                      <button
                        disabled={updatingOrgId === org.id || org.planTier === PlanTier.BUSINESS}
                        onClick={() => handlePlanChange(org.id, PlanTier.BUSINESS)}
                        className="px-2 py-1 rounded text-[11px] font-bold bg-indigo-500/20 text-indigo-600 hover:bg-indigo-500/30 disabled:opacity-40 transition-colors"
                      >
                        Business
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Companies Table (Hidden on mobile) */}
          <Card className="hidden md:block border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Owner Contact</th>
                    <th className="py-3 px-4">Current Plan</th>
                    <th className="py-3 px-4 text-center">Customers</th>
                    <th className="py-3 px-4 text-center">Jobs</th>
                    <th className="py-3 px-4 text-center">Invoices</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Quick Tier Upgrade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No companies found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org) => (
                      <tr key={org.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-foreground text-sm">{org.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{org.slug}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{org.ownerName}</p>
                          <p className="text-[11px] text-muted-foreground">{org.ownerEmail}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              org.planTier === "BUSINESS"
                                ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                                : org.planTier === "PRO"
                                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {org.planTier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-foreground">
                          {org.customerCount}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-foreground">
                          {org.jobCount}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-foreground">
                          {org.invoiceCount}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              disabled={updatingOrgId === org.id || org.planTier === PlanTier.FREE}
                              onClick={() => handlePlanChange(org.id, PlanTier.FREE)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-muted hover:bg-muted/80 disabled:opacity-40 transition-colors"
                            >
                              Free
                            </button>
                            <button
                              disabled={updatingOrgId === org.id || org.planTier === PlanTier.PRO}
                              onClick={() => handlePlanChange(org.id, PlanTier.PRO)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 disabled:opacity-40 transition-colors"
                            >
                              Pro
                            </button>
                            <button
                              disabled={updatingOrgId === org.id || org.planTier === PlanTier.BUSINESS}
                              onClick={() => handlePlanChange(org.id, PlanTier.BUSINESS)}
                              className="px-2 py-1 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-600 hover:bg-indigo-500/30 disabled:opacity-40 transition-colors"
                            >
                              Business
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PLATFORM USERS DIRECTORY
      ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* Controls: Search */}
          <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name, email, or company..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg"
              />
            </div>
          </div>

          {/* Mobile Users View (Visible on small screens) */}
          <div className="space-y-3 md:hidden">
            {filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-border rounded-xl bg-card">
                No users found matching your search.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="p-3.5 rounded-xl border border-border bg-card space-y-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {user.phone && user.phone !== "N/A" && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">📞 {user.phone}</p>
                      )}
                    </div>
                    {user.isSuperAdmin ? (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        Super Admin
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                        User
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {user.companies.map((c: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-muted font-medium text-foreground"
                      >
                        {c.orgName} ({c.role})
                      </span>
                    ))}
                    {user.companies.length === 0 && (
                      <span className="text-[10px] text-muted-foreground italic">
                        No Organization
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleToggleSuperAdmin(user.id, user.isSuperAdmin)}
                      className="px-2.5 py-1 rounded text-xs font-semibold border border-border hover:bg-muted transition-colors"
                    >
                      {user.isSuperAdmin ? "Revoke Admin" : "Make Super Admin"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Users Table (Hidden on mobile) */}
          <Card className="hidden md:block border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Companies & Roles</th>
                    <th className="py-3 px-4">Super Admin Access</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-foreground text-sm">{user.name}</p>
                          <p className="text-[11px] text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{user.phone}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            {user.companies.map((c: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-muted font-medium text-foreground"
                              >
                                {c.orgName} ({c.role})
                              </span>
                            ))}
                            {user.companies.length === 0 && (
                              <span className="text-[11px] text-muted-foreground italic">
                                No Organization
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {user.isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 border border-amber-500/30">
                              <ShieldCheck className="w-3 h-3" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Regular User</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleSuperAdmin(user.id, user.isSuperAdmin)}
                            className="px-2.5 py-1 rounded text-xs font-semibold border border-border hover:bg-muted transition-colors"
                          >
                            {user.isSuperAdmin ? "Revoke Admin" : "Make Super Admin"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SYSTEM & DATABASE HEALTH
      ========================================================================= */}
      {activeTab === "health" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database & Runtime Card */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Database Infrastructure
                </CardTitle>
                <CardDescription>Live database engine & connection state</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Database Engine:</span>
                  <span className="font-semibold text-foreground">PostgreSQL 16 (Prisma Postgres / Neon)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Connection Status:</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online & Synchronized
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">ORM Version:</span>
                  <span className="font-mono text-foreground">Prisma Client v6.19.3</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Schema Models:</span>
                  <span className="font-semibold text-foreground">13 Tables Active</span>
                </div>
              </CardContent>
            </Card>

            {/* Application Environment Card */}
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-500" />
                  Application Runtime
                </CardTitle>
                <CardDescription>Next.js hosting and security configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Framework:</span>
                  <span className="font-semibold text-foreground">Next.js 15.5 (App Router)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Authentication:</span>
                  <span className="font-semibold text-foreground">Auth.js v5 (NextAuth JWT)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Offline Engine:</span>
                  <span className="font-semibold text-foreground">Dexie IndexedDB + Service Worker</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Hosting Provider:</span>
                  <span className="font-semibold text-foreground">Vercel Serverless Edge</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

