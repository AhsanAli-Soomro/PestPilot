import { Metadata } from "next";
import { getScopedDb } from "@/lib/session";
import { ComplaintsClient } from "./complaints-client";

export const metadata: Metadata = {
  title: "Complaints & Warranty Callbacks | PestPilot",
  description: "Track customer complaints, quality issues, and schedule free warranty callbacks",
};

export default async function ComplaintsPage() {
  const scopedDb = await getScopedDb();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Complaints &amp; Warranty Callbacks</h1>
          <p className="text-xs text-muted-foreground">
            Manage customer feedback, warranty retreatments, and prevent churn
          </p>
        </div>
      </div>

      <ComplaintsClient />
    </div>
  );
}
