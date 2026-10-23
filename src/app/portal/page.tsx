import { Metadata } from "next";
import { cookies } from "next/headers";
import { lookupCustomerPortalAction } from "@/actions/portal";
import { PortalClient } from "./portal-client";
import { CustomerPortalLogin } from "@/components/portal-login";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Phone, UserCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Customer Portal | PestPilot",
  description: "Manage pest control bookings, view upcoming visits, download certificates, and pay invoices online.",
  alternates: {
    canonical: "/portal",
  },
};

interface PortalPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CustomerPortalPage({ searchParams }: PortalPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const savedIdentifier = cookieStore.get("pestpilot_customer_identifier")?.value;

  const session = await auth();
  const authProvider = (params.auth_provider as string) || undefined;

  const rawParam = (params.id as string) || (params.email as string) || (params.phone as string);
  const identifier = rawParam || savedIdentifier;

  let customer = null;
  // Only auto-resolve customer if NOT arriving from OAuth callback
  // When arriving from OAuth (e.g. ?auth_provider=google), CustomerPortalLogin handles verification check first
  if (identifier && !authProvider) {
    const result = await lookupCustomerPortalAction(identifier);
    if (result.customer) {
      let isVerified = true;
      if (result.customer.notes) {
        try {
          const parsed = JSON.parse(result.customer.notes);
          if (parsed && typeof parsed === "object" && parsed._isCustomerMeta) {
            if (parsed.isVerified === false) {
              isVerified = false;
            }
          }
        } catch {}
      }
      if (isVerified) {
        customer = result.customer;
      }
    }
  }

  // If customer came from real Google / Apple OAuth and needs account activation / OTP
  let initialOAuthData: { provider: "google" | "apple"; email: string; name?: string } | undefined = undefined;
  if ((authProvider === "google" || authProvider === "apple") && session?.user?.email) {
    initialOAuthData = {
      provider: authProvider as "google" | "apple",
      email: session.user.email,
      name: session.user.name || undefined,
    };
  }

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
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <h1 className="font-extrabold text-sm text-foreground">
                {customer?.organization?.name || "PestPilot"} &bull; Client Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground hidden sm:inline"
            >
              Technician &amp; Staff Login &rarr;
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Client Interface OR Sign In View */}
        {customer ? (
          <PortalClient initialCustomer={customer} loggedInIdentifier={identifier} />
        ) : (
          <div className="py-8">
            <CustomerPortalLogin initialOAuthData={initialOAuthData} />
          </div>
        )}

        {/* Footer */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <p>&copy; {new Date().getFullYear()} {customer?.organization?.name || "PestPilot"}. All rights reserved.</p>
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
