import * as React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Phone, Mail, MapPin, Plus, ArrowRight } from "lucide-react";
import { CustomerListClient } from "./customer-list-client";

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const customers = await db.customer.findMany({
    where: {
      organizationId: user.organizationId,
      deletedAt: null,
    },
    include: {
      properties: {
        where: { deletedAt: null },
      },
      jobs: {
        where: { deletedAt: null },
        take: 1,
        orderBy: { scheduledDate: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Customers & Properties
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your residential and commercial accounts, addresses, and gate access codes
          </p>
        </div>
      </div>

      <CustomerListClient initialCustomers={customers} />
    </div>
  );
}

