import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PublicInvoiceClient } from "./public-invoice-client";

export const metadata: Metadata = {
  title: "Service Invoice & Payment",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PublicInvoicePage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const sp = await searchParams;
  const paymentSuccess = sp.paid === "true";

  const invoice = await db.invoice.findUnique({
    where: { publicToken: token },
    include: {
      organization: true,
      customer: true,
      job: {
        include: {
          property: true,
          treatmentLogs: { where: { deletedAt: null } },
          technician: { select: { name: true, phone: true, licenseNumber: true } },
        },
      },
      lineItems: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (!invoice || invoice.deletedAt) {
    notFound();
  }

  return (
    <PublicInvoiceClient
      invoice={invoice}
      paymentSuccess={paymentSuccess}
    />
  );
}

