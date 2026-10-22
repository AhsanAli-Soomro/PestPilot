import { Metadata } from "next";
import { getScopedDb } from "@/lib/session";
import { InventoryClient } from "./inventory-client";

export const metadata: Metadata = {
  title: "Inventory & Chemical Stock | PestPilot",
  description: "Track EPA chemical products, batch lots, dilution ratios, and technician equipment",
};

export default async function InventoryPage() {
  const scopedDb = await getScopedDb();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Chemical &amp; Equipment Inventory</h1>
          <p className="text-xs text-muted-foreground">
            Manage pesticide stock, EPA registration lots, batch expiration dates, and fleet sprayers
          </p>
        </div>
      </div>

      <InventoryClient />
    </div>
  );
}
