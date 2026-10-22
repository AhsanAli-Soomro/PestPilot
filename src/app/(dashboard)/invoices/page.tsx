import * as React from "react";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { InvoiceListClient } from "./invoice-list-client";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const sp = await searchParams;
  const initialCustomerId = typeof sp.customerId === "string" ? sp.customerId : undefined;
  const openNewInvoice = sp.newInvoice === "true";

  const [invoices, customers, org] = await Promise.all([
    db.invoice.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        customer: true,
        job: true,
        lineItems: true,
        payments: { orderBy: { paidAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
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
            Invoicing & Payments
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate itemized invoices, record field payments, download PDFs, and send online pay links
          </p>
        </div>
      </div>

      <InvoiceListClient
        initialInvoices={invoices}
        customers={customers}
        organization={org}
        initialCustomerId={initialCustomerId}
        autoOpenCreate={openNewInvoice}
      />
    </div>
  );
}

