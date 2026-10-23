"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriceCalculator } from "@/components/price-calculator";
import { AiPestIdentifier } from "@/components/ai-pest-identifier";
import {
  Sparkles,
  Calculator,
  ShieldCheck,
  Search,
  Users,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Building2,
  Home,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function FreeToolsHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"scanner" | "calculator" | "verify" | "portal">("scanner");

  // Certificate Verification search
  const [verifyId, setVerifyId] = React.useState("");

  // Customer Portal quick search
  const [portalLookup, setPortalLookup] = React.useState("");

  const handleVerify = (e: React.FormEvent, customId?: string) => {
    e.preventDefault();
    const idToUse = (customId || verifyId).trim();
    if (!idToUse) {
      toast.error("Please enter a Job ID or Invoice #");
      return;
    }
    window.open(`/verify/${encodeURIComponent(idToUse)}`, "_blank");
  };

  const handlePortalQuickAccess = (e: React.FormEvent, customIdentifier?: string) => {
    e.preventDefault();
    const idToUse = (customIdentifier || portalLookup).trim();
    if (!idToUse) {
      toast.error("Please enter your registered email or phone");
      return;
    }
    router.push(`/portal?email=${encodeURIComponent(idToUse)}`);
  };

  return (
    <div className="space-y-8">
      {/* Tab Switcher Pills */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-card border border-border shadow-sm max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab("scanner")}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
            activeTab === "scanner"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">AI Pest Scanner</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("calculator")}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
            activeTab === "calculator"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Calculator className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Price Estimator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("verify")}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
            activeTab === "verify"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <QrCode className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Verify Certificate</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("portal")}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
            activeTab === "portal"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Customer Portal</span>
        </button>
      </div>

      {/* Tool Content Panels */}
      <div>
        {/* Tab 1: AI Pest Scanner */}
        {activeTab === "scanner" && (
          <div className="max-w-xl mx-auto animate-in fade-in-50 duration-200">
            <AiPestIdentifier
              mode="customer"
              onBookService={(pestName) => {
                router.push(`/portal?pest=${encodeURIComponent(pestName)}`);
              }}
            />
          </div>
        )}

        {/* Tab 2: Price Calculator */}
        {activeTab === "calculator" && (
          <div className="max-w-xl mx-auto animate-in fade-in-50 duration-200">
            <PriceCalculator
              onBookPlan={(planName) => {
                router.push(`/portal?plan=${encodeURIComponent(planName)}`);
              }}
            />
          </div>
        )}

        {/* Tab 3: Verify Service Record & Certificate */}
        {activeTab === "verify" && (
          <Card className="max-w-xl mx-auto border-border shadow-xl bg-card animate-in fade-in-50 duration-200">
            <CardHeader className="text-center space-y-2 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <CardTitle className="text-2xl font-black">Verify Pest Treatment Record</CardTitle>
              <CardDescription className="text-xs max-w-sm mx-auto">
                Scan your invoice QR code or enter your Job ID / Invoice number to verify certified applicator credentials, EPA chemical dilution, and digital sign-off.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleVerify}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verify-input" className="text-xs font-semibold">
                    Job ID, Invoice #, or Public Token
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="verify-input"
                      placeholder="e.g. PC-1025 or INV-1001"
                      value={verifyId}
                      onChange={(e) => setVerifyId(e.target.value)}
                      className="text-xs"
                      autoFocus
                    />
                    <Button type="submit" className="font-bold shrink-0">
                      <Search className="w-4 h-4 mr-1.5" /> Verify
                    </Button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Instant Public Compliance Verification Includes:</span>
                  </div>
                  <ul className="grid grid-cols-2 gap-1.5 text-muted-foreground text-[11px] pl-6 list-disc">
                    <li>Certified Applicator License #</li>
                    <li>EPA Chemical Registration #</li>
                    <li>Exact Dosage &amp; Target Pests</li>
                    <li>GPS Stamp &amp; Customer Signature</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <div className="text-[11px] text-muted-foreground text-center mb-2">
                    Or test with demo records:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-9"
                      onClick={(e) => handleVerify(e, "PC-1025")}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1 text-primary" />
                      <span>Demo Job #PC-1025</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-9"
                      onClick={(e) => handleVerify(e, "INV-1001")}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      <span>Demo Invoice #INV-1001</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </form>
          </Card>
        )}

        {/* Tab 4: Customer Portal Quick Access */}
        {activeTab === "portal" && (
          <Card className="max-w-xl mx-auto border-border shadow-xl bg-card animate-in fade-in-50 duration-200">
            <CardHeader className="text-center space-y-2 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mx-auto flex items-center justify-center text-primary">
                <Users className="w-7 h-7" />
              </div>
              <CardTitle className="text-2xl font-black">Customer Self-Service Hub</CardTitle>
              <CardDescription className="text-xs max-w-sm mx-auto">
                Check upcoming visits, reschedule appointments, download past EPA treatment certificates, and pay invoices online with 0 hassle.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handlePortalQuickAccess}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portal-input" className="text-xs font-semibold">
                    Registered Email or Phone Number
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="portal-input"
                      placeholder="e.g. name@example.com or +1 555-0199"
                      value={portalLookup}
                      onChange={(e) => setPortalLookup(e.target.value)}
                      className="text-xs"
                      autoFocus
                    />
                    <Button type="submit" className="font-bold shrink-0">
                      Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

