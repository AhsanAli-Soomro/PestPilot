import * as React from "react";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { ScheduleClient } from "./schedule-client";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SchedulePage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const sp = await searchParams;
  const initialCustomerId = typeof sp.customerId === "string" ? sp.customerId : undefined;

  // Technicians see only their assigned jobs, owners/admins see all
  const technicianFilter = user.role === Role.TECHNICIAN ? { technicianId: user.id } : {};

  const [jobs, customers, teamMembers] = await Promise.all([
    db.job.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
        ...technicianFilter,
      },
      include: {
        customer: true,
        property: true,
        technician: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ scheduledDate: "asc" }, { routeOrder: "asc" }],
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
    db.membership.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const technicians = teamMembers.map((m) => ({
    id: m.user.id,
    name: m.user.name || m.user.email,
    role: m.role,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Dispatch & Scheduling
          </h1>
          <p className="text-sm text-muted-foreground">
            Calendar and route management for your field technicians
          </p>
        </div>
      </div>

      <ScheduleClient
        initialJobs={jobs}
        customers={customers}
        technicians={technicians}
        initialCustomerId={initialCustomerId}
        userRole={user.role}
      />
    </div>
  );
}

