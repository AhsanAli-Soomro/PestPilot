import Link from "next/link";
import { ArrowLeft, ShieldCheck, Scale, FileText, AlertOctagon, CheckCircle2, ShieldAlert } from "lucide-react";

export default function TermsPage() {
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
                Pest<span className="text-amber-500">Pilot</span> Terms of Service
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Effective Date: October 20, 2026 &bull; Version 2.4 &bull; Standard SaaS Commercial Agreement
              </p>
            </div>
          </div>
        </div>

        {/* Quick Highlights Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Pure Software Immunity</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PestPilot is purely an independent software provider. Government laws, EPA rules &amp; chemical safety are 100% the operator&apos;s sole responsibility.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Affordable Plan Seats</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Free ($0), Starter ($19/mo for 2 users), Professional ($39/mo for 5 users), and extra seats at just $9/mo each.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">You Retain Ownership</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Your customer accounts, invoice ledgers, and property access details remain 100% your property.
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
              Acceptance of Terms &amp; Eligibility
            </h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding contract between PestPilot (&quot;Company,&quot; &quot;we,&quot; &quot;our&quot;) and the individual or business entity (&quot;Customer,&quot; &quot;Subscriber,&quot; &quot;You&quot;) accessing or using the PestPilot web and progressive mobile application (the &quot;Service&quot;).
            </p>
            <p>
              By creating an account, clicking &quot;Accept,&quot; or dispatching field service jobs through PestPilot, you affirm that you are at least 18 years of age, legally authorized to bind your pest control company to these Terms, and maintain all necessary state or municipal commercial pest control applicator business licenses.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">2</span>
              Independent Software Provider Status, Absolute Regulatory Immunity &amp; Sole Operator Legal Responsibility
            </h2>
            
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-foreground space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <AlertOctagon className="w-5 h-5 shrink-0" />
                <span className="text-xs uppercase tracking-wider">CRITICAL LEGAL NOTICE &amp; REGULATORY EXCULPATION</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <strong>PESTPILOT IS EXCLUSIVELY AN INDEPENDENT SOFTWARE TECHNOLOGY PROVIDER.</strong> We are not a pest control operator, exterminator, pesticide applicator, chemical manufacturer, or regulatory body. All governmental laws, regulations, and chemical safety mandates apply strictly to the licensed operator/subscriber—NOT to PestPilot or its software creators.
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-bold text-foreground text-xs">2.1 Pure Software Technology Provider</h3>
              <p>
                PestPilot develops, licenses, and maintains cloud-based productivity software designed for customer scheduling, invoicing, CRM, and digital recordkeeping. PestPilot does not perform physical pest control services, does not inspect customer premises, does not recommend specific chemical treatments or dosages, and does not sell or distribute chemical substances.
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-bold text-foreground text-xs">2.2 Exclusive Operator Responsibility for All Government Laws &amp; Regulations</h3>
              <p>
                Compliance with ANY AND ALL federal, state, provincial, municipal, and international laws, regulations, codes, and administrative standards—including but not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>The Federal Insecticide, Fungicide, and Rodenticide Act (FIFRA, 7 U.S.C. § 136 et seq.) and Environmental Protection Agency (EPA) product labels (&quot;The Label is the Law&quot;);</li>
                <li>State Departments of Agriculture, Structural Pest Control Boards (SPCB), and local commercial pesticide applicator licensing and certification rules;</li>
                <li>Occupational Safety and Health Administration (OSHA) hazard communication, worker protection standards, and Personal Protective Equipment (PPE) requirements;</li>
                <li>Clean Water Act (CWA), groundwater protection, chemical drift, runoff containment, and hazardous waste disposal statutes;</li>
                <li>Consumer protection, customer notifications, and mandated re-entry interval (REI) disclosures;</li>
              </ul>
              <p>
                is the <strong>100% sole, exclusive, non-delegable, and absolute legal responsibility of the Subscriber and its individual certified applicators</strong>. The availability of software forms, pre-populated fields, or EPA registration input templates within PestPilot does not constitute regulatory certification, chemical endorsement, or legal advice.
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-bold text-foreground text-xs">2.3 Complete Immunity from Regulatory Citations, Fines &amp; Investigations</h3>
              <p>
                In the event that any government agency, environmental regulator, state agricultural inspector, or law enforcement authority conducts an investigation, issues a citation, levies fines, revokes licenses, or initiates civil or criminal enforcement actions against Subscriber or its technicians, <strong>PestPilot, its founders, developers, officers, shareholders, and contractors shall bear ZERO liability, financial penalty, or joint culpability whatsoever.</strong>
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-bold text-foreground text-xs">2.4 Comprehensive Defense, Indemnification &amp; Hold Harmless Agreement</h3>
              <p className="uppercase text-[11px] font-semibold text-foreground">
                YOU EXPRESSLY AGREE TO DEFEND, INDEMNIFY, AND HOLD COMPLETELY HARMLESS PESTPILOT AND ITS FOUNDERS, OWNERS, DIRECTORS, EMPLOYEES, DEVELOPERS, AND AGENTS FROM AND AGAINST ANY AND ALL CLAIMS, LOSSES, LIABILITIES, DAMAGES, GOVERNMENT FINES, EPA PENALTIES, LAWSUITS, CITATIONS, COSTS, AND REASONABLE ATTORNEY&apos;S FEES ARISING DIRECTLY OR INDIRECTLY FROM:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Any chemical application, pest extermination, termite treatment, wildlife removal, or field work conducted by Subscriber or its employees;</li>
                <li>Any chemical drift, contamination, spill, environmental damage, property damage, personal injury, toxic exposure, or pet harm;</li>
                <li>Any failure by Subscriber or its technicians to obtain, renew, or maintain valid commercial pesticide licenses, insurance coverage, or permits;</li>
                <li>Any regulatory audit, inquiry, citation, or enforcement action brought by any government entity against Subscriber.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">3</span>
              Multi-Tenancy, Team Accounts & Role Privileges
            </h2>
            <p>
              PestPilot enforces multi-tenant database partitioning. Each organization operates as a sovereign tenant identified by a unique `organizationId`.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>OWNER:</strong> Holds master administrative privileges, manage team members, change Stripe subscription tiers, view all financial reports, and modify company tax settings.
              </li>
              <li>
                <strong>ADMIN:</strong> May manage customers, dispatch schedules, approve quotes, and issue invoices, but cannot cancel the primary organization billing account.
              </li>
              <li>
                <strong>TECHNICIAN:</strong> Has restricted field access limited to their assigned jobs for the day, customer property addresses, chemical treatment log entry, and collecting customer signatures and payments.
              </li>
            </ul>
            <p>
              You agree to safeguard all team login credentials and notify us immediately of any unauthorized access to your PestPilot organization.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">4</span>
              Customer Properties, Gate Codes & Hazard Warnings
            </h2>
            <p>
              Our property management module enables storing physical service addresses, entry gate codes, key lockbox codes, and warnings regarding dogs, aggressive animals, children, or bee allergies.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You represent that you have received proper authorization from the property owner or tenant to access the premises for pest management.</li>
              <li>You agree to keep gate codes and confidential access codes secure and refrain from disclosing them to unauthorized third parties.</li>
              <li>PestPilot shall not be held liable for property damage, unauthorized access claims, or animal-related incidents occurring during field dispatch.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">5</span>
              Quotes, Online Acceptance & Invoicing
            </h2>
            <p>
              PestPilot enables sending itemized service estimates and invoice payment requests to your customers via email and public tokenized web pages.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Digital Signatures:</strong> Digital signatures captured on quotes or invoices via our touch-signature pad constitute binding electronic agreements under the U.S. Electronic Signatures in Global and National Commerce Act (E-SIGN Act, 15 U.S.C. § 7001) and Uniform Electronic Transactions Act (UETA).
              </li>
              <li>
                <strong>Online Payments:</strong> Payments conducted via public invoice links are handled directly by Stripe. PestPilot does not store complete debit or credit card PAN numbers. All transaction dispute or chargeback responsibilities remain between you and your end-customer.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">6</span>
              Automated Reminders & Communications (TCPA Compliance)
            </h2>
            <p>
              PestPilot provides automated reminder functionality for upcoming appointments and overdue invoices via email and SMS.
            </p>
            <p>
              By enabling automated customer reminders, you warrant that you have obtained prior express written consent from each customer in accordance with the Telephone Consumer Protection Act (TCPA, 47 U.S.C. § 227) and CAN-SPAM Act before sending automated SMS or commercial email notifications.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">7</span>
              Subscriptions, Affordable Seat Pricing &amp; Cancellation
            </h2>
            <p>
              PestPilot provides three subscription tiers billed on a monthly recurring basis:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Free Plan ($0/month):</strong> 1 user included (Solo Operator) and 20 completed jobs per calendar month. Includes the mandatory &quot;Powered by PestPilot&quot; footer watermark on public quote and invoice links. Custom white-label branding and additional user seats are locked.</li>
              <li><strong>Starter Plan ($19/month):</strong> 2 users included, with additional user seats available for just <strong>$9/month per additional user</strong>. Unlimited jobs and customers, and 100% white-label custom company branding (your brand on every invoice, quote, and report).</li>
              <li><strong>Professional Plan ($39/month):</strong> 5 users included, with additional user seats at just <strong>$9/month per additional user</strong>. Unlimited jobs and customers, automated SMS appointment reminders, license tracking, technician scorecards, route visibility, and priority support.</li>
            </ul>
            <p>
              You may upgrade, downgrade, or cancel your subscription at any time via your Settings billing portal. Downgrades or cancellations take effect at the conclusion of the active billing cycle; no partial refunds are issued for unused days in a billing period.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">8</span>
              Offline Field Mode &amp; Conflict Resolution
            </h2>
            <p>
              Technicians operating in offline field mode store data in local browser storage (IndexedDB). When the device regains internet connectivity, updates sync back to the cloud.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Conflict Resolution Policy:</strong> General entities (customer notes, job times) use Last-Write-Wins based on timestamps.
              </li>
              <li>
                <strong>Append-Only Records:</strong> Chemical Treatment Logs and recorded Payments are append-only and cannot be overwritten by conflicting offline sync operations.
              </li>
              <li>
                You are responsible for ensuring field technicians sync their offline outbox queue before clearing browser caches or switching mobile hardware.
              </li>
            </ul>
          </section>

          {/* Section 9 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">9</span>
              Limitation of Liability &amp; Startup Protection
            </h2>
            <p className="uppercase text-[11px] font-semibold text-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PESTPILOT, ITS FOUNDERS, OFFICERS, EMPLOYEES, DEVELOPERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, PUNITIVE, SPECIAL, INCIDENTAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES, OR LOSS OF BUSINESS PROFITS, GOODWILL, DATA, REGULATORY FINES, ENVIRONMENTAL CONTAMINATION, CHEMICAL REMEDIATION COSTS, OR LICENSING CITATIONS ARISING OUT OF OR IN CONNECTION WITH THE USE OF OR INABILITY TO USE THE SERVICE.
            </p>
            <p>
              OUR TOTAL AGGREGATE LIABILITY UNDER THESE TERMS FOR ANY AND ALL CLAIMS WHATSOEVER SHALL NOT EXCEED THE TOTAL SOFTWARE FEES ACTUALLY PAID BY YOU TO PESTPILOT DURING THE ONE (1) MONTH IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO LIABILITY, OR FIFTY US DOLLARS ($50.00), WHICHEVER IS LESS.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">10</span>
              Governing Law & Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed under the laws of the State of Delaware, without regard to conflict of law principles. Any dispute arising from these Terms shall be resolved through confidential binding arbitration under the Commercial Arbitration Rules of the American Arbitration Association (AAA).
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3 p-6 rounded-2xl bg-card border border-border">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-xs">11</span>
              Contact Information
            </h2>
            <p>For legal inquiries, contract notices, or commercial partnership queries:</p>
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
              <p className="font-semibold text-foreground">PestPilot Legal Department</p>
              <p>Email: <a href="mailto:legal@pestpilot.app" className="text-primary hover:underline">legal@pestpilot.app</a></p>
              <p>Commercial Support: <a href="mailto:support@pestpilot.app" className="text-primary hover:underline">support@pestpilot.app</a></p>
              <p>Corporate: PestPilot Software Technologies, Inc.</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <p>&copy; {new Date().getFullYear()} PestPilot SaaS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
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
