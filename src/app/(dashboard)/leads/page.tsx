import { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { LeadsClient } from "./leads-client";

export const metadata: Metadata = {
  title: "Lead Management | PestPilot",
  description: "Track inquiries, follow-ups, and convert leads into active customers and jobs",
};

export default async function LeadsPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const customers = await db.customer.findMany({
    where: {
      organizationId: user.organizationId,
      deletedAt: null,
    },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Lead Management &amp; Inquiries</h1>
          <p className="text-xs text-muted-foreground">
            Manage incoming pest inquiries, follow-ups, and 1-click conversion to quotes
          </p>
        </div>
      </div>

      <LeadsClient customers={customers} currency="USD" />
    </div>
  );
}
