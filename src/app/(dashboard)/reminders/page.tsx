import * as React from "react";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { RemindersClient } from "./reminders-client";

export default async function RemindersPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const reminders = await db.reminder.findMany({
    where: {
      organizationId: user.organizationId,
      deletedAt: null,
    },
    include: {
      customer: true,
      job: true,
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Automated Customer Reminders
          </h1>
          <p className="text-sm text-muted-foreground">
            Appointment alerts, recurring service due notices, and invoice overdue follow-ups via email and SMS
          </p>
        </div>
      </div>

      <RemindersClient initialReminders={reminders} />
    </div>
  );
}

