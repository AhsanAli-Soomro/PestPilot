import { Metadata } from "next";
import { lookupCustomerPortalAction } from "@/actions/portal";
import { PortalClient } from "./portal-client";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Phone } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Customer Portal | PestPilot",
  description: "Manage pest control bookings, view upcoming visits, download certificates, and pay invoices online.",
};

interface PortalPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CustomerPortalPage({ searchParams }: PortalPageProps) {
  const params = await searchParams;
  const identifier = (params.id as string) || (params.email as string) || (params.phone as string) || "demo@example.com";

  const result = await lookupCustomerPortalAction(identifier);
  const customer = result.customer || {
    firstName: "Valued",
    lastName: "Customer",
    organization: { name: "PestPilot Pro Services", phone: "(555) 019-2834" },
    properties: [],
    jobs: [],
    invoices: [],
  };

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col justify-between p-4 sm:p-6 md:p-10">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Top Navbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="font-extrabold text-sm text-foreground">
                {customer.organization?.name || "PestPilot"} &bull; Client Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>

        {/* Client Interface */}
        <PortalClient initialCustomer={customer} />

        {/* Footer */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <p>&copy; {new Date().getFullYear()} {customer.organization?.name || "PestPilot"}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/login" className="hover:text-foreground">Staff Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

