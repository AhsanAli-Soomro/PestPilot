"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/pdf";
import { createInvoiceStripeCheckoutAction } from "@/actions/invoices";
import {
  ShieldCheck,
  CheckCircle2,
  Download,
  CreditCard,
  MapPin,
  Calendar,
  Loader2,
  DollarSign,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

interface PublicInvoiceClientProps {
  invoice: any;
  paymentSuccess?: boolean;
}

export function PublicInvoiceClient({ invoice, paymentSuccess }: PublicInvoiceClientProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const org = invoice.organization;
  const currency = org.currency || "USD";
  const balanceCents = Math.max(0, invoice.totalCents - invoice.paidCents);
  const isPaid = invoice.status === "PAID" || balanceCents === 0;
  const isFreePlan = org.planTier === "FREE";

  const handlePayOnline = async () => {
    setLoading(true);
    try {
      const res = await createInvoiceStripeCheckoutAction(invoice.id);
      if (!res.success) {
        toast.error(res.error || "Payment failed");
        return;
      }

      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else if (res.simulated) {
        toast.success("Payment successful! Thank you.");
        router.refresh();
      }
    } catch {
      toast.error("An error occurred starting payment");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const doc = generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      dueDate: invoice.dueDate,
      createdAt: invoice.createdAt,
      status: invoice.status,
      companyName: org.name,
      companyAddress: org.address,
      companyEmail: org.email,
      companyPhone: org.phone,
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
  };

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col justify-between p-4 sm:p-6 md:p-10">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-foreground leading-tight">{org.name}</h2>
              <p className="text-xs text-muted-foreground">Pest Service Invoice</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="w-4 h-4 mr-1.5" /> PDF
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Success Alert if paid */}
        {(isPaid || paymentSuccess) && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-bold text-sm">Invoice Paid in Full</p>
              <p className="text-xs">
                Thank you for your business! Your account has a zero balance for this invoice.
              </p>
            </div>
          </div>
        )}

        {/* Free Plan Notice */}
        {isFreePlan && (
          <div className="text-[11px] text-muted-foreground bg-muted/60 px-3.5 py-2 rounded-xl border border-border flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Generated with PestPilot Free Plan
            </span>
            <span className="text-[10px] text-muted-foreground/80 hidden sm:inline">
              Custom white-label branding on Starter &amp; Professional
            </span>
          </div>
        )}

        {/* Invoice Document Card */}
        <Card className="border-border shadow-xl overflow-hidden bg-card">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6">
              <div>
                <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                  Invoice {invoice.invoiceNumber}
                </span>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-foreground">
                    {formatMoney(invoice.totalCents, currency)}
                  </h1>
                  <Badge variant={isPaid ? "success" : "warning"}>
                    {isPaid ? "PAID" : "DUE"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Due on {formatDate(invoice.dueDate)} &bull; Issued {formatDate(invoice.createdAt)}
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Billed To:</p>
                <p className="font-bold text-sm text-foreground">
                  {invoice.customer.firstName} {invoice.customer.lastName}
                </p>
                {invoice.job?.property && (
                  <p className="text-xs text-muted-foreground flex items-center sm:justify-end gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {invoice.job.property.address}
                  </p>
                )}
              </div>
            </div>

            {/* Line items table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Services & Applications
              </h3>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">Service Description</th>
                      <th className="p-3 text-center w-16">Qty</th>
                      <th className="p-3 text-right w-24">Rate</th>
                      <th className="p-3 text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoice.lineItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="p-3 font-medium text-foreground">{item.description}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{formatMoney(item.unitPriceCents, currency)}</td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {formatMoney(item.totalCents, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(invoice.subtotalCents, currency)}
                  </span>
                </div>
                {invoice.taxCents > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span className="font-semibold text-foreground">
                      {formatMoney(invoice.taxCents, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-border text-foreground">
                  <span>Total</span>
                  <span>{formatMoney(invoice.totalCents, currency)}</span>
                </div>

                {invoice.paidCents > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Paid to Date</span>
                    <span>-{formatMoney(invoice.paidCents, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black pt-2 border-t-2 border-primary text-foreground">
                  <span>Balance Due</span>
                  <span className="text-primary">{formatMoney(balanceCents, currency)}</span>
                </div>
              </div>
            </div>

            {/* Past Payments List */}
            {invoice.payments?.length > 0 && (
              <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2 text-xs">
                <p className="font-bold text-foreground">Payment History:</p>
                <div className="divide-y divide-border">
                  {invoice.payments.map((pm: any) => (
                    <div key={pm.id} className="py-1.5 flex justify-between items-center text-muted-foreground">
                      <span>
                        {formatDate(pm.paidAt)} &bull; {pm.method} {pm.reference && `(${pm.reference})`}
                      </span>
                      <strong className="text-foreground">{formatMoney(pm.amountCents, currency)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invoice.notes && (
              <div className="text-xs text-muted-foreground">
                <strong>Notes:</strong> {invoice.notes}
              </div>
            )}

            {/* Official Scannable QR Code Service Verification Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Visual Scannable QR Code */}
                <div className="p-2 rounded-xl bg-white border border-border shadow-sm shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      `https://pestpilots.vercel.app/verify/${invoice.jobId || invoice.id || invoice.invoiceNumber}`
                    )}`}
                    alt="Scan to Verify EPA Compliance & Treatment Record"
                    className="w-20 h-20"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>CERTIFIED PEST SERVICE RECORD</span>
                  </div>
                  <p className="font-bold text-sm text-foreground">Official EPA Treatment &amp; Applicator Verification</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Scan this QR code with any smartphone camera to verify chemical lot numbers, applicator license, and digital signatures.
                  </p>
                </div>
              </div>

              <Link
                href={`/verify/${invoice.jobId || invoice.id || invoice.invoiceNumber}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all shrink-0 w-full sm:w-auto shadow-sm"
              >
                <QrCode className="w-4 h-4 text-primary" />
                Verify Certificate
              </Link>
            </div>

            {/* Pay Online Action Bar */}
            {!isPaid && (
              <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">
                    Secure credit or debit card checkout
                  </span>
                  <span className="text-lg font-black text-foreground">
                    Pay {formatMoney(balanceCents, currency)}
                  </span>
                </div>

                <Button
                  size="lg"
                  className="w-full sm:w-auto font-bold h-12 px-8 text-base shadow-lg"
                  onClick={handlePayOnline}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5 mr-2" />
                  )}
                  Pay Now with Card
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Free Plan Viral Loop Footer */}
        {isFreePlan && (
          <div className="text-center pt-8 pb-4">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Powered by <strong className="text-foreground">PestPilot</strong> &bull; Field Service Management</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

