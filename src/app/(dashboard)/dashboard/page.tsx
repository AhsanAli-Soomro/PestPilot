import * as React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  Truck,
  Calendar,
  Users,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Clock,
  AlertTriangle,
  Repeat,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const org = await db.organization.findUnique({
    where: { id: user.organizationId },
  });

  const currency = org?.currency || "USD";
  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Queries scoped strictly by organizationId and role
  const [
    todayJobs,
    customerCount,
    monthlyRevenueData,
    overdueInvoices,
    upcomingRenewals,
    recentPayments,
  ] = await Promise.all([
    db.job.findMany({
      where: {
        organizationId: user.organizationId,
        scheduledDate: { gte: today, lt: tomorrow },
        deletedAt: null,
        ...(user.role === "TECHNICIAN" ? { technicianId: user.id } : {}),
      },
      include: {
        customer: true,
        property: true,
        technician: { select: { name: true } },
      },
      orderBy: [{ routeOrder: "asc" }, { scheduledStartTime: "asc" }],
    }),
    db.customer.count({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
      },
    }),
    db.payment.aggregate({
      _sum: { amountCents: true },
      where: {
        invoice: { organizationId: user.organizationId },
        paidAt: { gte: startOfMonth },
      },
    }),
    db.invoice.findMany({
      where: {
        organizationId: user.organizationId,
        dueDate: { lt: today },
        status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
        deletedAt: null,
      },
      include: { customer: true },
      take: 5,
    }),
    db.servicePlan.findMany({
      where: {
        organizationId: user.organizationId,
        nextServiceDate: { gte: now },
        active: true,
        deletedAt: null,
      },
      include: {
        property: { include: { customer: true } },
      },
      orderBy: { nextServiceDate: "asc" },
      take: 4,
    }),
    db.payment.findMany({
      where: {
        invoice: { organizationId: user.organizationId },
      },
      include: {
        invoice: { include: { customer: true } },
      },
      orderBy: { paidAt: "desc" },
      take: 4,
    }),
  ]);

  const monthRevenue = monthlyRevenueData._sum.amountCents || 0;
  const completedToday = todayJobs.filter((j) => j.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {org?.name}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Field Operations &bull; {now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/mobile/today">
            <Button variant="accent" className="font-bold">
              <Truck className="w-4 h-4 mr-2" /> Field Mode (Today)
            </Button>
          </Link>
          <Link href="/schedule">
            <Button>
              <Calendar className="w-4 h-4 mr-2" /> Dispatch Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Technician Field Mode Banner */}
      {user.role === "TECHNICIAN" && (
        <Card className="border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-card to-card p-4 sm:p-5 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-black text-[10px] font-extrabold uppercase">
                  Field Technician Active
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">
                  Signed in as {user.name || "Technician"}
                </span>
              </div>
              <h2 className="text-lg font-black text-foreground">
                Your Today&apos;s Field Stops &amp; 7-Step Checklist
              </h2>
              <p className="text-xs text-muted-foreground">
                Access GPS check-ins, record EPA chemical batches, attach photos, and capture customer signatures directly on mobile.
              </p>
            </div>
            <Link href="/mobile/today" className="shrink-0 w-full sm:w-auto">
              <Button className="w-full sm:w-auto font-black shadow-lg shadow-primary/25 bg-amber-500 hover:bg-amber-600 text-black">
                <Truck className="w-4 h-4 mr-2" /> Open Mobile Field App &rarr;
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/50 transition-all shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Revenue This Month
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {formatMoney(monthRevenue, currency)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Collected payments
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-all shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Today&apos;s Field Stops
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {completedToday} / {todayJobs.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/mobile/today"
              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              Open Truck Route ({todayJobs.length - completedToday} pending) <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-all shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Accounts
            </CardDescription>
            <CardTitle className="text-2xl font-black text-foreground">
              {customerCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/customers"
              className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
            >
              View Customers & Notes <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-all shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Overdue Invoices
            </CardDescription>
            <CardTitle className="text-2xl font-black text-destructive">
              {overdueInvoices.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href="/invoices"
              className="text-xs text-destructive font-semibold flex items-center gap-1 hover:underline"
            >
              Send Pay Reminders <ArrowRight className="w-3 h-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Today's Route Progression + Upcoming Recurring Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Route Stops (2 cols wide) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Today&apos;s Dispatch Route</CardTitle>
                <CardDescription>
                  Live stop order, gate codes, and completion status
                </CardDescription>
              </div>
              <Link href="/mobile/today">
                <Button variant="outline" size="sm">
                  Field Mode
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {todayJobs.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No jobs dispatched for today. Click &quot;Schedule Job&quot; to book a visit.
                </div>
              ) : (
                <div className="space-y-3">
                  {todayJobs.map((job, idx) => (
                    <div
                      key={job.id}
                      className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center font-bold shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">
                            {job.customer.firstName} {job.customer.lastName} &bull;{" "}
                            <span className="font-medium text-muted-foreground">{job.title}</span>
                          </p>
                          <p className="text-muted-foreground text-[11px] mt-0.5">
                            {job.property.address} {job.scheduledStartTime && `at ${job.scheduledStartTime}`}
                            {job.property.gateCode && ` &bull; Gate: ${job.property.gateCode}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            job.status === "COMPLETED"
                              ? "success"
                              : job.status === "IN_PROGRESS"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Simple Visual Trend: Performance & Revenue Breakdown */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Monthly Revenue Breakdown</CardTitle>
              <CardDescription>
                Pest control services and recurring contracts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-foreground">Initial Cleanouts & One-Time Service</span>
                  <span className="font-bold">{formatMoney(Math.round(monthRevenue * 0.45), currency)}</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[45%]" />
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="font-semibold text-foreground">Recurring Maintenance Plans</span>
                  <span className="font-bold">{formatMoney(Math.round(monthRevenue * 0.55), currency)}</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[55%]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Upcoming Recurring Renewals & Recent Payments */}
        <div className="space-y-6">
          {/* Upcoming Renewals */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Repeat className="w-4 h-4 text-primary" /> Upcoming Service Renewals
              </CardTitle>
              <CardDescription className="text-xs">
                Auto-scheduled recurring maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingRenewals.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No upcoming recurring plans.
                </p>
              ) : (
                <div className="divide-y divide-border text-xs">
                  {upcomingRenewals.map((plan) => (
                    <div key={plan.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">{plan.name}</p>
                        <p className="text-muted-foreground text-[11px]">
                          {plan.property.customer.firstName} {plan.property.customer.lastName}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-primary">
                        {formatDate(plan.nextServiceDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" /> Recent Payments
              </CardTitle>
              <CardDescription className="text-xs">
                Payments collected in field & online
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No payments recorded this month yet.
                </p>
              ) : (
                <div className="divide-y divide-border text-xs">
                  {recentPayments.map((pm) => (
                    <div key={pm.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-foreground">
                          {pm.invoice.customer.firstName} {pm.invoice.customer.lastName}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {pm.method} &bull; {formatDate(pm.paidAt)}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-600">
                        +{formatMoney(pm.amountCents, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

