"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, Building, User, MapPin, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { completeOnboardingAction } from "@/actions/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const session = useSession();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [loading, setLoading] = React.useState(false);

  // If user already has an active organization, redirect immediately to dashboard
  React.useEffect(() => {
    if (session.status === "authenticated" && session.data?.user?.organizationId) {
      window.location.href = "/dashboard";
    }
  }, [session.status, session.data?.user?.organizationId]);

  // Form state
  const [companyName, setCompanyName] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [timezone, setTimezone] = React.useState("America/New_York");
  const [taxRatePercent, setTaxRatePercent] = React.useState("8.25");

  const [customerFirstName, setCustomerFirstName] = React.useState("");
  const [customerLastName, setCustomerLastName] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");

  const [propertyAddress, setPropertyAddress] = React.useState("");
  const [propertyCity, setPropertyCity] = React.useState("");
  const [propertyState, setPropertyState] = React.useState("TX");
  const [propertyPostalCode, setPropertyPostalCode] = React.useState("");

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Please enter your company name");
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("companyName", companyName);
      formData.append("currency", currency);
      formData.append("timezone", timezone);
      formData.append("taxRatePercent", taxRatePercent);

      formData.append("customerFirstName", customerFirstName);
      formData.append("customerLastName", customerLastName);
      formData.append("customerEmail", customerEmail);
      formData.append("customerPhone", customerPhone);

      formData.append("propertyAddress", propertyAddress);
      formData.append("propertyCity", propertyCity);
      formData.append("propertyState", propertyState);
      formData.append("propertyPostalCode", propertyPostalCode);

      if (session.data?.user?.id) {
        formData.append("userId", session.data.user.id);
      }
      if (session.data?.user?.email) {
        formData.append("userEmail", session.data.user.email);
      }

      const res = await completeOnboardingAction(formData);

      if (!res.success) {
        toast.error(res.error || "Failed to setup company");
        setLoading(false);
        return;
      }

      toast.success("Welcome aboard! Your PestPilot workspace is ready.");
      // Refresh session token with the newly created organization
      if (session?.update) {
        await session.update({
          user: {
            organizationId: res.organizationId,
            organizationName: companyName,
            role: "OWNER",
          },
        });
      }
      // Hard navigation to dashboard so all server components and layouts re-evaluate with fresh cookies
      window.location.href = "/dashboard";
    } catch {
      toast.error("An error occurred during onboarding.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <span className="text-2xl font-black tracking-tight text-foreground">
              Pest<span className="text-amber-500">Pilot</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Set up your pest control company</h1>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Under 3 minutes: Company &bull; Currency &bull; First Customer
          </p>

          {/* Stepper indicator */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div
              className={`h-2 rounded-full transition-all ${
                step === 1 ? "w-12 bg-primary" : "w-6 bg-primary/40"
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all ${
                step === 2 ? "w-12 bg-primary" : "w-6 bg-border"
              }`}
            />
          </div>
        </div>

        <Card className="border-border shadow-xl">
          {step === 1 ? (
            <form onSubmit={handleStep1Submit}>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Building className="w-4 h-4" /> Step 1 of 2: Company Profile
                </div>
                <CardTitle className="text-xl">Tell us about your company</CardTitle>
                <CardDescription>
                  Configure your company branding, currency, and local tax rate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company / Fleet Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g. Miller & Sons Pest Control"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="AUD">AUD ($)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="America/New_York">Eastern (US & Canada)</option>
                      <option value="America/Chicago">Central (US & Canada)</option>
                      <option value="America/Denver">Mountain (US & Canada)</option>
                      <option value="America/Los_Angeles">Pacific (US & Canada)</option>
                      <option value="America/Phoenix">Arizona</option>
                      <option value="Europe/London">London</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRatePercent">Sales Tax Rate (%)</Label>
                    <Input
                      id="taxRatePercent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxRatePercent}
                      onChange={(e) => setTaxRatePercent(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit">
                    Continue to First Customer <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </form>
          ) : (
            <form onSubmit={handleFinalSubmit}>
              <CardHeader>
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <User className="w-4 h-4" /> Step 2 of 2: First Service Account
                </div>
                <CardTitle className="text-xl">Add your first customer & service address</CardTitle>
                <CardDescription>
                  PestPilot will automatically create this customer profile and property so you can immediately quote, schedule, or log service.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerFirstName">First Name *</Label>
                    <Input
                      id="customerFirstName"
                      placeholder="Sarah"
                      value={customerFirstName}
                      onChange={(e) => setCustomerFirstName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerLastName">Last Name *</Label>
                    <Input
                      id="customerLastName"
                      placeholder="Jenkins"
                      value={customerLastName}
                      onChange={(e) => setCustomerLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Customer Email *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="sarah.jenkins@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Customer Phone *</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      placeholder="(555) 234-5678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-3">
                    <MapPin className="w-3.5 h-3.5" /> Service Address / Property
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="propertyAddress">Street Address *</Label>
                      <Input
                        id="propertyAddress"
                        placeholder="742 Evergreen Terrace"
                        value={propertyAddress}
                        onChange={(e) => setPropertyAddress(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="propertyCity">City *</Label>
                        <Input
                          id="propertyCity"
                          placeholder="Austin"
                          value={propertyCity}
                          onChange={(e) => setPropertyCity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="propertyState">State *</Label>
                        <Input
                          id="propertyState"
                          placeholder="TX"
                          value={propertyState}
                          onChange={(e) => setPropertyState(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="propertyPostalCode">ZIP *</Label>
                        <Input
                          id="propertyPostalCode"
                          placeholder="78701"
                          value={propertyPostalCode}
                          onChange={(e) => setPropertyPostalCode(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finishing Setup...
                      </>
                    ) : (
                      <>
                        Finish & Launch Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
