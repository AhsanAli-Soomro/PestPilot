"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { AiPestIdentifier } from "@/components/ai-pest-identifier";
import { PriceCalculator } from "@/components/price-calculator";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Repeat,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Phone,
  Download,
  QrCode,
  AlertOctagon,
  XCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  bookCustomerServiceAction,
  rescheduleCustomerAppointmentAction,
  cancelCustomerAppointmentAction,
  submitCustomerComplaintAction,
  renewCustomerServicePlanAction,
  logoutCustomerPortalAction,
} from "@/actions/portal";
import { formatDate, formatMoney } from "@/lib/utils";

interface PortalClientProps {
  initialCustomer: any;
  loggedInIdentifier?: string;
}

export function PortalClient({ initialCustomer, loggedInIdentifier }: PortalClientProps) {
  const [customer, setCustomer] = React.useState(initialCustomer);
  const [activeTab, setActiveTab] = React.useState<"appointments" | "history" | "invoices" | "amc" | "complaints" | "tools">("appointments");
  const [loading, setLoading] = React.useState(false);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = React.useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = React.useState(false);
  const [selectedJobToReschedule, setSelectedJobToReschedule] = React.useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [rescheduleTime, setRescheduleTime] = React.useState("09:00");

  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);
  const [selectedJobToCancel, setSelectedJobToCancel] = React.useState<any | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");

  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);
  const [activeQrData, setActiveQrData] = React.useState<any | null>(null);

  // New Booking form
  const [newPestType, setNewPestType] = React.useState("General Cockroach & Ant Control");
  const [newPreferredDate, setNewPreferredDate] = React.useState("");
  const [newPreferredTime, setNewPreferredTime] = React.useState("10:00");
  const [newNotes, setNewNotes] = React.useState("");

  // Complaint form
  const [complaintSubject, setComplaintSubject] = React.useState("");
  const [complaintDetails, setComplaintDetails] = React.useState("");
  const [warrantyCallback, setWarrantyCallback] = React.useState(true);

  const org = customer.organization || {};
  const upcomingJobs = (customer.jobs || []).filter((j: any) => j.status !== "COMPLETED");
  const completedJobs = (customer.jobs || []).filter((j: any) => j.status === "COMPLETED");
  const invoices = customer.invoices || [];

  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("customerId", customer.id);
      fd.append("pestType", newPestType);
      fd.append("preferredDate", newPreferredDate);
      fd.append("preferredTime", newPreferredTime);
      fd.append("notes", newNotes);
      fd.append("propertyAddress", customer.properties?.[0]?.address || "");

      const res = await bookCustomerServiceAction(fd);
      if (res.success) {
        toast.success(res.message);
        setIsBookModalOpen(false);
      } else {
        toast.error(res.error || "Failed to book service");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobToReschedule) return;
    setLoading(true);
    try {
      const res = await rescheduleCustomerAppointmentAction(
        selectedJobToReschedule.id,
        rescheduleDate,
        rescheduleTime
      );
      if (res.success) {
        toast.success(res.message);
        setIsRescheduleModalOpen(false);
      } else {
        toast.error(res.error || "Rescheduling failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobToCancel) return;
    setLoading(true);
    try {
      const res = await cancelCustomerAppointmentAction(selectedJobToCancel.id, cancelReason);
      if (res.success) {
        toast.success(res.message);
        setIsCancelModalOpen(false);
      } else {
        toast.error(res.error || "Cancellation failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("subject", complaintSubject);
      fd.append("details", complaintDetails);
      fd.append("callback", warrantyCallback ? "true" : "false");

      const res = await submitCustomerComplaintAction(fd);
      if (res.success) {
        toast.success(res.message);
        setComplaintSubject("");
        setComplaintDetails("");
      } else {
        toast.error(res.error || "Failed to submit");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRenewAMC = async () => {
    setLoading(true);
    try {
      const res = await renewCustomerServicePlanAction(customer.activeAMC?.id || "demo-amc");
      if (res.success) {
        toast.success(res.message);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await logoutCustomerPortalAction();
    toast.success("Signed out of Customer Portal");
    window.location.href = "/portal";
  };

  return (
    <div className="space-y-6">
      {/* Customer Session Status & Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2.5 px-4 rounded-xl bg-card border border-border shadow-sm text-xs gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-muted-foreground">Active Customer Account:</span>
          <span className="font-bold text-foreground">
            {customer.firstName} {customer.lastName}
          </span>
          <span className="text-muted-foreground/70 hidden sm:inline">
            &bull; {customer.email || customer.phone || loggedInIdentifier}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-xs h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          Sign Out / Switch Customer
        </Button>
      </div>

      {/* Top Welcome Header & Contact Bar */}
      <Card className="border-border bg-gradient-to-r from-primary/10 via-card to-card shadow-sm overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Customer Self-Service Portal
              </span>
              <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                Account Active
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-foreground">
              Welcome back, {customer.firstName} {customer.lastName}!
            </h1>
            <p className="text-xs text-muted-foreground">
              {customer.properties?.[0]?.address || "Primary Property Address on file"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`https://api.whatsapp.com/send?phone=${(org.phone || "").replace(/[^0-9]/g, "")}&text=${encodeURIComponent(
                `Hello ${org.name || "PestPilot"}, I am customer ${customer.firstName} ${customer.lastName} inquiring about my pest service account.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Support
            </a>

            <Button size="sm" onClick={() => setIsBookModalOpen(true)} className="font-bold">
              <Plus className="w-4 h-4 mr-1.5" /> Book Service
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border overflow-x-auto gap-4 pb-1">
        {[
          { id: "appointments", label: "Appointments", badge: upcomingJobs.length },
          { id: "history", label: "Treatment History & Certificates" },
          { id: "invoices", label: "Invoices & Payments" },
          { id: "amc", label: "Maintenance Plan (AMC)" },
          { id: "complaints", label: "Complaints & Warranty" },
          { id: "tools", label: "AI Scanner & Calculator" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-extrabold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Upcoming Appointments */}
      {activeTab === "appointments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Upcoming Scheduled Visits</h2>
            <Button size="sm" variant="outline" onClick={() => setIsBookModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> New Appointment
            </Button>
          </div>

          {upcomingJobs.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">No upcoming visits scheduled</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Need treatment? Click &apos;Book Service&apos; above to choose a convenient slot.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingJobs.map((job: any) => (
                <Card key={job.id} className="border-border shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{job.title}</h3>
                      <p className="text-xs text-muted-foreground">{job.description}</p>
                    </div>
                    <Badge variant="warning" className="text-[10px] uppercase font-extrabold">
                      {job.status}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/40 text-xs space-y-1.5 border border-border/50">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{formatDate(job.scheduledDate)}</span>
                      <Clock className="w-3.5 h-3.5 text-primary ml-2" />
                      <span>{job.scheduledStartTime || "Morning"} - {job.scheduledEndTime || "Afternoon"}</span>
                    </div>
                    {job.technician?.name && (
                      <p className="text-[11px] text-muted-foreground">
                        Assigned Technician: <strong>{job.technician.name}</strong>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedJobToReschedule(job);
                        setRescheduleDate(job.scheduledDate?.split("T")[0] || "");
                        setIsRescheduleModalOpen(true);
                      }}
                      className="text-xs h-8"
                    >
                      Reschedule
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedJobToCancel(job);
                        setIsCancelModalOpen(true);
                      }}
                      className="text-xs h-8 text-destructive hover:bg-destructive/10"
                    >
                      Cancel Visit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Treatment History & Certificates */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Completed Treatments &amp; EPA Certificates</h2>

          {completedJobs.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">No completed treatments yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Completed service records and EPA compliance certificates will appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedJobs.map((job: any) => {
                const log = job.treatmentLogs?.[0];
                return (
                  <Card key={job.id} className="border-border p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <h3 className="font-bold text-sm text-foreground">{job.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Completed on {formatDate(job.completedAt || job.scheduledDate)} by {log?.applicatorName || "Licensed Applicator"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveQrData({
                              jobId: job.id,
                              title: job.title,
                              date: formatDate(job.completedAt || job.scheduledDate),
                              applicator: log?.applicatorName,
                              license: log?.licenseNumber,
                              chemicals: log?.chemicalProduct,
                            });
                            setIsQrModalOpen(true);
                          }}
                          className="text-xs h-8"
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1 text-primary" />
                          Verify Certificate
                        </Button>
                      </div>
                    </div>

                    {log && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/50">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                            Target Pest Treated:
                          </span>
                          <span className="font-semibold text-foreground">{log.pestType}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                            EPA Product &amp; Reg No:
                          </span>
                          <span className="font-semibold text-foreground">{log.chemicalProduct}</span>
                          <p className="text-[10px] text-muted-foreground">EPA Reg #{log.epaRegistrationNumber}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                            Quantity Applied:
                          </span>
                          <span className="text-foreground">{log.quantity}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                            Areas Treated:
                          </span>
                          <span className="text-foreground">{log.areasTreated}</span>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Invoices & Payments */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Billing Statements &amp; Online Payment</h2>

          {invoices.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">No invoices found</p>
              <p className="text-xs text-muted-foreground mt-0.5">Your account has zero outstanding balances.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv: any) => {
                const isPaid = inv.status === "PAID";
                return (
                  <Card key={inv.id} className="p-4 border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">Invoice #{inv.invoiceNumber}</span>
                        <Badge variant={isPaid ? "success" : "warning"} className="text-[10px] font-bold">
                          {inv.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Issued: {formatDate(inv.createdAt || new Date().toISOString())} &bull; Due: {formatDate(inv.dueDate || new Date().toISOString())}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-foreground">
                        {formatMoney(inv.totalCents, org.currency || "USD")}
                      </span>

                      {!isPaid && (
                        <a
                          href={`/invoice/${inv.publicToken}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Pay Online
                        </a>
                      )}

                      <a
                        href={`/invoice/${inv.publicToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Receipt
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Annual Maintenance (AMC) */}
      {activeTab === "amc" && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground">Annual Maintenance Contract (AMC) &amp; Warranty</h2>

          {customer.activeAMC ? (
            <Card className="border-primary/40 bg-primary/5 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/20 pb-4">
                <div>
                  <Badge variant="outline" className="text-primary border-primary text-[10px] uppercase font-bold">
                    Active Warranty Plan
                  </Badge>
                  <h3 className="text-xl font-black text-foreground mt-1">{customer.activeAMC.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Frequency: {customer.activeAMC.frequency} &bull; Next Scheduled Service: {customer.activeAMC.nextVisit}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-foreground">
                    {formatMoney(customer.activeAMC.priceCents, org.currency || "USD")}
                  </span>
                  <span className="text-xs text-muted-foreground block">/ renewal cycle</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-bold text-foreground block">Your Plan Protections Include:</span>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span><strong>100% Pest-Free Guarantee:</strong> Free unlimited callback visits between scheduled treatments if bugs return.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span><strong>Complete Barrier Coverage:</strong> Exterior foundation perimeter, crawlspaces, garage, and attic dusting.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span><strong>Priority Scheduling:</strong> Guaranteed 24-hour response window for emergency termite or rodent activity.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={handleRenewAMC} disabled={loading} className="font-bold shadow-md shadow-primary/25">
                  <Repeat className="w-4 h-4 mr-1.5" />
                  Renew / Extend AMC Protection
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No Active Maintenance Plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Protect your home year-round with our Annual Maintenance Contract.
              </p>
              <Button size="sm" onClick={() => setIsBookModalOpen(true)} className="mt-4 font-bold">
                Subscribe to Quarterly AMC
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Tab 5: Complaints & Warranty Callbacks */}
      {activeTab === "complaints" && (
        <div className="max-w-2xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Submit Complaint or Request Warranty Callback</h2>
            <p className="text-xs text-muted-foreground">
              If pests reappear after service or you have quality concerns, let us know immediately.
            </p>
          </div>

          <Card className="border-border p-5">
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Subject / Issue Category *</Label>
                <Input
                  required
                  placeholder="e.g. Ants reappeared in kitchen, missed appointment, odor complaint"
                  value={complaintSubject}
                  onChange={(e) => setComplaintSubject(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Description of Problem *</Label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please provide details about the location, pest activity, or any specific instructions..."
                  value={complaintDetails}
                  onChange={(e) => setComplaintDetails(e.target.value)}
                  className="w-full rounded-xl border border-input bg-card p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <input
                  type="checkbox"
                  id="callback-req"
                  checked={warrantyCallback}
                  onChange={(e) => setWarrantyCallback(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <label htmlFor="callback-req" className="font-semibold text-foreground cursor-pointer">
                  Request Free Re-treatment / Warranty Callback by a Senior Technician
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <AlertOctagon className="w-4 h-4 mr-2" />}
                Submit Complaint to Quality Assurance
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Tab 6: AI Scanner & Price Calculator */}
      {activeTab === "tools" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-foreground">Free Customer Self-Service Tools</h2>
            <p className="text-xs text-muted-foreground">
              Identify unexpected pests with our free AI vision scanner or calculate instant service pricing
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AiPestIdentifier
              mode="customer"
              onBookService={(pestName) => {
                setNewPestType(pestName);
                setIsBookModalOpen(true);
              }}
            />

            <PriceCalculator
              onBookPlan={(planName) => {
                setNewPestType(planName);
                setIsBookModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Book Service Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule Pest Control Service"
        description="Select your target pest and preferred appointment slot"
        className="max-w-md"
      >
        <form onSubmit={handleBookService} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Service Type / Target Pest *</Label>
            <select
              value={newPestType}
              onChange={(e) => setNewPestType(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-card px-3 text-xs"
            >
              <option value="General Cockroach & Ant Control">General Cockroach &amp; Ant Control</option>
              <option value="Subterranean Termite Barrier Treatment">Subterranean Termite Barrier Treatment</option>
              <option value="Bedbug Heat & Chemical Extermination">Bedbug Heat &amp; Chemical Extermination</option>
              <option value="Rodent Exclusion & Baiting (Mice & Rats)">Rodent Exclusion &amp; Baiting</option>
              <option value="Wasp & Hornet Nest Removal">Wasp &amp; Hornet Nest Removal</option>
              <option value="Quarterly Preventive Perimeter Defense">Quarterly Preventive Perimeter Defense (AMC)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Preferred Date *</Label>
              <Input
                type="date"
                required
                value={newPreferredDate}
                onChange={(e) => setNewPreferredDate(e.target.value)}
                className="text-xs h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Time Window</Label>
              <select
                value={newPreferredTime}
                onChange={(e) => setNewPreferredTime(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-card px-2 text-xs"
              >
                <option value="09:00">Morning (9:00 AM - 12:00 PM)</option>
                <option value="13:00">Afternoon (1:00 PM - 4:00 PM)</option>
                <option value="16:00">Evening (4:00 PM - 7:00 PM)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Special Instructions / Gate Notes</Label>
            <Input
              placeholder="e.g. Dogs in backyard, knock back door"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="text-xs h-10"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title="Reschedule Appointment"
        description="Choose a new date and time window for your visit"
        className="max-w-sm"
      >
        <form onSubmit={handleReschedule} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">New Preferred Date *</Label>
            <Input
              type="date"
              required
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Time Window</Label>
            <select
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-full h-10 rounded-lg border border-input bg-card px-2 text-xs"
            >
              <option value="09:00">Morning (9:00 AM - 12:00 PM)</option>
              <option value="13:00">Afternoon (1:00 PM - 4:00 PM)</option>
              <option value="16:00">Evening (4:00 PM - 7:00 PM)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save New Date"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Appointment Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this scheduled visit?"
        className="max-w-sm"
      >
        <form onSubmit={handleCancelAppointment} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Reason for Cancellation</Label>
            <Input
              placeholder="e.g. Schedule conflict, problem resolved"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              Keep Visit
            </Button>
            <Button type="submit" variant="destructive" size="sm" disabled={loading} className="font-bold">
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Certificate Verification Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Official Pest Treatment Certificate"
        description="Certified EPA Record Verification"
        className="max-w-sm"
      >
        {activeQrData && (
          <div className="space-y-4 text-center">
            {/* SVG QR Code Simulation */}
            <div className="p-4 rounded-2xl bg-white border border-border inline-block mx-auto shadow-md">
              <svg
                viewBox="0 0 100 100"
                className="w-36 h-36 mx-auto text-black"
                fill="currentColor"
              >
                {/* Visual QR Code Grid Pattern */}
                <rect x="5" y="5" width="25" height="25" fill="#111" />
                <rect x="10" y="10" width="15" height="15" fill="#fff" />
                <rect x="14" y="14" width="7" height="7" fill="#111" />
                <rect x="70" y="5" width="25" height="25" fill="#111" />
                <rect x="75" y="10" width="15" height="15" fill="#fff" />
                <rect x="79" y="14" width="7" height="7" fill="#111" />
                <rect x="5" y="70" width="25" height="25" fill="#111" />
                <rect x="10" y="75" width="15" height="15" fill="#fff" />
                <rect x="14" y="79" width="7" height="7" fill="#111" />
                <rect x="35" y="10" width="8" height="8" fill="#111" />
                <rect x="48" y="10" width="8" height="8" fill="#111" />
                <rect x="35" y="35" width="8" height="8" fill="#111" />
                <rect x="55" y="35" width="8" height="8" fill="#111" />
                <rect x="75" y="45" width="8" height="8" fill="#111" />
                <rect x="45" y="55" width="8" height="8" fill="#111" />
                <rect x="60" y="70" width="8" height="8" fill="#111" />
                <rect x="80" y="75" width="8" height="8" fill="#111" />
                <rect x="40" y="80" width="8" height="8" fill="#111" />
              </svg>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-extrabold">
                <ShieldCheck className="w-4 h-4" />
                <span>AUTHENTIC PEST TREATMENT RECORD</span>
              </div>
              <p className="font-bold text-foreground">{activeQrData.title}</p>
              <p className="text-muted-foreground">{activeQrData.date}</p>
              <p className="text-[11px] text-muted-foreground">
                Applicator: {activeQrData.applicator} ({activeQrData.license || "Licensed"})
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  window.open(`/verify/${activeQrData.jobId}`, "_blank");
                }}
              >
                Open Full Verification Page
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

