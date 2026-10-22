import * as React from "react";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { ServicePlansClient } from "./service-plans-client";

export default async function ServicePlansPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const [plans, customers, org] = await Promise.all([
    db.servicePlan.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        property: {
          include: { customer: true },
        },
        jobs: {
          where: { deletedAt: null },
          orderBy: { scheduledDate: "desc" },
          take: 3,
        },
      },
      orderBy: { nextServiceDate: "asc" },
    }),
    db.customer.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        properties: { where: { deletedAt: null } },
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
            Recurring Service Plans
          </h1>
          <p className="text-sm text-muted-foreground">
            Automate repeat maintenance, future job scheduling, and automatic invoicing on job completion
          </p>
        </div>
      </div>

      <ServicePlansClient
        initialPlans={plans}
        customers={customers}
        currency={org?.currency || "USD"}
      />
    </div>
  );
}

