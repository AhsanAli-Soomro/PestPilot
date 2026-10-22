import * as React from "react";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { QuoteBuilderClient } from "./quote-builder-client";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function QuotesPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return null;

  const sp = await searchParams;
  const initialCustomerId = typeof sp.customerId === "string" ? sp.customerId : undefined;
  const openNewQuote = sp.newQuote === "true";

  const [quotes, customers, org] = await Promise.all([
    db.quote.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        customer: true,
        property: true,
        lineItems: true,
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
            Estimates & Quotes
          </h1>
          <p className="text-sm text-muted-foreground">
            Build from pest service templates, email quotes, and track customer approvals online
          </p>
        </div>
      </div>

      <QuoteBuilderClient
        quotes={quotes}
        customers={customers}
        currency={org?.currency || "USD"}
        taxRatePercent={org?.taxRatePercent || 0}
        initialCustomerId={initialCustomerId}
        autoOpenCreate={openNewQuote}
      />
    </div>
  );
}

