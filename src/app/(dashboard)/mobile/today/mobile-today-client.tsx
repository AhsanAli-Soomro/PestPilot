"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { SignaturePad } from "@/components/signature-pad";
import { formatMoney } from "@/lib/utils";
import { localDb } from "@/lib/offline/db";
import { syncEngine } from "@/lib/offline/sync-engine";
import { updateJobStatusAction, submitTreatmentLogAction } from "@/actions/jobs";
import {
  Navigation,
  Phone,
  CheckCircle2,
  Play,
  Truck,
  KeyRound,
  ShieldAlert,
  Camera,
  ClipboardList,
  DollarSign,
  Loader2,
  Sparkles,
  Wind,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface MobileTodayClientProps {
  initialJobs: any[];
  userName: string;
  currency: string;
  organizationId: string;
  userId: string;
}

const COMMON_PESTS = [
  "General Pests (Ants & Spiders)",
  "Cockroaches (German / American)",
  "Subterranean Termites",
  "Rodents (Mice / Rats)",
  "Bedbugs",
  "Fleas & Ticks",
  "Wasps & Hornets",
  "Mosquitoes",
];

const COMMON_CHEMICALS: Record<string, { product: string; epa: string; defaultQty: string }> = {
  "Demand CS": { product: "Demand CS (Lambda-cyhalothrin)", epa: "100-1066", defaultQty: "1.5 gal 0.03%" },
  "Taurus SC": { product: "Taurus SC (Fipronil)", epa: "53883-279", defaultQty: "4 gal 0.06%" },
  "Advion Roach": { product: "Advion Cockroach Gel Bait (Indoxacarb)", epa: "100-1484", defaultQty: "5 bait placements" },
  "Alpine WSG": { product: "Alpine WSG (Dinotefuran)", epa: "499-561", defaultQty: "1 gal 20g" },
  "Contrac Blox": { product: "Contrac All-Weather Blox (Bromadiolone)", epa: "12455-79", defaultQty: "4 tamper-proof stations" },
  "Talstar P": { product: "Talstar P Professional (Bifenthrin)", epa: "279-3206", defaultQty: "2 gal 0.05%" },
};

export function MobileTodayClient({
  initialJobs,
  userName,
  currency,
  organizationId,
  userId,
}: MobileTodayClientProps) {
  const router = useRouter();
  const [jobs, setJobs] = React.useState(initialJobs);
  const [activeJobForLog, setActiveJobForLog] = React.useState<any | null>(null);
  const [loadingActionId, setLoadingActionId] = React.useState<string | null>(null);

  // Treatment log form state
  const [pestType, setPestType] = React.useState(COMMON_PESTS[0]);
  const [chemicalKey, setChemicalKey] = React.useState("Demand CS");
  const [chemicalProduct, setChemicalProduct] = React.useState(COMMON_CHEMICALS["Demand CS"].product);
  const [epaRegistrationNumber, setEpaRegistrationNumber] = React.useState(COMMON_CHEMICALS["Demand CS"].epa);
  const [quantity, setQuantity] = React.useState(COMMON_CHEMICALS["Demand CS"].defaultQty);
  const [areasTreated, setAreasTreated] = React.useState("Exterior perimeter foundation, eaves, garage baseboards");
  const [windSpeed, setWindSpeed] = React.useState("4 mph");
  const [temperature, setTemperature] = React.useState("74°F");
  const [logNotes, setLogNotes] = React.useState("");
  const [signature, setSignature] = React.useState<string | null>(null);
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = React.useState("115.00");
  const [paymentMethod, setPaymentMethod] = React.useState<"CASH" | "CARD" | "CHECK">("CARD");
  const [recordPayment, setRecordPayment] = React.useState(false);

  // Sync initial jobs to local IndexedDB for offline resilience
  React.useEffect(() => {
    async function cacheJobs() {
      try {
        const localItems = initialJobs.map((j) => ({
          id: j.id,
          organizationId: j.organizationId,
          customerId: j.customerId,
          propertyId: j.propertyId,
          technicianId: j.technicianId,
          title: j.title,
          description: j.description,
          status: j.status,
          scheduledDate: new Date(j.scheduledDate).toISOString(),
          scheduledStartTime: j.scheduledStartTime,
          scheduledEndTime: j.scheduledEndTime,
          routeOrder: j.routeOrder,
          completedAt: j.completedAt ? new Date(j.completedAt).toISOString() : null,
          notes: j.notes,
          customerName: j.customer ? `${j.customer.firstName || ""} ${j.customer.lastName || ""}`.trim() : "Unknown Customer",
          customerPhone: j.customer?.phone || "",
          propertyAddress: j.property?.address || "Address not provided",
          gateCode: j.property?.gateCode || "",
          petsKidsWarnings: j.property?.petsKidsWarnings || "",
          updatedAt: new Date(j.updatedAt).toISOString(),
          version: j.version,
          deletedAt: null,
        }));
        await localDb.jobs.bulkPut(localItems);
      } catch (err) {
        console.warn("[LocalDB] Cache sync note:", err);
      }
    }
    cacheJobs();
    setJobs(initialJobs);
  }, [initialJobs]);

  const handleChemicalChange = (name: string) => {
    setChemicalKey(name);
    const chosen = COMMON_CHEMICALS[name];
    if (chosen) {
      setChemicalProduct(chosen.product);
      setEpaRegistrationNumber(chosen.epa);
      setQuantity(chosen.defaultQty);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const base64 = readerEvent.target?.result as string;
        if (base64) {
          setPhotos((prev) => [...prev, base64]);
          toast.success("Photo attached");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Status transitions: SCHEDULED -> EN_ROUTE -> IN_PROGRESS
  const handleUpdateStatus = async (jobId: string, newStatus: any) => {
    setLoadingActionId(jobId);

    // Optimistically update state
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    try {
      if (typeof window !== "undefined" && !navigator.onLine) {
        // OFFLINE MODE: Save to local Dexie and enqueue outbox mutation
        await localDb.jobs.update(jobId, { status: newStatus, updatedAt: new Date().toISOString() });
        await syncEngine.queueMutation("job", "UPDATE", { id: jobId, status: newStatus });
        toast.info("Saved locally (Offline mode). Will sync automatically.");
      } else {
        // ONLINE MODE
        const res = await updateJobStatusAction(jobId, newStatus);
        if (!res.success) {
          toast.error(res.error || "Failed to update status");
        } else {
          toast.success(`Job marked as ${newStatus}`);
          router.refresh();
        }
      }
    } catch {
      // Fallback offline write
      await localDb.jobs.update(jobId, { status: newStatus, updatedAt: new Date().toISOString() });
      await syncEngine.queueMutation("job", "UPDATE", { id: jobId, status: newStatus });
      toast.info("Saved to offline cache.");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Submit complete treatment log
  const handleSubmitTreatmentLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJobForLog) return;
    setLoadingActionId("log_submit");

    const payload = {
      jobId: activeJobForLog.id,
      pestType,
      chemicalProduct,
      epaRegistrationNumber,
      quantity,
      areasTreated,
      windSpeed,
      temperature,
      applicatorName: userName,
      technicianSignature: signature,
      photos: photos.length > 0 ? JSON.stringify(photos) : null,
      notes: logNotes,
    };

    try {
      if (typeof window !== "undefined" && !navigator.onLine) {
        // OFFLINE MODE: Store in local Dexie DB and queue mutations
        const logId = crypto.randomUUID();
        await localDb.treatmentLogs.add({
          id: logId,
          organizationId,
          jobId: activeJobForLog.id,
          technicianId: userId,
          pestType,
          chemicalProduct,
          epaRegistrationNumber,
          quantity,
          areasTreated,
          applicatorName: userName,
          technicianSignature: signature,
          photos: payload.photos,
          notes: logNotes,
          windSpeed,
          temperature,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        });

        await localDb.jobs.update(activeJobForLog.id, {
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        await syncEngine.queueMutation("treatmentLog", "CREATE", { id: logId, ...payload });
        await syncEngine.queueMutation("job", "UPDATE", {
          id: activeJobForLog.id,
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        });

        // Record offline payment if toggled
        if (recordPayment && activeJobForLog.invoices?.[0]) {
          const paymentId = crypto.randomUUID();
          const amountCents = Math.round(Number(paymentAmount) * 100);
          await localDb.payments.add({
            id: paymentId,
            invoiceId: activeJobForLog.invoices[0].id,
            amountCents,
            method: paymentMethod,
            reference: `Field Payment (${paymentMethod})`,
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });
          await syncEngine.queueMutation("payment", "CREATE", {
            id: paymentId,
            invoiceId: activeJobForLog.invoices[0].id,
            amountCents,
            method: paymentMethod,
          });
        }

        toast.success("Job & Treatment Log completed (Offline Saved)!");
      } else {
        // ONLINE MODE
        const res = await submitTreatmentLogAction(payload);
        if (!res.success) {
          toast.error(res.error || "Failed to submit treatment log");
          return;
        }
        toast.success("Job completed and EPA log recorded!");
      }

      // Close modal and refresh
      setActiveJobForLog(null);
      setJobs((prev) =>
        prev.map((j) => (j.id === activeJobForLog.id ? { ...j, status: "COMPLETED" } : j))
      );
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoadingActionId(null);
    }
  };

  const completedCount = jobs.filter((j) => j.status === "COMPLETED").length;

  const multiStopMapsUrl = React.useMemo(() => {
    if (jobs.length === 0) return null;
    const activeStops = jobs
      .filter((j) => j.status !== "COMPLETED" && j.status !== "CANCELLED" && j.property?.address)
      .map((j) => encodeURIComponent(`${j.property.address}, ${j.property.city || ""}, ${j.property.state || ""}`));
    if (activeStops.length === 0) return null;
    return `https://www.google.com/maps/dir/${activeStops.join("/")}`;
  }, [jobs]);

  return (
    <div className="space-y-4">
      {/* Route Header Card */}
      <div className="bg-primary text-primary-foreground p-5 rounded-2xl shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-300" />
            <h1 className="text-xl font-black">Today&apos;s Field Route</h1>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/15 font-bold">
            {completedCount} / {jobs.length} Complete
          </span>
        </div>
        <p className="text-xs text-primary-foreground/80">
          Technician: <strong>{userName}</strong> &bull; Large outdoor buttons &bull; Offline active
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
          <div
            className="bg-amber-400 h-full transition-all duration-300"
            style={{
              width: `${jobs.length > 0 ? (completedCount / jobs.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Field Weather & Chemical Drift Advisory + Daily Route Navigator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-foreground">Wind: 6 mph (Optimal)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Safe for exterior spray (No chemical drift hazard)
              </p>
            </div>
          </div>
        </div>

        {multiStopMapsUrl && (
          <a
            href={multiStopMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-foreground transition-all flex items-center justify-between shadow-sm touch-target group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Navigate Full Route
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Open remaining stops in Google Maps
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          </a>
        )}
      </div>

      {/* Jobs Dispatch List */}
      {jobs.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-base text-foreground">No Jobs Scheduled for Today</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Check the main schedule or enjoy your day!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, index) => {
            const isCompleted = job.status === "COMPLETED";
            const isEnRoute = job.status === "EN_ROUTE";
            const isInProgress = job.status === "IN_PROGRESS";
            const property = job.property;
            const customer = job.customer;

            return (
              <Card
                key={job.id}
                className={`border-2 transition-all shadow-sm ${
                  isInProgress
                    ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5"
                    : isCompleted
                    ? "border-emerald-500/40 opacity-80"
                    : "border-border"
                }`}
              >
                <CardContent className="p-4 sm:p-5 space-y-3">
                  {/* Stop # and Title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center font-black text-xs shrink-0 text-foreground">
                        #{index + 1}
                      </div>
                      <div>
                        <h2 className="font-extrabold text-base text-foreground leading-tight">
                          {customer?.firstName || "Customer"} {customer?.lastName || ""}
                        </h2>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          {job.title}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        isCompleted
                          ? "success"
                          : isInProgress || isEnRoute
                          ? "warning"
                          : "secondary"
                      }
                      className="text-xs font-bold"
                    >
                      {job.status}
                    </Badge>
                  </div>

                  {/* Address & Safety Warnings */}
                  <div className="space-y-1.5 text-xs">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      {property?.address || "Address not provided"} {property?.unit && `Unit ${property.unit}`}
                    </p>

                    {property?.gateCode && (
                      <div className="p-2 rounded-lg bg-secondary font-bold text-foreground flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>GATE CODE: {property.gateCode}</span>
                      </div>
                    )}

                    {property?.petsKidsWarnings && (
                      <div className="p-2 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>SAFETY: {property.petsKidsWarnings}</span>
                      </div>
                    )}
                  </div>

                  {/* Primary One-Tap Actions for Drivers / Technicians */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${property?.address || ""}, ${property?.city || ""}, ${property?.state || ""} ${property?.postalCode || ""}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-12 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border touch-target transition-all"
                    >
                      <Navigation className="w-4 h-4 text-primary" />
                      Navigate
                    </a>

                    <a
                      href={customer?.phone ? `tel:${customer.phone}` : "#"}
                      className="flex items-center justify-center gap-2 h-12 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border touch-target transition-all"
                    >
                      <Phone className="w-4 h-4 text-primary" />
                      Call Customer
                    </a>
                  </div>

                  {/* Service Progression Buttons (Min 44px Touch Targets) */}
                  <div className="pt-2 border-t border-border">
                    {job.status === "SCHEDULED" && (
                      <Button
                        className="w-full h-12 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => handleUpdateStatus(job.id, "EN_ROUTE")}
                        disabled={loadingActionId === job.id}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Route &bull; En Route
                      </Button>
                    )}

                    {job.status === "EN_ROUTE" && (
                      <Button
                        className="w-full h-12 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleUpdateStatus(job.id, "IN_PROGRESS")}
                        disabled={loadingActionId === job.id}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Arrived &bull; Begin Treatment
                      </Button>
                    )}

                    {job.status === "IN_PROGRESS" && (
                      <Button
                        className="w-full h-12 text-sm font-bold bg-primary text-primary-foreground shadow-md"
                        onClick={() => {
                          setActiveJobForLog(job);
                        }}
                      >
                        <ClipboardList className="w-4 h-4 mr-2" />
                        Complete Job & Chemical Log
                      </Button>
                    )}

                    {isCompleted && (
                      <div className="flex items-center justify-between text-xs py-1 text-emerald-600 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Service Finished & Logged
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveJobForLog(job)}
                          className="text-primary hover:underline font-semibold"
                        >
                          View/Edit Log
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Complete Job & EPA Treatment Log Modal */}
      <Modal
        isOpen={!!activeJobForLog}
        onClose={() => setActiveJobForLog(null)}
        title="EPA Treatment Log & Completion"
        description="Record applied chemicals, weather, and technician signature for compliance"
        className="max-w-xl"
      >
        {activeJobForLog && (
          <form onSubmit={handleSubmitTreatmentLog} className="space-y-4">
            <div className="p-3 rounded-xl bg-secondary/50 text-xs space-y-1">
              <p className="font-bold text-foreground">
                {activeJobForLog.customer?.firstName || "Customer"} {activeJobForLog.customer?.lastName || ""}
              </p>
              <p className="text-muted-foreground">{activeJobForLog.property?.address || "Address not provided"}</p>
            </div>

            {/* Target Pest */}
            <div className="space-y-1.5">
              <Label>Target Pest Type *</Label>
              <select
                value={pestType}
                onChange={(e) => setPestType(e.target.value)}
                className="w-full h-11 rounded-lg border border-input bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {COMMON_PESTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Chemical & EPA */}
            <div className="space-y-1.5">
              <Label>Product Applied *</Label>
              <select
                value={chemicalKey}
                onChange={(e) => handleChemicalChange(e.target.value)}
                className="w-full h-11 rounded-lg border border-input bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {Object.keys(COMMON_CHEMICALS).map((k) => (
                  <option key={k} value={k}>
                    {COMMON_CHEMICALS[k].product}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>EPA Reg. Number *</Label>
                <Input
                  value={epaRegistrationNumber}
                  onChange={(e) => setEpaRegistrationNumber(e.target.value)}
                  required
                  className="h-10 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Quantity / Dilution *</Label>
                <Input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="h-10 text-xs"
                />
              </div>
            </div>

            {/* Areas Treated */}
            <div className="space-y-1.5">
              <Label>Areas Treated *</Label>
              <Input
                value={areasTreated}
                onChange={(e) => setAreasTreated(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>

            {/* Weather conditions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Wind Speed</Label>
                <Input
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(e.target.value)}
                  placeholder="3 mph NW"
                  className="h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Temperature</Label>
                <Input
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="72°F"
                  className="h-10 text-xs"
                />
              </div>
            </div>

            {/* Photo Attachment (Works offline via camera/file input) */}
            <div className="space-y-1.5">
              <Label>Job Photos (Infestation / Treated Area)</Label>
              <div className="flex items-center gap-2">
                <label className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-border bg-card hover:bg-muted font-semibold text-xs cursor-pointer touch-target">
                  <Camera className="w-4 h-4 text-primary" />
                  <span>Take / Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoCapture}
                  />
                </label>
                <span className="text-xs text-muted-foreground">
                  {photos.length} photo(s) attached
                </span>
              </div>
            </div>

            {/* Touch Signature Pad */}
            <div className="space-y-1.5">
              <Label>Technician / Customer Signature *</Label>
              <SignaturePad onSave={(sig) => setSignature(sig)} />
            </div>

            {/* Payment Collection Toggle */}
            <div className="p-3 rounded-xl border border-border bg-secondary/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Collect Payment on Site
                </span>
                <input
                  type="checkbox"
                  checked={recordPayment}
                  onChange={(e) => setRecordPayment(e.target.checked)}
                  className="w-5 h-5 rounded text-primary focus:ring-primary"
                />
              </div>

              {recordPayment && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Amount $"
                    className="h-10 text-xs"
                  />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="h-10 rounded-lg border border-input bg-card px-2 text-xs font-semibold"
                  >
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveJobForLog(null)}
                disabled={loadingActionId === "log_submit"}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="font-bold h-11"
                disabled={loadingActionId === "log_submit"}
              >
                {loadingActionId === "log_submit" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Complete & Save Log
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

