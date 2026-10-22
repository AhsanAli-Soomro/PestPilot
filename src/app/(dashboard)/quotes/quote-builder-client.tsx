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
import { PEST_SERVICE_TEMPLATES, type ServiceTemplate } from "@/lib/templates";
import { createQuoteAction, sendQuoteEmailAction } from "@/actions/quotes";
import {
  FileSpreadsheet,
  Plus,
  Send,
  ExternalLink,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface QuoteBuilderClientProps {
  quotes: any[];
  customers: any[];
  currency: string;
  taxRatePercent: number;
  initialCustomerId?: string;
  autoOpenCreate?: boolean;
}

interface LineItemDraft {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export function QuoteBuilderClient({
  quotes,
  customers,
  currency,
  taxRatePercent,
  initialCustomerId,
  autoOpenCreate = false,
}: QuoteBuilderClientProps) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(autoOpenCreate);
  const [loading, setLoading] = React.useState(false);
  const [sendingId, setSendingId] = React.useState<string | null>(null);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = React.useState(
    initialCustomerId || (customers[0]?.id || "")
  );
  const [selectedPropertyId, setSelectedPropertyId] = React.useState("");
  const [title, setTitle] = React.useState("Initial Pest Defense & Inspection");
  const [validUntil, setValidUntil] = React.useState("");
  const [notes, setNotes] = React.useState("Includes 60-day pest-free re-treatment warranty.");
  const [lineItems, setLineItems] = React.useState<LineItemDraft[]>([
    {
      description: "Initial Pest Cleanout & Perimeter Barrier",
      quantity: 1,
      unitPriceCents: 18500,
    },
  ]);

  // Update properties when customer changes
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  React.useEffect(() => {
    if (activeCustomer?.properties?.[0]) {
      setSelectedPropertyId(activeCustomer.properties[0].id);
    } else {
      setSelectedPropertyId("");
    }
  }, [activeCustomer]);

  // Apply service template
  const applyTemplate = (template: ServiceTemplate) => {
    setLineItems((prev) => [
      ...prev,
      {
        description: `${template.name} - ${template.description}`,
        quantity: 1,
        unitPriceCents: template.defaultPriceCents,
      },
    ]);
    toast.success(`Added ${template.name}`);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItemDraft, value: any) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, [field]: value };
      })
    );
  };

  // Totals
  const subtotalCents = lineItems.reduce(
    (acc, item) => acc + item.quantity * item.unitPriceCents,
    0
  );
  const taxCents = Math.round(subtotalCents * (taxRatePercent / 100));
  const totalCents = subtotalCents + taxCents;

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }
    setLoading(true);

    try {
      const res = await createQuoteAction({
        customerId: selectedCustomerId,
        propertyId: selectedPropertyId || null,
        title,
        validUntil: validUntil || null,
        notes,
        lineItems,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to create quote");
        return;
      }

      toast.success("Quote generated successfully!");
      setIsCreateOpen(false);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async (quoteId: string) => {
    setSendingId(quoteId);
    try {
      const res = await sendQuoteEmailAction(quoteId);
      if (res.success) {
        toast.success("Quote emailed to customer!");
        router.refresh();
      } else {
        toast.error("Failed to send email");
      }
    } catch {
      toast.error("An error occurred sending quote");
    } finally {
      setSendingId(null);
    }
  };

  const copyPublicLink = (publicToken: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/quote/${publicToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Public quote link copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground font-semibold">
          {quotes.length} {quotes.length === 1 ? "Quote" : "Quotes"} total
        </span>
        <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Quote
        </Button>
      </div>

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold text-base text-foreground mb-1">No Quotes Yet</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Build customized pest control quotes with one-click service templates.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Create First Quote
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <Card key={quote.id} className="p-5 hover:border-primary/50 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {quote.quoteNumber}
                    </span>
                    <h3 className="font-bold text-base text-foreground">{quote.title}</h3>
                    <Badge
                      variant={
                        quote.status === "ACCEPTED"
                          ? "success"
                          : quote.status === "SENT"
                          ? "info"
                          : quote.status === "DECLINED"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {quote.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Customer:{" "}
                    <Link
                      href={`/customers/${quote.customer.id}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {quote.customer.firstName} {quote.customer.lastName}
                    </Link>
                    {quote.property && ` &bull; ${quote.property.address}`}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Created {formatDate(quote.createdAt)}{" "}
                    {quote.validUntil && ` &bull; Valid until ${formatDate(quote.validUntil)}`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:text-right">
                  <div>
                    <span className="text-xs text-muted-foreground block font-semibold">Total Estimate</span>
                    <span className="text-xl font-black text-foreground">
                      {formatMoney(quote.totalCents, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyPublicLink(quote.publicToken)}
                      title="Copy online review link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>

                    <Link href={`/quote/${quote.publicToken}`} target="_blank">
                      <Button variant="outline" size="sm" title="Preview public customer page">
                        <ExternalLink className="w-4 h-4 mr-1.5" />
                        Preview
                      </Button>
                    </Link>

                    <Button
                      size="sm"
                      onClick={() => handleSendEmail(quote.id)}
                      disabled={sendingId === quote.id}
                      className="font-bold"
                    >
                      {sendingId === quote.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1.5" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Quote Modal with Service Templates */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Pest Service Quote"
        description="Select customer, add line items from templates, and set validity"
        className="max-w-2xl"
      >
        <form onSubmit={handleCreateQuote} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customerSelect">Customer *</Label>
              <select
                id="customerSelect"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
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
              <Label htmlFor="propertySelect">Service Address</Label>
              <select
                id="propertySelect"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {activeCustomer?.properties?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.address}, {p.city}
                  </option>
                )) || <option value="">No properties registered</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quoteTitle">Quote Title *</Label>
              <Input
                id="quoteTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Initial Cleanout & Quarterly Maintenance"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Service Templates Picker */}
          <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Insert Service Template
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PEST_SERVICE_TEMPLATES.map((tpl) => (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-card border border-border hover:border-primary text-foreground transition-all hover:bg-primary/10"
                >
                  + {tpl.name} ({formatMoney(tpl.defaultPriceCents, currency)})
                </button>
              ))}
            </div>
          </div>

          {/* Line items list */}
          <div className="space-y-2">
            <Label>Line Items</Label>
            {lineItems.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-border bg-card space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <Input
                    placeholder="Description of service or chemical treatment"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, "description", e.target.value)}
                    required
                    className="flex-1 h-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeLineItem(index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
                      onChange={(e) =>
                        updateLineItem(index, "quantity", Math.max(1, Number(e.target.value)))
                      }
                      className="h-8 text-xs text-center"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-[11px] text-muted-foreground font-semibold">Price ($):</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(item.unitPriceCents / 100).toFixed(2)}
                      onChange={(e) =>
                        updateLineItem(
                           index,
                          "unitPriceCents",
                          Math.round(Number(e.target.value) * 100)
                        )
                      }
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
                  { description: "General Pest Inspection & Treatment", quantity: 1, unitPriceCents: 9500 },
                ])
              }
              className="text-xs"
            >
              + Add Custom Line Item
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="quoteNotes">Customer Notes & Terms</Label>
            <Input
              id="quoteNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Terms, guarantee details, warranty period"
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
              <span>Total Estimate</span>
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
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                "Save & Generate Quote"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

