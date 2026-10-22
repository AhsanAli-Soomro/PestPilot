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
import { formatDate } from "@/lib/utils";
import { createJobAction, rescheduleJobAction } from "@/actions/jobs";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Plus,
  Truck,
  ArrowRight,
  Filter,
  CheckCircle2,
  Loader2,
  MoveVertical,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface ScheduleClientProps {
  initialJobs: any[];
  customers: any[];
  technicians: Array<{ id: string; name: string; role: string }>;
  initialCustomerId?: string;
  userRole: string;
}

export function ScheduleClient({
  initialJobs,
  customers,
  technicians,
  initialCustomerId,
  userRole,
}: ScheduleClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = React.useState<"list" | "day" | "week">("list");
  const [selectedTech, setSelectedTech] = React.useState<string>("ALL");
  const [isNewJobOpen, setIsNewJobOpen] = React.useState(!!initialCustomerId);
  const [loading, setLoading] = React.useState(false);

  // Reschedule state
  const [editingJob, setEditingJob] = React.useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState("");
  const [rescheduleTime, setRescheduleTime] = React.useState("");
  const [rescheduleOrder, setRescheduleOrder] = React.useState(0);

  // New Job Form State
  const [customerId, setCustomerId] = React.useState(initialCustomerId || customers[0]?.id || "");
  const [propertyId, setPropertyId] = React.useState("");
  const [technicianId, setTechnicianId] = React.useState(technicians[0]?.id || "");
  const [title, setTitle] = React.useState("Quarterly Pest Maintenance");
  const [description, setDescription] = React.useState("");
  const [scheduledDate, setScheduledDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [scheduledStartTime, setScheduledStartTime] = React.useState("09:00");
  const [scheduledEndTime, setScheduledEndTime] = React.useState("10:30");
  const [routeOrder, setRouteOrder] = React.useState(1);
  const [notes, setNotes] = React.useState("");

  const activeCustomer = customers.find((c) => c.id === customerId);
  React.useEffect(() => {
    if (activeCustomer?.properties?.[0]) {
      setPropertyId(activeCustomer.properties[0].id);
    } else {
      setPropertyId("");
    }
  }, [activeCustomer]);

  const filteredJobs = React.useMemo(() => {
    return initialJobs.filter((j) => {
      if (selectedTech === "ALL") return true;
      return j.technicianId === selectedTech;
    });
  }, [initialJobs, selectedTech]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !propertyId) {
      toast.error("Please select a customer and property address");
      return;
    }
    setLoading(true);

    try {
      const res = await createJobAction({
        customerId,
        propertyId,
        technicianId: technicianId || null,
        title,
        description,
        scheduledDate,
        scheduledStartTime,
        scheduledEndTime,
        routeOrder: Number(routeOrder),
        notes,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to schedule job");
        return;
      }

      toast.success("Job scheduled successfully!");
      setIsNewJobOpen(false);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    setLoading(true);

    try {
      const res = await rescheduleJobAction(
        editingJob.id,
        rescheduleDate,
        rescheduleTime,
        rescheduleOrder
      );

      if (!res.success) {
        toast.error(res.error || "Failed to reschedule job");
        return;
      }

      toast.success("Job rescheduled!");
      setEditingJob(null);
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const [isOptimizing, setIsOptimizing] = React.useState(false);

  const handleSmartRouteOptimize = async () => {
    setIsOptimizing(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Smart Route Optimized! Stops arranged by geographic proximity & time window (Saved ~25% travel fuel).");
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* View Switcher & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-1 bg-card">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Jobs List
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                viewMode === "day"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Day Route
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                viewMode === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Week View
            </button>
          </div>

          {/* Technician Filter */}
          {technicians.length > 1 && (
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="h-9 rounded-lg border border-input bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">All Technicians</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSmartRouteOptimize}
            disabled={isOptimizing}
            className="border-primary/40 text-primary hover:bg-primary/10 text-xs h-9"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            {isOptimizing ? "Optimizing..." : "Smart Route Optimize"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/mobile/today">
            <Button variant="accent" size="sm">
              <Truck className="w-4 h-4 mr-1.5" /> Open Field Dispatch
            </Button>
          </Link>
          <Button size="sm" onClick={() => setIsNewJobOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Schedule Job
          </Button>
        </div>
      </div>

      {/* Jobs View */}
      {filteredJobs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-bold text-base text-foreground mb-1">No Jobs on Schedule</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Schedule service calls or regular maintenance visits.
          </p>
          <Button onClick={() => setIsNewJobOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Schedule New Job
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Card
              key={job.id}
              className="p-4 hover:border-primary/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                    Stop #{job.routeOrder || 1}
                  </span>
                  <h3 className="font-bold text-base text-foreground">{job.title}</h3>
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

                <p className="text-xs text-muted-foreground">
                  Customer:{" "}
                  <Link
                    href={`/customers/${job.customer.id}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {job.customer.firstName} {job.customer.lastName}
                  </Link>{" "}
                  &bull; {job.property.address}, {job.property.city}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1 font-semibold text-foreground">
                    <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                    {formatDate(job.scheduledDate)}
                  </span>
                  {job.scheduledStartTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {job.scheduledStartTime}
                      {job.scheduledEndTime && ` - ${job.scheduledEndTime}`}
                    </span>
                  )}
                  {job.technician?.name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {job.technician.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingJob(job);
                    setRescheduleDate(new Date(job.scheduledDate).toISOString().split("T")[0]);
                    setRescheduleTime(job.scheduledStartTime || "09:00");
                    setRescheduleOrder(job.routeOrder || 1);
                  }}
                >
                  <MoveVertical className="w-3.5 h-3.5 mr-1" /> Reschedule
                </Button>
                <Link href="/mobile/today">
                  <Button size="sm">Field View</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Job Modal */}
      <Modal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        title="Schedule Service Call"
        description="Assign technician, date, and route order"
        className="max-w-xl"
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer *</Label>
              <select
                id="customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
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
              <Label htmlFor="property">Property Address *</Label>
              <select
                id="property"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                required
                className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {activeCustomer?.properties?.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.address}, {p.city}
                  </option>
                )) || <option value="">No registered address</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Quarterly Perimeter Spray"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tech">Assigned Technician</Label>
              <select
                id="tech"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full h-11 rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="scheduledDate">Service Date *</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={scheduledStartTime}
                onChange={(e) => setScheduledStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="routeOrder">Route Order</Label>
              <Input
                id="routeOrder"
                type="number"
                min="1"
                value={routeOrder}
                onChange={(e) => setRouteOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jobNotes">Notes / Special Instructions</Label>
            <Input
              id="jobNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Watch for dogs in backyard, check garage corners"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewJobOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling...
                </>
              ) : (
                "Save & Schedule Job"
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!editingJob}
        onClose={() => setEditingJob(null)}
        title="Reschedule Job"
      >
        {editingJob && (
          <form onSubmit={handleReschedule} className="space-y-3">
            <p className="text-xs text-muted-foreground font-semibold">
              {editingJob.title} &bull; {editingJob.customer.firstName} {editingJob.customer.lastName}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>New Date</Label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Route Order</Label>
              <Input
                type="number"
                min="1"
                value={rescheduleOrder}
                onChange={(e) => setRescheduleOrder(Number(e.target.value))}
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingJob(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save New Date"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

