"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { formatMoney, formatDate } from "@/lib/utils";
import { acceptPublicQuoteAction, declinePublicQuoteAction } from "@/actions/quotes";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  Building,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

interface PublicQuoteClientProps {
  quote: any;
}

export function PublicQuoteClient({ quote }: PublicQuoteClientProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = React.useState(false);
  const [declineReason, setDeclineReason] = React.useState("");

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await acceptPublicQuoteAction(quote.publicToken);
      if (res.success) {
        toast.success("Thank you! You have accepted this quote.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to accept quote");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await declinePublicQuoteAction(quote.publicToken, declineReason);
      if (res.success) {
        toast.info("Quote declined. Thank you for your feedback.");
        setIsDeclineModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to decline quote");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const isAccepted = quote.status === "ACCEPTED";
  const isDeclined = quote.status === "DECLINED";
  const org = quote.organization;
  const isFreePlan = org.planTier === "FREE";

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
              <p className="text-xs text-muted-foreground">Official Pest Service Quote</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Status Alert if already acted upon */}
        {isAccepted && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-bold text-sm">Quote Accepted</p>
              <p className="text-xs">
                You accepted this estimate on {formatDate(quote.acceptedAt)}. Our team will be in touch to confirm your service appointment.
              </p>
            </div>
          </div>
        )}

        {isDeclined && (
          <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center gap-3">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">Quote Declined</p>
              <p className="text-xs">
                You declined this quote on {formatDate(quote.declinedAt)}.
              </p>
            </div>
          </div>
        )}

        {/* Quote Document Card */}
        <Card className="border-border shadow-xl overflow-hidden bg-card">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6">
              <div>
                <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                  Quote {quote.quoteNumber}
                </span>
                <h1 className="text-2xl font-black text-foreground">{quote.title}</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Issued on {formatDate(quote.createdAt)}{" "}
                  {quote.validUntil && `&bull; Valid through ${formatDate(quote.validUntil)}`}
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Prepared for:</p>
                <p className="font-bold text-sm text-foreground">
                  {quote.customer.firstName} {quote.customer.lastName}
                </p>
                {quote.property && (
                  <p className="text-xs text-muted-foreground flex items-center sm:justify-end gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {quote.property.address}, {quote.property.city}
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
                    {quote.lineItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="p-3 font-medium text-foreground">{item.description}</td>
                        <td className="p-3 text-center">{item.quantity}</td>
                        <td className="p-3 text-right">{formatMoney(item.unitPriceCents, org.currency)}</td>
                        <td className="p-3 text-right font-bold text-foreground">
                          {formatMoney(item.totalCents, org.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subtotal & Total */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(quote.subtotalCents, org.currency)}
                  </span>
                </div>
                {quote.taxCents > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span className="font-semibold text-foreground">
                      {formatMoney(quote.taxCents, org.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black pt-2 border-t border-border text-foreground">
                  <span>Estimated Total</span>
                  <span className="text-primary">{formatMoney(quote.totalCents, org.currency)}</span>
                </div>
              </div>
            </div>

            {/* Terms and notes */}
            {quote.notes && (
              <div className="p-4 rounded-xl bg-secondary/40 border border-border text-xs space-y-1">
                <p className="font-bold text-foreground">Service Notes & Guarantee:</p>
                <p className="text-muted-foreground">{quote.notes}</p>
              </div>
            )}

            {/* Action Bar */}
            {!isAccepted && !isDeclined && (
              <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  By clicking Accept, you approve the estimate and authorize service.
                </p>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 sm:flex-initial"
                    onClick={() => setIsDeclineModalOpen(true)}
                    disabled={loading}
                  >
                    Decline
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 sm:flex-initial font-bold"
                    onClick={handleAccept}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Accept Quote
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Decline Modal */}
        <Modal
          isOpen={isDeclineModalOpen}
          onClose={() => setIsDeclineModalOpen(false)}
          title="Decline Quote"
          description="Let us know if you have any questions or would like adjustments"
        >
          <form onSubmit={handleDecline} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Reason for declining (Optional)</label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., Price is higher than expected, found another provider, or schedule doesn't match..."
                rows={3}
                className="w-full rounded-lg border border-input bg-card p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeclineModalOpen(false)}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Decline"}
              </Button>
            </div>
          </form>
        </Modal>

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

