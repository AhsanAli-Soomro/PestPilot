import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ShieldCheck,
  Truck,
  WifiOff,
  CheckCircle2,
  Receipt,
  Repeat,
  Bell,
  ArrowRight,
  FileCheck2,
  Calendar,
  Sparkles,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground">
              Pest<span className="text-amber-500">Pilot</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#offline" className="hover:text-foreground transition-colors">
              Offline Field Mode
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="font-bold">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28 px-4 sm:px-6 border-b border-border bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs font-bold text-primary shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Built specifically for 1 to 5 truck pest control operators
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Quote &bull; Schedule &bull; Service &bull; Invoice &bull; Recurring Reminders &mdash;{" "}
            <span className="text-primary underline decoration-amber-500 decoration-wavy decoration-2">
              Works Offline in the Field.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Eliminate lost clipboards, late night invoicing, and messy chemical paperwork. PestPilot gives your technicians one simple, fast mobile tool that never freezes when cellular signal drops.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto font-black text-base px-8 h-12 shadow-xl shadow-primary/25">
                Start Free 14-Day Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-12">
                Live Demo Account
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Setup under 3 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% Offline field support
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> EPA compliant pesticide logs
            </span>
          </div>
        </div>
      </section>

      {/* 5-Step Core Loop */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-14">
          <Badge variant="secondary" className="text-xs font-bold uppercase tracking-wider">
            The Complete Pest Control Loop
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            From First Phone Call to Automatic Renewal
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Everything small pest control companies need to run a professional operation without enterprise complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-5 border-border bg-card hover:border-primary transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-3">
              1
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">Instant Quotes</h3>
            <p className="text-xs text-muted-foreground">
              Build estimates with 1-click pest templates. Customers approve online with one tap.
            </p>
          </Card>

          <Card className="p-5 border-border bg-card hover:border-primary transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-3">
              2
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">Smart Dispatch</h3>
            <p className="text-xs text-muted-foreground">
              Calendar & route ordering. Technicians see today&apos;s stops, gate codes, and pet alerts.
            </p>
          </Card>

          <Card className="p-5 border-border bg-card hover:border-primary transition-colors">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-sm mb-3">
              3
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">Field Service</h3>
            <p className="text-xs text-muted-foreground">
              Works completely offline. Log EPA chemicals, take photos, and capture signatures.
            </p>
          </Card>

          <Card className="p-5 border-border bg-card hover:border-primary transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-3">
              4
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">Instant Invoices</h3>
            <p className="text-xs text-muted-foreground">
              Auto-generate itemized PDF invoices and collect card, check, or cash payments.
            </p>
          </Card>

          <Card className="p-5 border-border bg-card hover:border-primary transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-3">
              5
            </div>
            <h3 className="font-bold text-base text-foreground mb-1">Auto Reminders</h3>
            <p className="text-xs text-muted-foreground">
              Automatic SMS & email reminders for tomorrow&apos;s visit, overdue bills, and recurring renewals.
            </p>
          </Card>
        </div>
      </section>

      {/* Offline Mode Showcase */}
      <section id="offline" className="py-20 px-4 sm:px-6 bg-secondary/30 border-y border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <WifiOff className="w-3.5 h-3.5" /> True Offline Architecture
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Basements, crawlspaces, or rural routes? No problem.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Most software stalls when your technicians lose cell service in a concrete basement or rural estate. PestPilot uses a modern IndexedDB offline engine.
            </p>
            <ul className="space-y-2 text-xs font-semibold text-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> View today&apos;s customer notes and gate codes offline
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Enter EPA chemical logs and record dosages with zero latency
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Capture customer signatures on glass
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Auto-syncs outbox mutations the moment connection is restored
              </li>
            </ul>
          </div>

          <Card className="p-6 border-border shadow-2xl bg-card">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Offline Engine Active
                </span>
              </div>
              <Badge variant="secondary">PWA Installed</Badge>
            </div>
            <div className="py-6 space-y-3">
              <div className="p-3 rounded-lg bg-secondary/50 text-xs flex justify-between items-center">
                <span>Stop #1: 742 Evergreen Terrace</span>
                <span className="font-bold text-emerald-600">Cached Locally</span>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 text-xs flex justify-between items-center">
                <span>Gate Code: #4829 (Beware of dog)</span>
                <span className="font-bold text-emerald-600">Saved</span>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 text-xs flex justify-between items-center">
                <span>Chemical Application: Taurus SC (4 gal)</span>
                <span className="font-bold text-amber-600">Queued in Outbox</span>
              </div>
            </div>
            <div className="pt-2 text-center text-xs text-muted-foreground">
              Zero spinning loading spinners. The app responds instantly on device.
            </div>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-14">
          <Badge variant="secondary" className="text-xs font-bold uppercase tracking-wider">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Fair Plans for Growing Pest Control Fleets
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            No long-term contracts. Upgrade or downgrade anytime with one click.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free */}
          <Card className="border-border p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold">Free</h3>
                <p className="text-xs text-muted-foreground">Solo pest operators</p>
                <div className="pt-3">
                  <span className="text-4xl font-black">$0</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
              </div>

              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2 text-foreground font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1 Technician / Truck
                </li>
                <li className="flex items-center gap-2 text-foreground font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 20 Jobs / Month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Offline Mobile App
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> EPA Treatment Logs
                </li>
              </ul>
            </div>

            <Link href="/signup" className="pt-6">
              <Button variant="outline" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </Card>

          {/* Pro */}
          <Card className="border-primary ring-2 ring-primary/20 p-6 flex flex-col justify-between relative shadow-xl">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider">
              Most Popular (1-3 Trucks)
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold">Pro</h3>
                <p className="text-xs text-muted-foreground">Small fleet</p>
                <div className="pt-3">
                  <span className="text-4xl font-black">$29</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
              </div>

              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2 text-foreground font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 3 Technicians / Trucks
                </li>
                <li className="flex items-center gap-2 text-foreground font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited Jobs / Month
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Recurring Service Plans
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant PDF Invoices & Card Pay
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> White-label (No PestPilot branding)
                </li>
              </ul>
            </div>

            <Link href="/signup" className="pt-6">
              <Button className="w-full font-bold">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </Card>

          {/* Business */}
          <Card className="border-border p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold">Business</h3>
                <p className="text-xs text-muted-foreground">4-10 truck companies</p>
                <div className="pt-3">
                  <span className="text-4xl font-black">$59</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
              </div>

              <ul className="text-xs space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2 text-foreground font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 10 Technicians / Trucks
                </li>
                <li className="flex items-center gap-2 text-foreground font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited Jobs & Customers
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> SMS Appointment Reminders (Twilio)
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> EPA Compliance Audit PDF Exports
                </li>
              </ul>
            </div>

            <Link href="/signup" className="pt-6">
              <Button variant="outline" className="w-full">
                Start Free Trial
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto w-full border-t border-border">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4 text-sm">
          <Card className="p-4 border-border">
            <h4 className="font-bold text-foreground">Can technicians use PestPilot on their iPhones and Androids?</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Yes! PestPilot is a progressive web app (PWA). Technicians can add it to their home screen with one tap. It has big 44px outdoor touch buttons, GPS directions, and offline support.
            </p>
          </Card>

          <Card className="p-4 border-border">
            <h4 className="font-bold text-foreground">Does PestPilot meet state pesticide regulatory requirements?</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Yes. Each treatment log records EPA registration numbers, exact products, dilution ratios, target pests, areas treated, applicator license number, and customer/applicator signatures. You can export complete CSV and PDF compliance audit reports in seconds.
            </p>
          </Card>

          <Card className="p-4 border-border">
            <h4 className="font-bold text-foreground">How does offline syncing handle conflicts?</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              PestPilot uses a strict deterministic policy: chemical logs and payments are append-only (they can never be overwritten). Job statuses use last-write-wins by version timestamp. A conflict log is visible in your settings at any time.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 bg-card text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-foreground">PestPilot</span> &bull; &copy; {new Date().getFullYear()} All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Technician Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

