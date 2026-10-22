import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileSpreadsheet,
  Receipt,
  Plus,
  ArrowLeft,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { CustomerDetailClient } from "./customer-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const customer = await db.customer.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      deletedAt: null,
    },
    include: {
      properties: {
        where: { deletedAt: null },
        include: {
          servicePlans: { where: { deletedAt: null } },
        },
      },
      jobs: {
        where: { deletedAt: null },
        include: {
          property: true,
          technician: { select: { name: true } },
        },
        orderBy: { scheduledDate: "desc" },
      },
      quotes: {
        where: { deletedAt: null },
        include: { lineItems: true },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        where: { deletedAt: null },
        include: { lineItems: true, payments: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const org = await db.organization.findUnique({
    where: { id: user.organizationId },
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground touch-target"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
      </div>

      <CustomerDetailClient
        customer={customer}
        currency={org?.currency || "USD"}
      />
    </div>
  );
}

