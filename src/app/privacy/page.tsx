import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, FileText, Globe, CheckCircle2, AlertTriangle, Eye, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "PestPilot privacy policy, multi-tenant data isolation, and field records protection standards.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors touch-target"
          >
            <ArrowLeft className="w-4 h-4" /> Back to PestPilot Home
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">
                Pest<span className="text-amber-500">Pilot</span> Privacy Policy
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Effective Date: October 20, 2026 &bull; Version 2.4 &bull; Global Field Service Compliance
              </p>
            </div>
          </div>
        </div>

        {/* Quick Highlights Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground">Multi-Tenant Isolation</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your customer lists, chemical logs, and quotes are strictly partitioned by organization ID.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground">Offline Sandboxing</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Field data stored in IndexedDB is local to your device and transmitted via TLS 1.3 encryption.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground">You Own Your Data</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Full export rights (CSV/PDF) for EPA pesticide compliance records and billing ledgers at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="prose dark:prose-invert max-w-none space-y-8 text-xs leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">1</span>
              Introduction &amp; Scope
            </h2>
            <p>
              PestPilot (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides a cloud-based and offline-capable field-service management platform tailored specifically for pest control operators, extermination teams, and independent field technicians (the &quot;Service&quot;).
            </p>
            <p>
              <strong>Data Processor Role:</strong> PestPilot operates strictly as an independent software technology developer and data processor. The subscribing pest control company or operator acts as the independent data controller. PestPilot does not engage in pest extermination, chemical sales, or regulatory enforcement. All pesticide application compliance, licensing, and operational duties remain solely with the subscribing business.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, store, share, and protect information when you register an account, utilize our technician mobile Progressive Web App (PWA), manage customers and service plans, generate chemical application reports, or send automated service and invoice notifications.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">2</span>
              Information We Collect
            </h2>
            <p>We collect information in three categories:</p>
            
            <div className="space-y-2 pl-2">
              <h3 className="text-xs font-bold text-foreground">A. Account & Organizational Information</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Company legal name, business address, phone number, and tax registration rate.</li>
                <li>User credentials (full name, email address, cryptographically hashed passwords via bcrypt, and profile picture).</li>
                <li>Assigned role (Owner, Administrator, Field Technician).</li>
              </ul>

              <h3 className="text-xs font-bold text-foreground pt-2">B. Customer & Property Data (Controller vs. Processor)</h3>
              <p>
                As a tenant on PestPilot, you upload customer information to execute field appointments. You act as the <strong>Data Controller</strong>, and PestPilot acts as the <strong>Data Processor</strong> with respect to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Customer names, service physical addresses, phone numbers, and email addresses.</li>
                <li>Property notes, entrance gate codes, lockbox combinations, and critical alerts regarding pets, children, or environmental hazards.</li>
                <li>Recurring service contracts, scheduled dates, and billing frequencies (monthly, quarterly, annual).</li>
              </ul>

              <h3 className="text-xs font-bold text-foreground pt-2">C. Field Treatment Logs & Regulatory Records</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Target pest types (e.g., subterranean termites, bedbugs, rodent infestation, German cockroaches).</li>
                <li>Applied chemical product commercial trade names, dilution concentrations, and federal EPA Registration Numbers.</li>
                <li>Specific physical zones treated (exterior perimeter, attic, crawlspace, baseboards, weep screeds).</li>
                <li>Technician signatures, customer acceptance digital signatures, and inspection photographic evidence.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">3</span>
              Offline Field Mode & IndexedDB Caching
            </h2>
            <p>
              To ensure field technicians can work in rural or dead-zone environments with zero cellular coverage, PestPilot incorporates an offline synchronization engine built on Dexie.js (IndexedDB) and Service Workers.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Local Storage:</strong> When offline, treatment logs, signatures, and job status modifications are written to your browser&apos;s sandboxed IndexedDB storage.
              </li>
              <li>
                <strong>Append-Only Integrity:</strong> In compliance with environmental safety laws, completed treatment logs and collected customer payments are treated as immutable and append-only; they are never overwritten during cloud synchronization.
              </li>
              <li>
                <strong>Encrypted Sync:</strong> Once internet access is detected, queued mutations are pushed via HTTPS (TLS 1.3) with client-generated idempotency keys to prevent duplicate records.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">4</span>
              How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide, operate, and maintain field service dispatch and route optimization.</li>
              <li>To generate verifiable EPA regulatory compliance audit packages in PDF and CSV format.</li>
              <li>To transmit customer service quotes, vector invoice PDFs, and payment receipts.</li>
              <li>To dispatch automated appointment reminders (&quot;Technician arriving tomorrow&quot;) and service-due alerts via Resend (email) or Twilio (SMS).</li>
              <li>To process subscription billing and enforce plan user and monthly job limits via Stripe.</li>
              <li>To detect and prevent fraudulent access and log all core administrative mutations in the tenant Audit Log.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">5</span>
              Subprocessors & Third-Party Service Providers
            </h2>
            <p>We work exclusively with vetted, SOC 2 compliant subprocessors:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-border text-xs">
                <thead>
                  <tr className="bg-muted/50 text-foreground">
                    <th className="p-2 border border-border">Subprocessor</th>
                    <th className="p-2 border border-border">Purpose</th>
                    <th className="p-2 border border-border">Location</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-border font-semibold text-foreground">Stripe, Inc.</td>
                    <td className="p-2 border border-border">Payment processing, customer billing portal, subscription management</td>
                    <td className="p-2 border border-border">USA / Global</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-border font-semibold text-foreground">Resend, Inc.</td>
                    <td className="p-2 border border-border">Transactional email delivery (quotes, invoice PDFs, reminders)</td>
                    <td className="p-2 border border-border">USA</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-border font-semibold text-foreground">Twilio, Inc.</td>
                    <td className="p-2 border border-border">Optional SMS dispatch notifications (disabled if keys not configured)</td>
                    <td className="p-2 border border-border">USA</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-border font-semibold text-foreground">Neon / PostgreSQL</td>
                    <td className="p-2 border border-border">Encrypted cloud relational database storage</td>
                    <td className="p-2 border border-border">USA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              We do <strong>not</strong> sell, rent, or trade your personal or customer data to third-party data brokers or advertisers.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">6</span>
              Pesticide Recordkeeping Laws (EPA FIFRA Compliance)
            </h2>
            <p>
              Under the Federal Insecticide, Fungicide, and Rodenticide Act (FIFRA, 7 U.S.C. § 136 et seq.) and corresponding state regulatory authorities (e.g., California DPR, Texas Dept. of Agriculture, Florida DACS), certified commercial pest applicators are legally mandated to retain chemical application records for a minimum statutory period (typically 2 to 3 years depending on jurisdiction).
            </p>
            <p>
              PestPilot maintains soft-delete protections (`deletedAt: null` flag) and historical audit records so that licensed applicators can demonstrate uninterrupted regulatory compliance during random state agricultural audits.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">7</span>
              Your Data Protection Rights (GDPR & CCPA/CPRA)
            </h2>
            <p>Depending on your geographic jurisdiction, you possess the following rights:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right to Access & Portability:</strong> You may export all customer records, invoices, and chemical application logs in standard CSV and PDF formats at any time.</li>
              <li><strong>Right to Rectification:</strong> You can update inaccurate company or customer information directly via the dashboard or customer profile.</li>
              <li><strong>Right to Erasure (&quot;Be Forgotten&quot;):</strong> Upon account termination, you may request permanent deletion of your organization&apos;s data, subject to statutory pesticide retention requirements.</li>
              <li><strong>Non-Discrimination:</strong> We will never deny service or charge differing rates for exercising your privacy rights.</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">8</span>
              Security Measures
            </h2>
            <p>
              We implement comprehensive defense-in-depth security controls:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Role-based access control (RBAC): Field Technicians cannot access company-wide billing, tax settings, or other technicians&apos; private customer portfolios.</li>
              <li>Session encryption: Cryptographically signed JWT tokens with rolling expiration and server-side secret validation.</li>
              <li>Input validation: Strict Zod schema parsing on all client and server API inputs to guard against SQL injection and cross-site scripting (XSS).</li>
              <li>Strict multi-tenancy: Every query is enforced via the `getTenantDb` isolation layer.</li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">9</span>
              Contact Us & Data Inquiries
            </h2>
            <p>
              If you have questions regarding this Privacy Policy, wish to execute a Data Processing Agreement (DPA), or need to submit a data erasure request, please reach out to:
            </p>
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
              <p className="font-semibold text-foreground">PestPilot Privacy & Data Protection Team</p>
              <p>Email: <a href="mailto:&#112;&#114;&#105;&#118;&#97;&#99;&#121;&#64;&#112;&#101;&#115;&#116;&#112;&#105;&#108;&#111;&#116;&#46;&#97;&#112;&#112;" className="text-primary hover:underline">privacy&#64;pestpilot&#46;app</a></p>
              <p>Support: <a href="mailto:&#115;&#117;&#112;&#112;&#111;&#114;&#116;&#64;&#112;&#101;&#115;&#116;&#112;&#105;&#108;&#111;&#116;&#46;&#97;&#112;&#112;" className="text-primary hover:underline">support&#64;pestpilot&#46;app</a></p>
              <p>Website: <a href="https://pestpilot.app" className="text-primary hover:underline">https://pestpilot.app</a></p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <p>&copy; {new Date().getFullYear()} PestPilot SaaS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
