"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, CheckCircle2, ShieldCheck, ArrowRight, Tag } from "lucide-react";

interface PriceCalculatorProps {
  onBookPlan?: (planTitle: string, price: number) => void;
}

const PROPERTY_TYPES = [
  { id: "apt", name: "Apartment / Condo (Up to 1,000 sq ft)", multiplier: 1.0 },
  { id: "mid", name: "Single Family Home (1,000 - 2,500 sq ft)", multiplier: 1.35 },
  { id: "large", name: "Large Home / Villa (2,500 - 4,500 sq ft)", multiplier: 1.75 },
  { id: "comm", name: "Commercial / Restaurant Facility", multiplier: 2.2 },
];

const PEST_SERVICES = [
  { id: "general", name: "General Pest (Cockroaches & Ants)", base: 95 },
  { id: "termites", name: "Subterranean Termite Barrier", base: 240 },
  { id: "bedbugs", name: "Bedbug Heat & Residual Flushout", base: 190 },
  { id: "rodents", name: "Rodent Exclusion & Baiting", base: 140 },
  { id: "wasps", name: "Wasp & Hornet Nest Extraction", base: 110 },
  { id: "mosquitoes", name: "Mosquito Perimeter Fogging", base: 85 },
];

const SEVERITY_LEVELS = [
  { id: "low", name: "Preventative / Minor", factor: 1.0 },
  { id: "med", name: "Moderate Infestation", factor: 1.25 },
  { id: "high", name: "Severe / Widespread Infestation", factor: 1.45 },
];

const FREQUENCIES = [
  { id: "onetime", name: "One-Time Service", discount: 0, tag: "Standard" },
  { id: "quarterly", name: "Quarterly AMC Plan", discount: 0.20, tag: "Save 20% - Most Popular" },
  { id: "monthly", name: "Monthly Intensive Care", discount: 0.30, tag: "Save 30%" },
];

export function PriceCalculator({ onBookPlan }: PriceCalculatorProps) {
  const [propertyType, setPropertyType] = React.useState(PROPERTY_TYPES[1].id);
  const [pestService, setPestService] = React.useState(PEST_SERVICES[0].id);
  const [severity, setSeverity] = React.useState(SEVERITY_LEVELS[0].id);
  const [frequency, setFrequency] = React.useState(FREQUENCIES[1].id);

  const selectedProperty = PROPERTY_TYPES.find((p) => p.id === propertyType) || PROPERTY_TYPES[1];
  const selectedService = PEST_SERVICES.find((s) => s.id === pestService) || PEST_SERVICES[0];
  const selectedSeverity = SEVERITY_LEVELS.find((v) => v.id === severity) || SEVERITY_LEVELS[0];
  const selectedFrequency = FREQUENCIES.find((f) => f.id === frequency) || FREQUENCIES[1];

  const rawEstimate = Math.round(
    selectedService.base * selectedProperty.multiplier * selectedSeverity.factor
  );
  const finalPrice = Math.round(rawEstimate * (1 - selectedFrequency.discount));
  const discountSavings = rawEstimate - finalPrice;

  return (
    <Card className="border-border shadow-md overflow-hidden bg-card">
      <CardHeader className="bg-primary/5 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <Calculator className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              Instant Pest Service Price Calculator
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-500/30">
                Transparent
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Calculate accurate estimate based on your square footage, pest type, and infestation severity
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Step 1: Property Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">1. Property Size &amp; Type</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full h-10 rounded-lg border border-input bg-card px-3 text-xs"
          >
            {PROPERTY_TYPES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Target Pest */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">2. Target Pest Species</label>
          <select
            value={pestService}
            onChange={(e) => setPestService(e.target.value)}
            className="w-full h-10 rounded-lg border border-input bg-card px-3 text-xs"
          >
            {PEST_SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Base ~${s.base})
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: Infestation Severity */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">3. Infestation Level</label>
          <div className="grid grid-cols-3 gap-2">
            {SEVERITY_LEVELS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSeverity(v.id)}
                className={`p-2 rounded-lg border text-center text-[11px] font-semibold transition-all ${
                  severity === v.id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Maintenance Frequency */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">4. Service Frequency &amp; Warranty</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {FREQUENCIES.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrequency(f.id)}
                className={`p-2 rounded-lg border text-left text-xs transition-all relative ${
                  frequency === f.id
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5 text-foreground font-bold"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="text-[11px]">{f.name}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">
                  {f.tag}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Calculated Output Box */}
        <div className="p-4 rounded-2xl bg-secondary/60 border border-border space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Estimated Service Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-foreground">${finalPrice}</span>
                {discountSavings > 0 && (
                  <span className="text-xs line-through text-muted-foreground">${rawEstimate}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {frequency === "onetime" ? "one-time" : "per visit"}
                </span>
              </div>
            </div>

            {discountSavings > 0 && (
              <Badge variant="success" className="text-xs font-extrabold">
                <Tag className="w-3 h-3 mr-1" />
                You Save ${discountSavings}
              </Badge>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Includes 100% Retreatment Guarantee &amp; EPA Registration Certificate</span>
          </div>
        </div>

        <Button
          onClick={() => onBookPlan?.(`${selectedService.name} (${selectedFrequency.name})`, finalPrice)}
          className="w-full font-bold shadow-md shadow-primary/25 h-11"
        >
          Book This Estimate for ${finalPrice}
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
