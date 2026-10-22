"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";
import { localDb, type ConflictRecord } from "@/lib/offline/db";
import {
  createSubscriptionCheckoutAction,
  createCustomerPortalAction,
  inviteTeamMemberAction,
  updateCompanySettingsAction,
} from "@/actions/billing";
import {
  Building,
  CreditCard,
  Users,
  Shield,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  History,
} from "lucide-react";
import { toast } from "sonner";

interface SettingsClientProps {
  organization: any;
  members: any[];
  auditLogs: any[];
  currentUserRole: string;
}

export function SettingsClient({
  organization,
  members,
  auditLogs,
  currentUserRole,
}: SettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"company" | "team" | "billing" | "conflicts" | "audit">("company");
  const [loading, setLoading] = React.useState(false);
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);

  // Company settings form state
  const [name, setName] = React.useState(organization.name);
  const [currency, setCurrency] = React.useState(organization.currency);
  const [timezone, setTimezone] = React.useState(organization.timezone);
  const [taxRatePercent, setTaxRatePercent] = React.useState(String(organization.taxRatePercent));
  const [invoicePrefix, setInvoicePrefix] = React.useState(organization.invoicePrefix);
  const [quotePrefix, setQuotePrefix] = React.useState(organization.quotePrefix);
  const [address, setAddress] = React.useState(organization.address || "");
  const [phone, setPhone] = React.useState(organization.phone || "");
  const [email, setEmail] = React.useState(organization.email || "");

  // Invite member form state
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteName, setInviteName] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"TECHNICIAN" | "ADMIN">("TECHNICIAN");

  // Offline conflicts log state
  const [conflicts, setConflicts] = React.useState<ConflictRecord[]>([]);

  React.useEffect(() => {
    async function loadConflicts() {
      try {
        const records = await localDb.conflictsLog.toArray();
        setConflicts(records);
      } catch {
        // Dexie
      }
    }
    loadConflicts();
  }, []);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("currency", currency);
      formData.append("timezone", timezone);
      formData.append("taxRatePercent", taxRatePercent);
      formData.append("invoicePrefix", invoicePrefix);
      formData.append("quotePrefix", quotePrefix);
      formData.append("address", address);
      formData.append("phone", phone);
      formData.append("email", email);

      const res = await updateCompanySettingsAction(formData);
      if (!res.success) {
        toast.error(res.error || "Failed to update settings");
        return;
      }

      toast.success("Company settings updated!");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", inviteEmail);
      formData.append("name", inviteName);
      formData.append("role", inviteRole);

      const res = await inviteTeamMemberAction(formData);
      if (!res.success) {
        toast.error(res.error || "Failed to invite member");
        return;
      }

      toast.success("Team member invited!");
      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteName("");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = async (tier: "PRO" | "BUSINESS") => {
    setLoading(true);
    try {
      const res = await createSubscriptionCheckoutAction(tier);
      if (!res.success) {
        toast.error(res.error || "Failed to initiate upgrade");
        return;
      }

      if (res.url) {
        window.location.href = res.url;
      } else if (res.simulated) {
        toast.success(`Upgraded to PestPilot ${tier} Plan!`);
        router.refresh();
      }
    } catch {
      toast.error("An error occurred starting subscription checkout");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCustomerPortal = async () => {
    setLoading(true);
    try {
      const res = await createCustomerPortalAction();
      if (!res.success) {
        toast.error(res.error || "Could not open billing portal");
        return;
      }
      if (res.url) {
        window.location.href = res.url;
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const currentTier = organization.subscription?.plan || organization.planTier || "FREE";

  return (
    <div className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-border space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar scrollbar-none flex-nowrap pb-1 touch-pan-x">
        <button
          onClick={() => setActiveTab("company")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors shrink-0 ${
            activeTab === "company"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Company Profile
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors shrink-0 ${
            activeTab === "team"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Team & Trucks ({members.length})
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors shrink-0 ${
            activeTab === "billing"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Subscription & Plans
        </button>
        <button
          onClick={() => setActiveTab("conflicts")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors shrink-0 ${
            activeTab === "conflicts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Offline Conflicts ({conflicts.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors shrink-0 ${
            activeTab === "audit"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Audit Log
        </button>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === "company" && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Company & Invoicing Settings</CardTitle>
            <CardDescription>
              Branding and invoice numbers displayed on customer quotes and receipts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentTier === "FREE" ? (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-amber-700 dark:text-amber-400">
                    Free Plan: &quot;Powered by PestPilot&quot; Watermark Active
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Customer quotes and invoices will display the PestPilot watermark badge. Upgrade to Starter ($19/mo) to unlock 100% white-label branding.
                  </p>
                </div>
                <Button size="sm" variant="outline" type="button" onClick={() => setActiveTab("billing")}>
                  Upgrade to White-Label
                </Button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  <strong>100% White-Label Active:</strong> Your brand is displayed exclusively on every invoice, quote, and report. All PestPilot watermarks are removed.
                </p>
              </div>
            )}

            <form onSubmit={handleUpdateCompany} className="space-y-4 max-w-2xl">
              <div className="space-y-1.5">
                <Label>Company Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm"
                  >
                    <option value="America/New_York">Eastern</option>
                    <option value="America/Chicago">Central</option>
                    <option value="America/Denver">Mountain</option>
                    <option value="America/Los_Angeles">Pacific</option>
                    <option value="America/Phoenix">Arizona</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={taxRatePercent}
                    onChange={(e) => setTaxRatePercent(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Invoice Prefix</Label>
                  <Input
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Quote Prefix</Label>
                  <Input
                    value={quotePrefix}
                    onChange={(e) => setQuotePrefix(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Business Street Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="100 Pest Control Way, Austin TX 78701"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Public Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Public Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@yourcompany.com"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Team & Trucks */}
      {activeTab === "team" && (
        <div className="space-y-4">
          {/* Team Capacity & Seat Info Banner */}
          <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team Capacity:</span>
                <Badge variant={currentTier === "FREE" && members.length >= 1 ? "secondary" : "default"}>
                  {members.length} Active Member{members.length !== 1 ? "s" : ""}
                </Badge>
                {currentTier !== "FREE" && members.length > (currentTier === "PRO" ? 2 : 5) && (
                  <Badge variant="outline" className="text-primary border-primary">
                    +{members.length - (currentTier === "PRO" ? 2 : 5)} Extra Seat{members.length - (currentTier === "PRO" ? 2 : 5) > 1 ? "s" : ""} ($9/mo each)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                {currentTier === "FREE" ? (
                  <span>Free plan includes <strong>1 user</strong> (Solo Operator). Upgrade to Starter ($19/mo) to unlock multi-technician dispatch.</span>
                ) : (
                  <span>
                    <strong>{currentTier === "PRO" ? "2 users" : "5 users"} included</strong> in your {currentTier === "PRO" ? "Starter" : "Professional"} plan. Extra technicians are billed at our affordable rate of just <strong>$9/mo per additional user</strong>.
                  </span>
                )}
              </p>
            </div>

            {currentTier === "FREE" && members.length >= 1 ? (
              <Button size="sm" onClick={() => setActiveTab("billing")} className="w-full sm:w-auto font-bold">
                Upgrade Plan to Add Users
              </Button>
            ) : (
              <Button size="sm" onClick={() => setInviteModalOpen(true)} className="w-full sm:w-auto font-bold">
                <Users className="w-4 h-4 mr-1.5" /> Invite Member
              </Button>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">Technicians & Staff</h2>
              <p className="text-xs text-muted-foreground">
                Technicians only see jobs assigned to them in the field mobile app.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <Card key={m.id} className="p-4 border-border">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{m.user.name || "Technician"}</h3>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                    {m.user.licenseNumber && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        EPA / State License: <strong>{m.user.licenseNumber}</strong>
                      </p>
                    )}
                  </div>
                  <Badge variant={m.role === "OWNER" ? "default" : "secondary"}>
                    {m.role}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* Invite Modal */}
          <Modal
            isOpen={inviteModalOpen}
            onClose={() => setInviteModalOpen(false)}
            title="Invite Team Member"
            description="Add a field technician or dispatcher to your company"
          >
            <form onSubmit={handleInviteMember} className="space-y-3">
              {currentTier === "FREE" ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                  <p className="font-semibold">User Limit Reached</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Your Free plan includes 1 user. Please upgrade to Starter ($19/mo, includes 2 users + $9/mo per additional technician) to invite team members.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">
                    Plan Seat Policy: {currentTier === "PRO" ? "2 users" : "5 users"} included
                  </p>
                  <p className="mt-0.5">
                    Additional technicians beyond included seats are billed at our affordable rate of just <strong>$9/mo per user</strong> (cancel or adjust anytime).
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Member Name</Label>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Sam Rivera"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Work Email *</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="sam@pestcontrol.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Role *</Label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="TECHNICIAN">Technician (Sees only assigned jobs in field)</option>
                  <option value="ADMIN">Admin (Full dispatch and customer access)</option>
                </select>
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteModalOpen(false)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || (currentTier === "FREE" && members.length >= 1)} className="w-full sm:w-auto font-bold">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invite"}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* Tab 3: Billing & Plans */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-primary tracking-wider block">
                  Current Active Subscription
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <h2 className="text-2xl font-black text-foreground">
                    PestPilot {currentTier === "PRO" ? "Starter" : currentTier === "BUSINESS" ? "Professional" : "Free"} Plan
                  </h2>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentTier === "FREE" && "1 user included · 20 jobs/mo · 'Powered by PestPilot' watermark"}
                  {currentTier === "PRO" && "2 users included · Unlimited jobs · $9/mo per additional user · 100% White-Label"}
                  {currentTier === "BUSINESS" && "5 users included · Unlimited jobs · $9/mo per additional user · White-Label + SMS"}
                </p>
              </div>

              {organization.subscription?.stripeCustomerId && (
                <Button variant="outline" onClick={handleOpenCustomerPortal} disabled={loading}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Stripe Customer Portal
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <Card className={`border-2 ${currentTier === "FREE" ? "border-primary" : "border-border"}`}>
              <CardHeader>
                <CardTitle className="text-lg">Free</CardTitle>
                <CardDescription>Solo operators getting started</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-black text-foreground">$0</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground font-semibold">
                    <Check className="w-4 h-4 text-emerald-500" /> 1 User / Solo Operator
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-semibold">
                    <Check className="w-4 h-4 text-emerald-500" /> 20 Jobs / Month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Offline Field Mobile PWA
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> EPA Treatment Logs & Signatures
                  </li>
                  <li className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                    &bull; &quot;Powered by PestPilot&quot; watermark on invoices
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/70">
                    &bull; Additional users not supported
                  </li>
                </ul>

                {currentTier === "FREE" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Free Tier
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Starter / Pro */}
            <Card className={`border-2 relative ${currentTier === "PRO" ? "border-primary ring-2 ring-primary/20" : "border-primary/60"}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider">
                Most Popular for Small Teams
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Starter</CardTitle>
                <CardDescription>Solo operators and small growing teams</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-black text-foreground">$19</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
                <p className="text-[11px] text-primary font-semibold mt-1">
                  2 users included · $9/mo per additional user
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground font-bold">
                    <Check className="w-4 h-4 text-emerald-500" /> 2 Users Included
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-bold">
                    <Check className="w-4 h-4 text-emerald-500" /> $9/mo Per Additional User
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-bold">
                    <Check className="w-4 h-4 text-emerald-500" /> Unlimited Jobs & Customers
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-bold text-emerald-600 dark:text-emerald-400">
                    <Check className="w-4 h-4 text-emerald-500" /> Your Brand on Every Invoice & Quote
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> Chemical Tracking & Customer Portal
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> Recurring Service Plans & Auto-Invoicing
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> Stripe Credit Card Payments
                  </li>
                </ul>

                {currentTier === "PRO" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full font-bold"
                    onClick={() => handleUpgradePlan("PRO")}
                    disabled={loading}
                  >
                    Upgrade to Starter ($19/mo)
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Professional / Business */}
            <Card className={`border-2 ${currentTier === "BUSINESS" ? "border-primary" : "border-border"}`}>
              <CardHeader>
                <CardTitle className="text-lg">Professional</CardTitle>
                <CardDescription>Growing fleets requiring full route visibility</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-black text-foreground">$39</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
                <p className="text-[11px] text-primary font-semibold mt-1">
                  5 users included · $9/mo per additional user
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground font-bold">
                    <Check className="w-4 h-4 text-emerald-500" /> 5 Users Included
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-bold">
                    <Check className="w-4 h-4 text-emerald-500" /> $9/mo Per Additional User
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-bold">
                    <Check className="w-4 h-4 text-emerald-500" /> Everything in Starter
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-bold text-emerald-600 dark:text-emerald-400">
                    <Check className="w-4 h-4 text-emerald-500" /> 100% White-Label Branding
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> SMS Reminders & Dispatch Notifications
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> Technician Scorecards & License Tracking
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> EPA Compliance Audit PDF Exports
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> Priority 24/7 Support
                  </li>
                </ul>

                {currentTier === "BUSINESS" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full font-bold"
                    onClick={() => handleUpgradePlan("BUSINESS")}
                    disabled={loading}
                  >
                    Upgrade to Professional ($39/mo)
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 4: Conflicts Resolved Log */}
      {activeTab === "conflicts" && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Offline Sync & Conflict Log</CardTitle>
            <CardDescription>
              Last-write-wins resolutions between field devices and central dispatch. Treatment logs and payments are append-only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conflicts.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">
                No data conflicts recorded. All local and remote changes are cleanly synchronized.
              </p>
            ) : (
              <div className="space-y-2">
                {conflicts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg border border-border text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-foreground">
                        {c.entity} (ID: {c.entityId.slice(0, 8)}...)
                      </p>
                      <p className="text-muted-foreground">{c.resolution}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatDate(c.resolvedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Audit Log */}
      {activeTab === "audit" && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>System Audit Log</CardTitle>
            <CardDescription>
              Security and operational tracking for create, update, and delete actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">[{log.action}]</span>{" "}
                    <span className="font-semibold text-primary">{log.entityType}</span>{" "}
                    <span className="text-muted-foreground">by {log.user?.name || "System"}</span>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

