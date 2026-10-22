"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import { jsPDF } from "jspdf";
import {
  Download,
  FileSpreadsheet,
  FileCheck,
  Search,
  ShieldCheck,
  Copy,
  Check,
  BookOpen,
  FlaskConical,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { EPA_CHEMICAL_DIRECTORY, type ChemicalProduct } from "@/lib/chemicals";

interface ReportsClientProps {
  initialLogs: any[];
  customers: any[];
  organizationName: string;
}

export function ReportsClient({ initialLogs, customers, organizationName }: ReportsClientProps) {
  const [activeTab, setActiveTab] = React.useState<"logs" | "chemicals">("logs");
  const [logs] = React.useState(initialLogs);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("ALL");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [searchPest, setSearchPest] = React.useState("");

  // Chemical Directory State
  const [chemicalSearch, setChemicalSearch] = React.useState("");
  const [selectedPestCategory, setSelectedPestCategory] = React.useState("ALL");
  const [copiedEpa, setCopiedEpa] = React.useState<string | null>(null);

  const filteredChemicals = React.useMemo(() => {
    return EPA_CHEMICAL_DIRECTORY.filter((chem) => {
      if (selectedPestCategory !== "ALL") {
        const matchesCategory = chem.targetPests.some((p) =>
          p.toLowerCase().includes(selectedPestCategory.toLowerCase())
        );
        if (!matchesCategory) return false;
      }

      if (chemicalSearch.trim()) {
        const q = chemicalSearch.toLowerCase();
        const matchesName = chem.name.toLowerCase().includes(q);
        const matchesActive = chem.activeIngredient.toLowerCase().includes(q);
        const matchesEpa = chem.epaRegNumber.includes(q);
        const matchesPest = chem.targetPests.some((p) => p.toLowerCase().includes(q));
        if (!matchesName && !matchesActive && !matchesEpa && !matchesPest) return false;
      }

      return true;
    });
  }, [chemicalSearch, selectedPestCategory]);

  const handleCopyEpa = (epa: string) => {
    navigator.clipboard.writeText(epa);
    setCopiedEpa(epa);
    toast.success(`Copied EPA Reg #${epa} to clipboard`);
    setTimeout(() => setCopiedEpa(null), 2000);
  };

  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      if (selectedCustomerId !== "ALL" && log.job.customerId !== selectedCustomerId) {
        return false;
      }

      if (startDate) {
        const logDate = new Date(log.createdAt);
        if (logDate < new Date(startDate)) return false;
      }

      if (endDate) {
        const logDate = new Date(log.createdAt);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (logDate > end) return false;
      }

      if (searchPest) {
        const match =
          log.pestType.toLowerCase().includes(searchPest.toLowerCase()) ||
          log.chemicalProduct.toLowerCase().includes(searchPest.toLowerCase()) ||
          log.epaRegistrationNumber.toLowerCase().includes(searchPest.toLowerCase());
        if (!match) return false;
      }

      return true;
    });
  }, [logs, selectedCustomerId, startDate, endDate, searchPest]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      toast.error("No application records to export");
      return;
    }

    const headers = [
      "Date",
      "Customer",
      "Address",
      "Applicator",
      "License #",
      "Target Pest",
      "Chemical / Product",
      "EPA Reg #",
      "Quantity / Dilution",
      "Areas Treated",
      "Wind Speed",
      "Temperature",
      "Notes",
    ];

    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toISOString().split("T")[0],
      `"${log.job.customer.firstName} ${log.job.customer.lastName}"`,
      `"${log.job.property.address}, ${log.job.property.city}"`,
      `"${log.applicatorName || log.technician.name || "Technician"}"`,
      `"${log.licenseNumber || log.technician.licenseNumber || "N/A"}"`,
      `"${log.pestType}"`,
      `"${log.chemicalProduct}"`,
      `"${log.epaRegistrationNumber}"`,
      `"${log.quantity}"`,
      `"${log.areasTreated}"`,
      `"${log.windSpeed || "N/A"}"`,
      `"${log.temperature || "N/A"}"`,
      `"${(log.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PestPilot_Chemical_Compliance_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Compliance Report downloaded!");
  };

  // Export to PDF
  const handleExportPdf = () => {
    if (filteredLogs.length === 0) {
      toast.error("No records to export");
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const darkGreen = "#1b4332";
    const gray = "#555555";

    // Header
    doc.setFontSize(18);
    doc.setTextColor(darkGreen);
    doc.text(`${organizationName.toUpperCase()} - EPA PESTICIDE APPLICATION LOG`, 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(gray);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Application Records: ${filteredLogs.length}`, 14, 24);

    // Table Header
    let y = 32;
    doc.setFillColor(235, 243, 238);
    doc.rect(14, y - 5, 269, 7, "F");

    doc.setFontSize(8);
    doc.setTextColor(darkGreen);
    doc.text("DATE", 16, y);
    doc.text("CUSTOMER & ADDRESS", 40, y);
    doc.text("APPLICATOR (LIC #)", 105, y);
    doc.text("PEST TARGET", 150, y);
    doc.text("PRODUCT (EPA REG #)", 185, y);
    doc.text("DILUTION / QTY", 235, y);

    y += 5;
    doc.setTextColor(gray);
    doc.setFontSize(7.5);

    filteredLogs.forEach((log) => {
      if (y > 185) {
        doc.addPage();
        y = 20;
      }

      doc.text(formatDate(log.createdAt), 16, y);

      const custText = `${log.job.customer.firstName} ${log.job.customer.lastName}\n${log.job.property.address}`;
      doc.text(doc.splitTextToSize(custText, 60), 40, y);

      const appText = `${log.applicatorName || log.technician.name || "Tech"}\nLic: ${log.licenseNumber || log.technician.licenseNumber || "N/A"}`;
      doc.text(doc.splitTextToSize(appText, 40), 105, y);

      doc.text(doc.splitTextToSize(log.pestType, 32), 150, y);

      const prodText = `${log.chemicalProduct}\nEPA: ${log.epaRegistrationNumber}`;
      doc.text(doc.splitTextToSize(prodText, 45), 185, y);

      doc.text(doc.splitTextToSize(log.quantity, 45), 235, y);

      y += 11;
      doc.setDrawColor(230, 230, 230);
      doc.line(14, y - 2, 283, y - 2);
    });

    doc.save(`EPA_Compliance_Log_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF Compliance Report downloaded!");
  };

  return (
    <div className="space-y-6">
      {/* Top Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all touch-target ${
            activeTab === "logs"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Treatment Log Regulatory Export</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === "logs" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {filteredLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chemicals")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all touch-target ${
            activeTab === "chemicals"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>EPA Chemical & SDS Safety Library</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeTab === "chemicals" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            {EPA_CHEMICAL_DIRECTORY.length} Products
          </span>
        </button>
      </div>

      {/* TAB 1: TREATMENT LOGS AUDIT EXPORT */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filters Card */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <Label className="text-xs">Customer</Label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-card px-2 text-xs"
                  >
                    <option value="ALL">All Customers</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs">From Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">To Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Search Chemical / Pest / EPA</Label>
                  <Input
                    placeholder="e.g. Taurus SC or 53883-279"
                    value={searchPest}
                    onChange={(e) => setSearchPest(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground font-semibold">
                  Showing {filteredLogs.length} matching treatment records
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCsv}>
                    <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" /> Export CSV
                  </Button>
                  <Button size="sm" onClick={handleExportPdf}>
                    <Download className="w-4 h-4 mr-1.5" /> Download PDF Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Records Table */}
          {filteredLogs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <FileCheck className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-bold text-base text-foreground mb-1">No Treatment Records Found</h3>
              <p className="text-xs text-muted-foreground">
                Complete jobs in the technician field view to generate compliance records.
              </p>
            </Card>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/60 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Customer & Address</th>
                      <th className="p-3">Pest Target</th>
                      <th className="p-3">Chemical & EPA #</th>
                      <th className="p-3">Quantity & Areas</th>
                      <th className="p-3">Applicator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-foreground block">
                            {log.job.customer.firstName} {log.job.customer.lastName}
                          </span>
                          <span className="text-muted-foreground text-[11px]">
                            {log.job.property.address}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[10px]">
                            {log.pestType}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-foreground block">{log.chemicalProduct}</span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            EPA Reg: {log.epaRegistrationNumber}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-foreground block">{log.quantity}</span>
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[200px]">
                            {log.areasTreated}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-foreground block">
                            {log.applicatorName || log.technician.name || "Technician"}
                          </span>
                          {log.licenseNumber && (
                            <span className="text-[11px] text-muted-foreground">
                              Lic: {log.licenseNumber}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EPA CHEMICAL & SDS REFERENCE DIRECTORY */}
      {activeTab === "chemicals" && (
        <div className="space-y-4">
          {/* Chemical Search & Filter Bar */}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    type="text"
                    placeholder="Search by product name, active ingredient, or EPA Reg #..."
                    value={chemicalSearch}
                    onChange={(e) => setChemicalSearch(e.target.value)}
                    className="pl-9 h-10 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedPestCategory}
                    onChange={(e) => setSelectedPestCategory(e.target.value)}
                    className="h-10 rounded-lg border border-input bg-card px-3 text-xs font-medium text-foreground"
                  >
                    <option value="ALL">All Pest Targets</option>
                    <option value="Termite">Termites</option>
                    <option value="Roach">Cockroaches</option>
                    <option value="Bedbug">Bedbugs</option>
                    <option value="Rodent">Rodents</option>
                    <option value="Ant">Ants</option>
                    <option value="Mosquito">Mosquitoes</option>
                    <option value="Scorpion">Scorpions / Spiders</option>
                  </select>
                </div>
              </div>

              {/* Informational banner */}
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-center gap-2.5 text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <span>
                  All products below are standard commercial pesticides registered with the U.S. EPA. Tap &quot;Copy EPA #&quot; to quickly paste into field treatment logs.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Chemical Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChemicals.map((chem) => (
              <Card key={chem.epaRegNumber} className="border-border hover:border-primary/40 transition-all shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        {chem.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Manufacturer: {chem.manufacturer}</p>
                    </div>

                    <Badge variant="outline" className="text-[10px] shrink-0 font-semibold bg-muted/40">
                      {chem.applicationType}
                    </Badge>
                  </div>

                  {/* EPA Reg & Active Ingredient */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                        Active Ingredient
                      </span>
                      <span className="font-semibold text-foreground text-xs">
                        {chem.activeIngredient} ({chem.concentration})
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">
                        EPA Reg. Number
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-foreground text-xs">{chem.epaRegNumber}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyEpa(chem.epaRegNumber)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy EPA Registration Number"
                        >
                          {copiedEpa === chem.epaRegNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Standard Dilution Rate */}
                  <div className="text-xs space-y-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      Standard Label Dilution:
                    </span>
                    <p className="font-semibold text-foreground">{chem.standardDilution}</p>
                  </div>

                  {/* Target Pests */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                      Labeled Target Pests:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {chem.targetPests.map((pest) => (
                        <span
                          key={pest}
                          className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-medium"
                        >
                          {pest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Safety & Label Guidance */}
                  <div className="pt-2 border-t border-border flex items-start gap-2 text-[11px] text-muted-foreground">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="line-clamp-2 hover:line-clamp-none transition-all">{chem.safetyNotes}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

