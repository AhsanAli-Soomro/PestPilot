"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { formatMoney, formatDate } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/pdf";
import { createInvoiceAction, recordPaymentAction, sendInvoiceEmailAction } from "@/actions/invoices";
import { PEST_SERVICE_TEMPLATES } from "@/lib/templates";
import {
  Receipt,
  Plus,
  Send,
  Download,
  DollarSign,
  Copy,
  ExternalLink,
  Trash2,
  Calendar,
  Loader2,
  CheckCircle2,
  Sparkles,
  QrCode,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface InvoiceListClientProps {
  initialInvoices: any[];
  customers: any[];
  organization: any;
  initialCustomerId?: string;
  autoOpenCreate?: boolean;
}

interface LineItemDraft {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export function InvoiceListClient({
  initialInvoices,
  customers,
  organization,
  initialCustomerId,
  autoOpenCreate = false,
}: InvoiceListClientProps) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"ALL" | "UNPAID" | "PAID">("ALL");
  const [isCreateOpen, setIsCreateOpen] = React.useState(autoOpenCreate);
  const [loading, setLoading] = React.useState(false);
  const [sendingId, setSendingId] = React.useState<string | null>(null);

  // Payment Recording Modal
  const [paymentInvoice, setPaymentInvoice] = React.useState<any | null>(null);
  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState<"CASH" | "CARD" | "CHECK" | "BANK">("CARD");
  const [payRef, setPayRef] = React.useState("");

  // Create Invoice Form State
  const [customerId, setCustomerId] = React.useState(initialCustomerId || customers[0]?.id || "");
  const [dueDate, setDueDate] = React.useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = React.useState("Thank you for your business. Payment due within 14 days.");
  const [lineItems, setLineItems] = React.useState<LineItemDraft[]>([
    {
      description: "Pest Control Maintenance Service",
      quantity: 1,
      unitPriceCents: 11500,
    },
  ]);

  const currency = organization?.currency || "USD";
  const taxRatePercent = organization?.taxRatePercent || 0;

  // Filtered invoices
  const filteredInvoices = React.useMemo(() => {
    return initialInvoices.filter((inv) => {
      const isPaid = inv.status === "PAID";
      if (filter === "PAID") return isPaid;
      if (filter === "UNPAID") return !isPaid;
      return true;
    });
  }, [initialInvoices, filter]);

  // Compute totals
  const subtotalCents = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPriceCents, 0);
  const taxCents = Math.round(subtotalCents * (taxRatePercent / 100));
  const totalCents = subtotalCents + taxCents;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }
    setLoading(true);

    try {
      const res = await createInvoiceAction({
        customerId,
        dueDate,
        notes,
        lineItems,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to create invoice");
        return;
      }

      toast.success("Invoice created successfully!");
      setIsCreateOpen(false);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    setLoading(true);

    try {
      const amountCents = Math.round(Number(payAmount) * 100);
      const res = await recordPaymentAction({
        invoiceId: paymentInvoice.id,
        amountCents,
        method: payMethod,
        reference: payRef || null,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to record payment");
        return;
      }

      toast.success("Payment recorded successfully!");
      setPaymentInvoice(null);
      setPayAmount("");
      setPayRef("");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (invoiceId: string) => {
    setSendingId(invoiceId);
    try {
      const res = await sendInvoiceEmailAction(invoiceId);
      if (res.success) {
        toast.success("Invoice and payment link emailed to customer!");
        router.refresh();
      } else {
        toast.error("Failed to email invoice");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSendingId(null);
    }
  };

  const handleDownloadPdf = (invoice: any) => {
    const doc = generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueDate,
      createdAt: invoice.createdAt,
      status: invoice.status,
      companyName: organization?.name || "PestPilot",
      companyAddress: organization?.address,
      companyEmail: organization?.email,
      companyPhone: organization?.phone,
      customerName: `${invoice.customer.firstName} ${invoice.customer.lastName}`,
      customerEmail: invoice.customer.email,
      customerAddress: invoice.job?.property?.address,
      lineItems: invoice.lineItems,
      subtotalCents: invoice.subtotalCents,
      taxCents: invoice.taxCents,
      totalCents: invoice.totalCents,
      paidCents: invoice.paidCents,
      currency,
      notes: invoice.notes,
    });
    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast.success("Invoice PDF downloaded!");
  };

  const copyPublicPayLink = (publicToken: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/invoice/${publicToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Online payment link copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      {/* Action and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border p-1 bg-card overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors shrink-0 whitespace-nowrap ${
              filter === "ALL"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Invoices ({initialInvoices.length})
          </button>
          <button
            onClick={() => setFilter("UNPAID")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors shrink-0 whitespace-nowrap ${
              filter === "UNPAID"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Unpaid / Overdue
          </button>
          <button
            onClick={() => setFilter("PAID")}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors shrink-0 whitespace-nowrap ${
              filter === "PAID"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Paid
          </button>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Invoice
        </Button>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-bold text-base text-foreground mb-1">No Invoices Found</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Invoices are automatically created on completed recurring visits, or created manually.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Create Invoice
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const isPaid = inv.status === "PAID";
            const balanceDue = Math.max(0, inv.totalCents - inv.paidCents);

            return (
              <Card key={inv.id} className="p-5 hover:border-primary/50 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {inv.invoiceNumber}
                      </span>
                      <h3 className="font-bold text-base text-foreground">
                        {inv.customer.firstName} {inv.customer.lastName}
                      </h3>
                      <Badge
                        variant={
                          isPaid
                            ? "success"
                            : inv.status === "OVERDUE"
                            ? "destructive"
                            : inv.status === "PARTIALLY_PAID"
                            ? "warning"
                            : "outline"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Issue Date: {formatDate(inv.createdAt)} &bull; Due:{" "}
                      <strong>{formatDate(inv.dueDate)}</strong>
                    </p>

                    {inv.payments?.length > 0 && (
                      <p className="text-xs text-emerald-600 font-semibold">
                        {inv.payments.length} payment(s) recorded &bull; Total Paid:{" "}
                        {formatMoney(inv.paidCents, currency)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:text-right">
                    <div>
                      <span className="text-xs text-muted-foreground block font-semibold">Balance Due</span>
                      <span
                        className={`text-xl font-black ${
                          balanceDue > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                        }`}
                      >
                        {formatMoney(balanceDue, currency)}
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        Total: {formatMoney(inv.totalCents, currency)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!isPaid && (
                        <Button
                          variant="accent"
                          size="sm"
                          className="font-bold"
                          onClick={() => {
                            setPaymentInvoice(inv);
                            setPayAmount((balanceDue / 100).toFixed(2));
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-1" /> Record Pay
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPublicPayLink(inv.publicToken)}
                        title="Copy customer online pay link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(inv)}
                        title="Download PDF Invoice"
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      <Link href={`/invoice/${inv.publicToken}`} target="_blank">
                        <Button variant="outline" size="sm" title="View Customer Online Page">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Link href={`/verify/${inv.jobId || inv.id || inv.invoiceNumber}`} target="_blank">
                        <Button variant="outline" size="sm" title="Verify EPA QR Certificate">
                          <QrCode className="w-4 h-4 text-emerald-600" />
                        </Button>
                      </Link>

                      {inv.customer?.phone && (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${inv.customer.phone.replace(/[^0-9]/g, "")}&text=${encodeURIComponent(
                            `Hello ${inv.customer.firstName}, here is your pest service invoice #${inv.invoiceNumber} for ${formatMoney(
                              inv.totalCents,
                              currency
                            )}. You can view and pay online here: https://pestpilots.vercel.app/invoice/${inv.publicToken}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" title="Send Invoice on WhatsApp" className="text-emerald-600">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </a>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendEmail(inv.id)}
                        disabled={sendingId === inv.id}
                      >
                        {sendingId === inv.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1.5" /> Email
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        title="Record Payment"
        description={`Record cash, check, card, or bank payment for ${paymentInvoice?.invoiceNumber}`}
      >
        {paymentInvoice && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-secondary/50 text-xs flex justify-between">
              <span>Outstanding Balance:</span>
              <strong className="text-foreground">
                {formatMoney(
                  Math.max(0, paymentInvoice.totalCents - paymentInvoice.paidCents),
                  currency
                )}
              </strong>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Amount ($) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Payment Method *</Label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash</option>
                <option value="CHECK">Check</option>
                <option value="BANK">Bank Transfer / ACH</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Reference (Check #, Auth code, etc.)</Label>
              <Input
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="Optional reference"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentInvoice(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Payment"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Invoice"
        description="Add service line items, set due date, and send to customer"
        className="max-w-2xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Due Date *</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Quick Insert from Service Templates */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Insert Service Line Item
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PEST_SERVICE_TEMPLATES.slice(0, 4).map((tpl) => (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() =>
                    setLineItems((prev) => [
                      ...prev,
                      {
                        description: tpl.name,
                        quantity: 1,
                        unitPriceCents: tpl.defaultPriceCents,
                      },
                    ])
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-card border border-border hover:border-primary text-foreground transition-all"
                >
                  + {tpl.name} ({formatMoney(tpl.defaultPriceCents, currency)})
                </button>
              ))}
            </div>
          </div>

          {/* Line items list */}
          <div className="space-y-2">
            <Label>Itemized Charges</Label>
            {lineItems.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-border bg-card space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    placeholder="Description of service or materials"
                    value={item.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLineItems((prev) =>
                        prev.map((it, i) => (i === index ? { ...it, description: val } : it))
                      );
                    }}
                    required
                    className="flex-1 h-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== index))}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 sm:w-28">
                    <span className="text-[11px] text-muted-foreground font-semibold">Qty:</span>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        setLineItems((prev) =>
                          prev.map((it, i) => (i === index ? { ...it, quantity: val } : it))
                        );
                      }}
                      className="h-8 text-xs text-center"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">Rate ($):</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(item.unitPriceCents / 100).toFixed(2)}
                      onChange={(e) => {
                        const val = Math.round(Number(e.target.value) * 100);
                        setLineItems((prev) =>
                          prev.map((it, i) => (i === index ? { ...it, unitPriceCents: val } : it))
                        );
                      }}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1 text-right font-bold text-foreground text-xs sm:min-w-[80px] pt-1 sm:pt-0">
                    {formatMoney(item.quantity * item.unitPriceCents, currency)}
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLineItems((prev) => [
                  ...prev,
                  { description: "General Pest Treatment", quantity: 1, unitPriceCents: 9500 },
                ])
              }
              className="text-xs"
            >
              + Add Custom Line Item
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label>Notes & Payment Instructions</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, bank details, or check mailing address"
            />
          </div>

          {/* Totals Summary */}
          <div className="p-3 rounded-xl bg-secondary/50 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatMoney(subtotalCents, currency)}</span>
            </div>
            {taxRatePercent > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({taxRatePercent}%)</span>
                <span className="font-semibold">{formatMoney(taxCents, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black pt-1 border-t border-border">
              <span>Total Invoice Amount</span>
              <span className="text-primary">{formatMoney(totalCents, currency)}</span>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save & Issue Invoice"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

