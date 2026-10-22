import * as React from "react";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const [treatmentLogs, customers, org] = await Promise.all([
    db.treatmentLog.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        job: {
          include: { customer: true, property: true },
        },
        technician: {
          select: { name: true, licenseNumber: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.customer.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
      },
      orderBy: { firstName: "asc" },
    }),
    db.organization.findUnique({
      where: { id: user.organizationId },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Chemical Compliance Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Audit-ready EPA pesticide and termiticide application records. Export to CSV and official PDF reports.
          </p>
        </div>
      </div>

      <ReportsClient
        initialLogs={treatmentLogs}
        customers={customers}
        organizationName={org?.name || "PestPilot"}
      />
    </div>
  );
}

