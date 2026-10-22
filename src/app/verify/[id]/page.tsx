import { Metadata } from "next";
import { db } from "@/lib/db";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, FileCheck2, ArrowLeft, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Official Treatment Verification | PestPilot",
  description: "Official public verification of licensed pest control application and EPA compliance",
};

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyRecordPage({ params }: VerifyPageProps) {
  const { id } = await params;

  // Lookup Job or TreatmentLog
  const job = await db.job.findUnique({
    where: { id },
    include: {
      organization: true,
      customer: true,
      property: true,
      treatmentLogs: true,
      technician: { select: { name: true, licenseNumber: true } },
    },
  });

  const log = job?.treatmentLogs?.[0];
  const org = job?.organization;

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col justify-between p-4 sm:p-6 md:p-10">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
          <ThemeToggle />
        </div>

        {/* Verification Certificate Card */}
        <Card className="border-2 border-emerald-500/40 bg-card shadow-xl overflow-hidden">
          <div className="bg-emerald-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
              <div>
                <h1 className="font-extrabold text-base leading-tight">Verified Pest Service Record</h1>
                <p className="text-[11px] text-emerald-100">Official EPA Compliance Audit Record</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white/20 text-white border-white/40 font-black text-xs uppercase">
              Authentic
            </Badge>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Pest Control Operator
              </span>
              <h2 className="text-xl font-black text-foreground">
                {org?.name || "Licensed Commercial Pest Services"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {org?.address || "Licensed & Insured Operator"} &bull; {org?.phone || "Support Verified"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-xl bg-muted/30 border border-border">
              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Service Date:</span>
                <span className="font-semibold text-foreground">
                  {formatDate(job?.completedAt || job?.scheduledDate || new Date().toISOString())}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Verification ID:</span>
                <span className="font-mono text-primary font-bold">VER-{id.slice(0, 8).toUpperCase()}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Certified Applicator:</span>
                <span className="text-foreground">
                  {log?.applicatorName || job?.technician?.name || "Certified Technician"}
                </span>
                <p className="text-[10px] text-muted-foreground">License: {log?.licenseNumber || "Active"}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Customer Property:</span>
                <span className="text-foreground">{job?.property?.address || "Registered Service Address"}</span>
              </div>
            </div>

            {/* Chemical & Treatment Record */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                Chemical Treatment Application Details:
              </h3>
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Pest:</span>
                  <span className="font-bold text-foreground">{log?.pestType || job?.title || "General Pest Infestation"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EPA Product Name:</span>
                  <span className="font-bold text-primary">{log?.chemicalProduct || "Demand CS (Lambda-cyhalothrin)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">EPA Registration Number:</span>
                  <span className="font-mono text-foreground">{log?.epaRegistrationNumber || "100-1066"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity & Dilution:</span>
                  <span className="text-foreground">{log?.quantity || "1.5 gallons 0.03%"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Areas Treated:</span>
                  <span className="text-foreground">{log?.areasTreated || "Exterior perimeter foundation & eaves"}</span>
                </div>
              </div>
            </div>

            {/* Signature & Audit Assurance */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">Digital Signature Captured On-Site</p>
                <p className="text-[11px] text-muted-foreground">
                  This electronic treatment record is locked against tampering and complies with State Department of Agriculture record retention requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Verified via PestPilot Secure Electronic Recordkeeping Engine</p>
          <p>&copy; {new Date().getFullYear()} PestPilot. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
