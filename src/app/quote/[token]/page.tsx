import * as React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PublicQuoteClient } from "./public-quote-client";

export const metadata: Metadata = {
  title: "Service Quote Approval",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicQuotePage({ params }: PageProps) {
  const { token } = await params;

  const quote = await db.quote.findUnique({
    where: { publicToken: token },
    include: {
      organization: true,
      customer: true,
      property: true,
      lineItems: true,
    },
  });

  if (!quote || quote.deletedAt) {
    notFound();
  }

  return <PublicQuoteClient quote={quote} />;
}

