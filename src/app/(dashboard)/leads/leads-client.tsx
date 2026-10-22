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
  UserPlus,
  Phone,
  Mail,
  ArrowRight,
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface LeadsClientProps {
  customers: any[];
  currency: string;
}

const INITIAL_LEADS = [
  {
    id: "lead-1",
    name: "Dr. Tariq Mehmood",
    phone: "+92 300 8271920",
    email: "tariq.mehmood@clinic.pk",
    pestType: "Termites in wooden clinic floorboards",
    status: "NEW",
    source: "Website Price Calculator",
    estimatedValue: "$350",
    createdAt: "2 hours ago",
  },
  {
    id: "lead-2",
    name: "Fatima Farooq",
    phone: "+92 321 4455667",
    email: "fatima.f@gmail.com",
    pestType: "Bedbugs in master bedroom",
    status: "CONTACTED",
    source: "AI Pest Scanner Upload",
    estimatedValue: "$220",
    createdAt: "5 hours ago",
  },
  {
    id: "lead-3",
    name: "Ocean View Restaurant (Manager Bilal)",
    phone: "+92 333 1122334",
    email: "bilal@oceanview.com",
    pestType: "Commercial Kitchen Cockroach Monthly AMC",
    status: "QUOTE_SENT",
    source: "Direct Inbound Phone",
    estimatedValue: "$850/yr",
    createdAt: "Yesterday",
  },
];

export function LeadsClient({ customers, currency }: LeadsClientProps) {
  const [leads, setLeads] = React.useState(INITIAL_LEADS);
  const [search, setSearch] = React.useState("");
  const [isNewLeadOpen, setIsNewLeadOpen] = React.useState(false);

  // New Lead form
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pestType, setPestType] = React.useState("Termites / Bedbugs");
  const [estimatedValue, setEstimatedValue] = React.useState("$180");

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.pestType.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search)
  );

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      id: `lead-${Date.now()}`,
      name,
      phone,
      email,
      pestType,
      status: "NEW",
      source: "Manual Staff Entry",
      estimatedValue,
      createdAt: "Just now",
    };
    setLeads([newEntry, ...leads]);
    toast.success("New inquiry added to pipeline");
    setIsNewLeadOpen(false);
    setName("");
    setPhone("");
    setEmail("");
  };

  const handleUpdateStatus = (leadId: string, newStatus: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    toast.success(`Lead moved to ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">New Inquiries</span>
            <Badge variant="warning">Action Needed</Badge>
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {leads.filter((l) => l.status === "NEW").length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Average response time: &lt; 15 mins</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Active Follow-ups</span>
            <Badge variant="secondary">In Pipeline</Badge>
          </div>
          <div className="text-2xl font-black text-foreground mt-2">
            {leads.filter((l) => l.status === "CONTACTED" || l.status === "QUOTE_SENT").length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Proposals sent &amp; waiting approval</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-muted-foreground">Est. Pipeline Value</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground mt-2">$1,420</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ready for 1-click quote conversion</p>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, pest, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-10"
          />
        </div>

        <Button onClick={() => setIsNewLeadOpen(true)} className="font-bold">
          <Plus className="w-4 h-4 mr-1.5" /> Add Lead
        </Button>
      </div>

      {/* Leads Table / Cards */}
      <div className="space-y-3">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="p-4 border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground">{lead.name}</h3>
                <Badge
                  variant={
                    lead.status === "NEW"
                      ? "warning"
                      : lead.status === "QUOTE_SENT"
                      ? "default"
                      : "secondary"
                  }
                  className="text-[10px] font-extrabold uppercase"
                >
                  {lead.status}
                </Badge>
                <span className="text-[11px] text-muted-foreground">&bull; {lead.createdAt}</span>
              </div>

              <p className="text-xs font-semibold text-primary">{lead.pestType}</p>
              <p className="text-[11px] text-muted-foreground">
                Source: {lead.source} &bull; Est. Value: <strong className="text-foreground">{lead.estimatedValue}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-primary" /> Call
              </a>

              <a
                href={`https://api.whatsapp.com/send?phone=${lead.phone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(
                  `Hello ${lead.name}, thank you for your pest control inquiry regarding ${lead.pestType}. We would love to provide you with an inspection quote.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </a>

              {lead.status === "NEW" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(lead.id, "CONTACTED")}
                  className="text-xs h-8"
                >
                  Mark Contacted
                </Button>
              )}

              <Link href={`/quotes?customer=${encodeURIComponent(lead.name)}`}>
                <Button size="sm" className="text-xs h-8 font-bold">
                  Convert to Quote <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Lead Modal */}
      <Modal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        title="Add New Pest Control Inquiry"
        description="Enter customer lead details to track follow-ups and estimate conversion"
        className="max-w-md"
      >
        <form onSubmit={handleCreateLead} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Lead / Company Name *</Label>
            <Input required placeholder="Ahmed Khan" value={name} onChange={(e) => setName(e.target.value)} className="text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Phone Number *</Label>
              <Input required placeholder="+92 300 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} className="text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address</Label>
              <Input type="email" placeholder="client@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="text-xs" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Target Pest / Issue</Label>
            <Input placeholder="e.g. Subterranean Termites in door frame" value={pestType} onChange={(e) => setPestType(e.target.value)} className="text-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Estimated Deal Value</Label>
            <Input placeholder="$250" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} className="text-xs" />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewLeadOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              Save Lead
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
