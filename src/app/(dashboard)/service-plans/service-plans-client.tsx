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
import { createServicePlanAction } from "@/actions/jobs";
import {
  Repeat,
  Plus,
  Calendar,
  CheckCircle2,
  Receipt,
  MapPin,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface ServicePlansClientProps {
  initialPlans: any[];
  customers: any[];
  currency: string;
}

export function ServicePlansClient({
  initialPlans,
  customers,
  currency,
}: ServicePlansClientProps) {
  const router = useRouter();
  const [plans, setPlans] = React.useState(initialPlans);
  const [isNewPlanOpen, setIsNewPlanOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = React.useState(customers[0]?.id || "");
  const [selectedPropertyId, setSelectedPropertyId] = React.useState("");
  const [name, setName] = React.useState("Quarterly Pest Defense Program");
  const [description, setDescription] = React.useState("Interior/Exterior full perimeter barrier & inspection");
  const [frequency, setFrequency] = React.useState<"MONTHLY" | "QUARTERLY" | "BIANNUAL" | "ANNUAL">("QUARTERLY");
  const [price, setPrice] = React.useState("115.00");
  const [nextServiceDate, setNextServiceDate] = React.useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [autoInvoice, setAutoInvoice] = React.useState(true);

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
  React.useEffect(() => {
    if (activeCustomer?.properties?.[0]) {
      setSelectedPropertyId(activeCustomer.properties[0].id);
    } else {
      setSelectedPropertyId("");
    }
  }, [activeCustomer]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) {
      toast.error("Please select a property address");
      return;
    }
    setLoading(true);

    try {
      const res = await createServicePlanAction({
        propertyId: selectedPropertyId,
        name,
        description,
        frequency,
        priceCents: Math.round(Number(price) * 100),
        nextServiceDate,
        autoInvoice,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to create service plan");
        return;
      }

      toast.success("Recurring service plan activated and initial visit scheduled!");
      setIsNewPlanOpen(false);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-sm font-semibold text-muted-foreground">
          {plans.length} active recurring plans
        </span>
        <Button onClick={() => setIsNewPlanOpen(true)} className="w-full sm:w-auto font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Service Plan
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Repeat className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-bold text-base text-foreground mb-1">No Recurring Plans Yet</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Convert one-time pest inspections into recurring monthly or quarterly revenue.
          </p>
          <Button onClick={() => setIsNewPlanOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Set Up Recurring Plan
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-5 hover:border-primary/50 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-foreground">{plan.name}</h3>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {plan.frequency}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.property.customer.firstName} {plan.property.customer.lastName} &bull;{" "}
                      {plan.property.address}
                    </p>
                  </div>
                  <span className="font-black text-lg text-primary">
                    {formatMoney(plan.priceCents, currency)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-secondary/50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Next Service Visit:</span>
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {formatDate(plan.nextServiceDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Auto-Invoice on Finish:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {plan.autoInvoice ? "Enabled (Net 14)" : "Disabled"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Link href={`/customers/${plan.property.customerId}`}>
                    <Button variant="outline" size="sm">
                      View Customer Account
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal
        isOpen={isNewPlanOpen}
        onClose={() => setIsNewPlanOpen(false)}
        title="Create Recurring Service Plan"
        description="Auto-generates future visits and invoices upon completion"
        className="max-w-xl"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Service Address *</Label>
              <select
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

          <div className="space-y-1.5">
            <Label>Plan Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Quarterly Home Defense"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full h-11 rounded-lg border border-input bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="BIANNUAL">Bi-annual</option>
                <option value="ANNUAL">Annual</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Price per Visit ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>First Visit Date</Label>
              <Input
                type="date"
                value={nextServiceDate}
                onChange={(e) => setNextServiceDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-secondary/50 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground">Auto-Invoice On Job Completion</p>
              <p className="text-muted-foreground">
                Generates invoice & payment link immediately when technician finishes service.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoInvoice}
              onChange={(e) => setAutoInvoice(e.target.checked)}
              className="w-5 h-5 rounded text-primary focus:ring-primary"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewPlanOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Activate Plan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

