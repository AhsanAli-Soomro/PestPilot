import * as React from "react";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { MobileTodayClient } from "./mobile-today-client";

export default async function MobileTodayPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // If technician, scope to their jobs
  const technicianFilter = user.role === Role.TECHNICIAN ? { technicianId: user.id } : {};

  const [jobs, org] = await Promise.all([
    db.job.findMany({
      where: {
        organizationId: user.organizationId,
        scheduledDate: { gte: today, lt: tomorrow },
        deletedAt: null,
        ...technicianFilter,
      },
      include: {
        customer: true,
        property: true,
        treatmentLogs: {
          where: { deletedAt: null },
        },
        invoices: {
          where: { deletedAt: null },
          include: { payments: true },
        },
      },
      orderBy: [{ routeOrder: "asc" }, { scheduledStartTime: "asc" }],
    }),
    db.organization.findUnique({
      where: { id: user.organizationId },
    }),
  ]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-10">
      <MobileTodayClient
        initialJobs={jobs}
        userName={user.name || "Technician"}
        currency={org?.currency || "USD"}
        organizationId={user.organizationId}
        userId={user.id}
      />
    </div>
  );
}

