"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  AlertOctagon,
  CheckCircle2,
  Phone,
  MessageSquare,
  Clock,
  ArrowRight,
  ShieldAlert,
  Search,
  Plus,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

interface ComplaintItem {
  id: string;
  customerName: string;
  phone: string;
  propertyAddress: string;
  subject: string;
  details: string;
  status: "PENDING" | "CALLBACK_SCHEDULED" | "RESOLVED";
  isWarrantyCallback: boolean;
  submittedAt: string;
}

const INITIAL_COMPLAINTS: ComplaintItem[] = [
  {
    id: "comp-1",
    customerName: "Mrs. Sarah Jenkins",
    phone: "+1 (555) 234-5678",
    propertyAddress: "742 Evergreen Terrace",
    subject: "Ants reappeared on kitchen island 4 days post-spray",
    details: "Customer reports black ants trail near dishwasher. Needs immediate touch-up under warranty.",
    status: "PENDING",
    isWarrantyCallback: true,
    submittedAt: "3 hours ago",
  },
  {
    id: "comp-2",
    customerName: "Kamran Akram",
    phone: "+92 321 8877665",
    propertyAddress: "Plot 18, Block 4, Clifton",
    subject: "Technician arrived 30 minutes past window",
    details: "Customer requested ETA notification in advance next time. Service was satisfactory otherwise.",
    status: "RESOLVED",
    isWarrantyCallback: false,
    submittedAt: "Yesterday",
  },
];

export function ComplaintsClient() {
  const [complaints, setComplaints] = React.useState(INITIAL_COMPLAINTS);
  const [search, setSearch] = React.useState("");
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);

  // Form state
  const [customerName, setCustomerName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [propertyAddress, setPropertyAddress] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [isWarranty, setIsWarranty] = React.useState(true);

  const filtered = complaints.filter(
    (c) =>
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    const item: ComplaintItem = {
      id: `comp-${Date.now()}`,
      customerName,
      phone,
      propertyAddress,
      subject,
      details,
      status: "PENDING",
      isWarrantyCallback: isWarranty,
      submittedAt: "Just now",
    };
    setComplaints([item, ...complaints]);
    toast.success("Complaint recorded and flagged for callback");
    setIsNewModalOpen(false);
  };

  const handleUpdateStatus = (id: string, newStatus: any) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    toast.success(`Complaint marked as ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Pending Review</span>
            <Badge variant="destructive">Urgent</Badge>
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {complaints.filter((c) => c.status === "PENDING").length} Tickets
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Under 24h resolution target</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Free Warranty Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">98.4% First-Time Fix</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">High applicator effectiveness</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Resolved This Month</span>
            <Badge variant="success">Closed</Badge>
          </div>
          <div className="text-2xl font-black text-foreground mt-2">1 Resolved</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Customer satisfaction maintained</p>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search complaints by customer, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-10"
          />
        </div>

        <Button onClick={() => setIsNewModalOpen(true)} className="font-bold">
          <Plus className="w-4 h-4 mr-1.5" /> Log Complaint / Callback
        </Button>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {filtered.map((comp) => (
          <Card key={comp.id} className="p-4 border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">{comp.customerName}</h3>
                <Badge
                  variant={
                    comp.status === "PENDING"
                      ? "destructive"
                      : comp.status === "CALLBACK_SCHEDULED"
                      ? "warning"
                      : "success"
                  }
                  className="text-[10px] font-extrabold uppercase"
                >
                  {comp.status}
                </Badge>
                {comp.isWarrantyCallback && (
                  <Badge variant="outline" className="text-primary border-primary text-[10px] font-bold">
                    Free Warranty Callback
                  </Badge>
                )}
                <span className="text-[11px] text-muted-foreground">&bull; {comp.submittedAt}</span>
              </div>

              <p className="text-xs font-bold text-foreground">{comp.subject}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{comp.details}</p>
              <p className="text-[11px] text-muted-foreground">Property: {comp.propertyAddress}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${comp.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-primary" /> Call
              </a>

              <a
                href={`https://api.whatsapp.com/send?phone=${comp.phone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(
                  `Hello ${comp.customerName}, we received your inquiry regarding "${comp.subject}". We are dispatching a senior technician under your warranty guarantee.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </a>

              {comp.status !== "RESOLVED" && (
                <Link href={`/schedule`}>
                  <Button size="sm" className="text-xs h-8 font-bold">
                    <Truck className="w-3.5 h-3.5 mr-1" /> Dispatch Callback
                  </Button>
                </Link>
              )}

              {comp.status !== "RESOLVED" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(comp.id, "RESOLVED")}
                  className="text-xs h-8"
                >
                  Mark Resolved
                </Button>
              ) : (
                <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-xs">
                  Closed
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Complaint Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Log Customer Complaint or Callback"
        description="Record customer problem for quality assurance and warranty scheduling"
        className="max-w-md"
      >
        <form onSubmit={handleCreateComplaint} className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Customer Name *</Label>
            <Input required placeholder="Sarah Jenkins" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Phone Number *</Label>
              <Input required placeholder="+1 (555) 234-5678" value={phone} onChange={(e) => setPhone(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Property Address</Label>
              <Input placeholder="742 Evergreen Terr" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} className="text-xs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Subject / Pest Problem *</Label>
            <Input required placeholder="Ants reappeared in kitchen" value={subject} onChange={(e) => setSubject(e.target.value)} className="text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Details &amp; Notes</Label>
            <textarea
              rows={3}
              placeholder="Provide context on treatment date and areas of concern..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-lg border border-input bg-card p-2 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-xs text-foreground">
            <input
              type="checkbox"
              id="warr-cb"
              checked={isWarranty}
              onChange={(e) => setIsWarranty(e.target.checked)}
              className="rounded text-primary focus:ring-primary w-4 h-4"
            />
            <label htmlFor="warr-cb" className="font-semibold cursor-pointer">
              Tag as 100% Free Warranty Callback Job
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              Save Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

