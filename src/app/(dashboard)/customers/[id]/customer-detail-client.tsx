"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileSpreadsheet,
  Receipt,
  Plus,
  KeyRound,
  ShieldAlert,
  Edit,
  Loader2,
  Building,
} from "lucide-react";
import { updateCustomerAction, createPropertyAction } from "@/actions/customers";
import { toast } from "sonner";

interface CustomerDetailClientProps {
  customer: any;
  currency: string;
}

export function CustomerDetailClient({ customer, currency }: CustomerDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"properties" | "jobs" | "quotes" | "invoices">("properties");
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Edit Customer form state
  const [firstName, setFirstName] = React.useState(customer.firstName);
  const [lastName, setLastName] = React.useState(customer.lastName);
  const [companyName, setCompanyName] = React.useState(customer.companyName || "");
  const [email, setEmail] = React.useState(customer.email);
  const [phone, setPhone] = React.useState(customer.phone);
  const [tags, setTags] = React.useState(customer.tags || "");
  const [notes, setNotes] = React.useState(customer.notes || "");

  // Add Property form state
  const [address, setAddress] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [city, setCity] = React.useState("Austin");
  const [state, setState] = React.useState("TX");
  const [postalCode, setPostalCode] = React.useState("");
  const [gateCode, setGateCode] = React.useState("");
  const [petsKidsWarnings, setPetsKidsWarnings] = React.useState("");
  const [propertyNotes, setPropertyNotes] = React.useState("");

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("companyName", companyName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("tags", tags);
      formData.append("notes", notes);

      const res = await updateCustomerAction(customer.id, formData);
      if (!res.success) {
        toast.error(res.error || "Failed to update customer");
        return;
      }

      toast.success("Customer details updated!");
      setIsEditModalOpen(false);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("customerId", customer.id);
      formData.append("address", address);
      formData.append("unit", unit);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("postalCode", postalCode);
      formData.append("gateCode", gateCode);
      formData.append("petsKidsWarnings", petsKidsWarnings);
      formData.append("notes", propertyNotes);

      const res = await createPropertyAction(formData);
      if (!res.success) {
        toast.error(res.error || "Failed to add property");
        return;
      }

      toast.success("Service address added!");
      setIsAddPropertyModalOpen(false);
      setAddress("");
      setUnit("");
      setPostalCode("");
      setGateCode("");
      setPetsKidsWarnings("");
      setPropertyNotes("");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Header Card */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-foreground">
                  {customer.firstName} {customer.lastName}
                </h1>
                {customer.companyName && (
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> {customer.companyName}
                  </span>
                )}
              </div>

              {customer.tags && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customer.tags.split(",").map((t: string) => (
                    <Badge key={t} variant="secondary">
                      {t.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit className="w-4 h-4 mr-1.5" /> Edit Customer
              </Button>
              <Link href={`/quotes?newQuote=true&customerId=${customer.id}`}>
                <Button size="sm">
                  <FileSpreadsheet className="w-4 h-4 mr-1.5" /> New Quote
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 mt-4 border-t border-border text-sm">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Phone</p>
              <a href={`tel:${customer.phone}`} className="font-semibold text-primary hover:underline">
                {customer.phone}
              </a>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Email</p>
              <a href={`mailto:${customer.email}`} className="font-semibold text-primary hover:underline">
                {customer.email}
              </a>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">Notes</p>
              <p className="text-muted-foreground text-xs">{customer.notes || "No notes on account"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-4">
        <button
          onClick={() => setActiveTab("properties")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "properties"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Properties ({customer.properties.length})
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "jobs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Jobs ({customer.jobs.length})
        </button>
        <button
          onClick={() => setActiveTab("quotes")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "quotes"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Quotes ({customer.quotes.length})
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "invoices"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Invoices ({customer.invoices.length})
        </button>
      </div>

      {/* Tab 1: Properties */}
      {activeTab === "properties" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">Service Addresses</h2>
            <Button size="sm" onClick={() => setIsAddPropertyModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Address
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.properties.map((prop: any) => (
              <Card key={prop.id} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" />
                        {prop.address} {prop.unit && `#${prop.unit}`}
                      </CardTitle>
                      <CardDescription>
                        {prop.city}, {prop.state} {prop.postalCode}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {prop.gateCode && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 font-medium">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Gate Code: <strong>{prop.gateCode}</strong></span>
                    </div>
                  )}

                  {prop.petsKidsWarnings && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>{prop.petsKidsWarnings}</span>
                    </div>
                  )}

                  {prop.notes && (
                    <p className="text-muted-foreground pt-1">
                      <strong>Notes:</strong> {prop.notes}
                    </p>
                  )}

                  <div className="pt-2 flex gap-2">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${prop.address}, ${prop.city}, ${prop.state} ${prop.postalCode}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-semibold hover:underline text-xs inline-flex items-center gap-1"
                    >
                      Open in Maps &rarr;
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Jobs History */}
      {activeTab === "jobs" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">Service History</h2>
            <Link href={`/schedule?customerId=${customer.id}`}>
              <Button size="sm">
                <Calendar className="w-4 h-4 mr-1.5" /> Schedule New Job
              </Button>
            </Link>
          </div>

          {customer.jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center border rounded-xl border-dashed">
              No jobs recorded yet for this customer.
            </p>
          ) : (
            <div className="space-y-3">
              {customer.jobs.map((job: any) => (
                <Card key={job.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">{job.title}</h4>
                      <Badge
                        variant={
                          job.status === "COMPLETED"
                            ? "success"
                            : job.status === "IN_PROGRESS" || job.status === "EN_ROUTE"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(job.scheduledDate)} {job.scheduledStartTime && `at ${job.scheduledStartTime}`} &bull; {job.property?.address}
                    </p>
                    {job.technician?.name && (
                      <p className="text-xs text-muted-foreground">Tech: {job.technician.name}</p>
                    )}
                  </div>

                  <Link href={`/mobile/today`}>
                    <Button variant="outline" size="sm">
                      Job Details
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Quotes */}
      {activeTab === "quotes" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">Estimates & Quotes</h2>
            <Link href={`/quotes?newQuote=true&customerId=${customer.id}`}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> Create Quote
              </Button>
            </Link>
          </div>

          {customer.quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center border rounded-xl border-dashed">
              No quotes created yet.
            </p>
          ) : (
            <div className="space-y-3">
              {customer.quotes.map((quote: any) => (
                <Card key={quote.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {quote.quoteNumber}
                      </span>
                      <h4 className="font-bold text-sm text-foreground">{quote.title}</h4>
                      <Badge
                        variant={
                          quote.status === "ACCEPTED"
                            ? "success"
                            : quote.status === "SENT"
                            ? "info"
                            : "outline"
                        }
                      >
                        {quote.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Created {formatDate(quote.createdAt)} &bull; Total: <strong>{formatMoney(quote.totalCents, currency)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/quote/${quote.publicToken}`} target="_blank">
                      <Button variant="outline" size="sm">
                        Public Link
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Invoices */}
      {activeTab === "invoices" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground">Invoices & Billing</h2>
            <Link href={`/invoices?newInvoice=true&customerId=${customer.id}`}>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" /> Create Invoice
              </Button>
            </Link>
          </div>

          {customer.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center border rounded-xl border-dashed">
              No invoices created yet.
            </p>
          ) : (
            <div className="space-y-3">
              {customer.invoices.map((inv: any) => (
                <Card key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">
                        {inv.invoiceNumber}
                      </span>
                      <Badge
                        variant={
                          inv.status === "PAID"
                            ? "success"
                            : inv.status === "OVERDUE"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due {formatDate(inv.dueDate)} &bull; Total: <strong>{formatMoney(inv.totalCents, currency)}</strong> (Paid: {formatMoney(inv.paidCents, currency)})
                    </p>
                  </div>

                  <Link href={`/invoice/${inv.publicToken}`} target="_blank">
                    <Button variant="outline" size="sm">
                      View Invoice
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Customer"
      >
        <form onSubmit={handleUpdateCustomer} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Company Name</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Property Modal */}
      <Modal
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        title="Add Service Address"
      >
        <form onSubmit={handleAddProperty} className="space-y-3">
          <div>
            <Label>Street Address *</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="456 Pine Creek Road"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Unit / Apt</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ste 200"
              />
            </div>
            <div>
              <Label>City *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>State *</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Postal Code *</Label>
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
              placeholder="78704"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Gate Access Code</Label>
              <Input
                value={gateCode}
                onChange={(e) => setGateCode(e.target.value)}
                placeholder="#1234"
              />
            </div>
            <div>
              <Label>Pets / Kids Warning</Label>
              <Input
                value={petsKidsWarnings}
                onChange={(e) => setPetsKidsWarnings(e.target.value)}
                placeholder="2 dogs in backyard"
              />
            </div>
          </div>

          <div>
            <Label>Location Notes</Label>
            <Input
              value={propertyNotes}
              onChange={(e) => setPropertyNotes(e.target.value)}
              placeholder="Entry via side gate"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddPropertyModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Property"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

