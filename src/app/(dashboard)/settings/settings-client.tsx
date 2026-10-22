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
      <div className="flex border-b border-border space-x-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("company")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "company"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Company Profile
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "team"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Team & Trucks ({members.length})
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "billing"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Subscription & Plans
        </button>
        <button
          onClick={() => setActiveTab("conflicts")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "conflicts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Offline Conflicts ({conflicts.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
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
          <CardContent>
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-foreground">Technicians & Staff</h2>
              <p className="text-xs text-muted-foreground">
                Technicians only see jobs assigned to them.
              </p>
            </div>
            <Button size="sm" onClick={() => setInviteModalOpen(true)}>
              <Users className="w-4 h-4 mr-1.5" /> Invite Member
            </Button>
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
            description="Enforced according to your current plan user limits"
          >
            <form onSubmit={handleInviteMember} className="space-y-3">
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

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInviteModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
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
                  <h2 className="text-2xl font-black text-foreground">PestPilot {currentTier} Plan</h2>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enforces server-side limits on truck users and monthly jobs.
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
                    <Check className="w-4 h-4 text-emerald-500" /> 1 User / Truck
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-semibold">
                    <Check className="w-4 h-4 text-emerald-500" /> 20 Jobs / Month
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> Offline Mobile App
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" /> EPA Treatment Logs
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground/70">
                    &bull; &quot;Powered by PestPilot&quot; footer
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

            {/* Pro */}
            <Card className={`border-2 relative ${currentTier === "PRO" ? "border-primary ring-2 ring-primary/20" : "border-primary/60"}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold uppercase tracking-wider">
                Most Popular (1-3 Trucks)
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Pro</CardTitle>
                <CardDescription>Small growing fleet</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-black text-foreground">$29</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground font-bold">
                    <Check className="w-4 h-4 text-emerald-500" /> Up to 3 Users / Technicians
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-bold">
                    <Check className="w-4 h-4 text-emerald-500" /> Unlimited Jobs / Month
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> Auto-Invoicing & Reminders
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> Stripe Card Payments
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> Remove &quot;Powered by&quot; branding
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
                    Upgrade to Pro ($29/mo)
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Business */}
            <Card className={`border-2 ${currentTier === "BUSINESS" ? "border-primary" : "border-border"}`}>
              <CardHeader>
                <CardTitle className="text-lg">Business</CardTitle>
                <CardDescription>Established 4-10 truck companies</CardDescription>
                <div className="pt-2">
                  <span className="text-3xl font-black text-foreground">$59</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2 text-foreground font-bold">
                    <Check className="w-4 h-4 text-emerald-500" /> Up to 10 Users / Trucks
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-bold">
                    <Check className="w-4 h-4 text-emerald-500" /> Unlimited Jobs & Customers
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> SMS Appointment Reminders (Twilio)
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> Compliance PDF Export
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-4 h-4 text-emerald-500" /> Priority Support
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
                    Upgrade to Business ($59/mo)
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

