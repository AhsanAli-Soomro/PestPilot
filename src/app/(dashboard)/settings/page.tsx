import * as React from "react";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const [org, members, auditLogs] = await Promise.all([
    db.organization.findUnique({
      where: { id: user.organizationId },
      include: { subscription: true },
    }),
    db.membership.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.auditLog.findMany({
      where: { organizationId: user.organizationId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!org) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Settings & Billing
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure company branding, tax rates, team access, and subscription plans
          </p>
        </div>
      </div>

      <SettingsClient
        organization={org}
        members={members}
        auditLogs={auditLogs}
        currentUserRole={user.role}
      />
    </div>
  );
}

