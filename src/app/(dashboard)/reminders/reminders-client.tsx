"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Bell, Mail, MessageSquare, RefreshCw, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { triggerManualRemindersAction } from "@/actions/jobs";

interface RemindersClientProps {
  initialReminders: any[];
}

export function RemindersClient({ initialReminders }: RemindersClientProps) {
  const router = useRouter();
  const [runningCron, setRunningCron] = React.useState(false);
  const [reminders, setReminders] = React.useState(initialReminders);

  const handleRunRemindersCron = async () => {
    setRunningCron(true);
    try {
      const res = await triggerManualRemindersAction();
      if (res.success) {
        toast.success(
          `Reminders dispatched! Processed ${res.count || 0} customer notifications.`
        );
        router.refresh();
      } else {
        toast.error(res.error || "Failed to trigger reminders");
      }
    } catch {
      toast.error("Error connecting to reminder dispatcher");
    } finally {
      setRunningCron(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action card */}
      <Card className="border-border bg-card">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Daily Automated Schedule
            </h3>
            <p className="text-xs text-muted-foreground">
              Runs automatically via background cron (<code className="bg-secondary px-1 py-0.5 rounded text-[11px]">/api/cron/reminders</code>) or on-demand.
            </p>
          </div>

          <Button onClick={handleRunRemindersCron} disabled={runningCron} className="font-bold w-full sm:w-auto">
            {runningCron ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Run Reminders Now
          </Button>
        </CardContent>
      </Card>

      {/* Reminder Templates Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <Badge variant="secondary" className="w-fit text-[10px]">Email + SMS</Badge>
            <CardTitle className="text-sm mt-1">Appointment Tomorrow</CardTitle>
            <CardDescription className="text-xs">
              Sent 24 hours before service call asking customer to unlock gates and secure pets.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <Badge variant="secondary" className="w-fit text-[10px]">Email</Badge>
            <CardTitle className="text-sm mt-1">Invoice Overdue</CardTitle>
            <CardDescription className="text-xs">
              Sent when invoice passes due date with one-tap payment link.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <Badge variant="secondary" className="w-fit text-[10px]">Email</Badge>
            <CardTitle className="text-sm mt-1">Service Due (Recurring)</CardTitle>
            <CardDescription className="text-xs">
              Sent 7 days before recurring maintenance date for customer scheduling.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Reminders Log Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Recent Dispatched Reminders</h3>

        {reminders.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              No reminders have been triggered yet. Click &quot;Run Reminders Now&quot; to test dispatch.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Mobile Cards (Phone View) */}
            <div className="space-y-2.5 md:hidden">
              {reminders.map((r) => (
                <Card key={r.id} className="p-3.5 border-border space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-foreground text-xs block">
                        {r.type === "APPOINTMENT_TOMORROW"
                          ? "Appointment Alert"
                          : r.type === "INVOICE_OVERDUE"
                          ? "Overdue Notice"
                          : "Service Due"}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {r.customer?.firstName} {r.customer?.lastName}
                      </span>
                    </div>
                    <Badge variant={r.status === "SENT" ? "success" : "destructive"} className="text-[10px]">
                      {r.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                    <span className="inline-flex items-center gap-1">
                      {r.channel === "SMS" ? (
                        <MessageSquare className="w-3 h-3 text-sky-500" />
                      ) : (
                        <Mail className="w-3 h-3 text-primary" />
                      )}
                      {r.channel}: {r.recipientEmail || r.recipientPhone}
                    </span>
                    <span className="font-mono">{formatDate(r.createdAt)}</span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table (Tablet / Desktop View) */}
            <div className="hidden md:block border border-border rounded-xl overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">Type</th>
                      <th className="p-3">Recipient</th>
                      <th className="p-3">Channel</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Dispatched</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {reminders.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="p-3 font-semibold text-foreground">
                          {r.type === "APPOINTMENT_TOMORROW"
                            ? "Appointment Alert"
                            : r.type === "INVOICE_OVERDUE"
                            ? "Overdue Notice"
                            : "Service Due"}
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-foreground block">
                            {r.customer?.firstName} {r.customer?.lastName}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {r.recipientEmail || r.recipientPhone}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                            {r.channel === "SMS" ? (
                              <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                            ) : (
                              <Mail className="w-3.5 h-3.5 text-primary" />
                            )}
                            {r.channel}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant={r.status === "SENT" ? "success" : "destructive"}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground font-mono">
                          {formatDate(r.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

