"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Info,
  Bug,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface IdentificationResult {
  pestName: string;
  scientificName: string;
  confidence: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  description: string;
  epaChemicals: Array<{ name: string; epa: string; activeIngredient: string }>;
  recommendedAction: string;
  urgency: string;
}

interface AiPestIdentifierProps {
  onSelectPest?: (pestName: string, chemicals: Array<{ name: string; epa: string }>) => void;
  onBookService?: (pestName: string) => void;
  mode?: "technician" | "customer";
}

export function AiPestIdentifier({ onSelectPest, onBookService, mode = "customer" }: AiPestIdentifierProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [userNotes, setUserNotes] = React.useState("");
  const [analyzing, setAnalyzing] = React.useState(false);
  const [result, setResult] = React.useState<IdentificationResult | null>(null);
  const [aiSource, setAiSource] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image file is too large (max 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const base64 = readerEvent.target?.result as string;
        setImagePreview(base64);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!imagePreview) {
      toast.error("Please upload or take a photo first");
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/identify-pest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imagePreview,
          userNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Pest identification failed");
      }

      setResult(data.result);
      setAiSource(data.source);
      toast.success(`Identified as ${data.result.pestName}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI analysis error";
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setResult(null);
    setUserNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-border shadow-md overflow-hidden bg-card">
      <CardHeader className="bg-primary/5 border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                AI Pest Identification Scanner
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-600 border-emerald-500/30">
                  Free 0$ Cost
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Upload or photograph an insect to detect species, risk level &amp; approved EPA treatments
              </CardDescription>
            </div>
          </div>
          {imagePreview && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Upload & Preview Zone */}
        {!imagePreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary/60 transition-colors rounded-2xl p-8 text-center cursor-pointer bg-muted/20 hover:bg-muted/40 space-y-3"
          >
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">Click to Take Photo or Upload Image</p>
              <p className="text-xs text-muted-foreground mt-1">Supports JPEG, PNG, WEBP (Up to 5MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-border bg-black/5 max-h-64 flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Pest specimen to analyze"
                className="max-h-64 w-auto object-contain mx-auto"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-semibold flex items-center gap-1 backdrop-blur-sm"
              >
                <Camera className="w-3.5 h-3.5" /> Retake
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Location or Observations (Optional)</Label>
              <Input
                placeholder="e.g. Under kitchen sink, baseboard trim, crawling on wall"
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            {!result && (
              <Button
                onClick={handleRunAiAnalysis}
                disabled={analyzing}
                className="w-full font-bold shadow-md shadow-primary/20"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Specimen with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
                    Identify Pest Now
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* AI Analysis Result Display */}
        {result && (
          <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    AI Match Confirmed ({result.confidence}% Confidence)
                  </span>
                  <h3 className="text-xl font-black text-foreground mt-0.5">{result.pestName}</h3>
                  <p className="text-xs italic text-muted-foreground">{result.scientificName}</p>
                </div>
                <Badge
                  variant={
                    result.riskLevel === "CRITICAL"
                      ? "destructive"
                      : result.riskLevel === "HIGH"
                      ? "warning"
                      : "secondary"
                  }
                  className="font-extrabold uppercase text-[10px]"
                >
                  {result.riskLevel} RISK
                </Badge>
              </div>

              <p className="text-xs text-foreground/90 leading-relaxed">{result.description}</p>

              <div className="p-2.5 rounded-xl bg-card border border-border text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Urgency Assessment:</span>
                </div>
                <p className="text-[11px] text-muted-foreground pl-5">{result.urgency}</p>
              </div>

              {/* Recommended EPA Chemicals */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-foreground block">
                  Recommended EPA Treatment Products:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.epaChemicals.map((chem, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-background border border-border text-xs">
                      <p className="font-bold text-primary truncate">{chem.name}</p>
                      <p className="text-[10px] text-muted-foreground">EPA Reg No: {chem.epa}</p>
                      <p className="text-[10px] text-muted-foreground/80">{chem.activeIngredient}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border/60">
                <strong>Recommended Protocol:</strong> {result.recommendedAction}
              </div>
            </div>

            {/* Action Buttons depending on user role */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {mode === "technician" && onSelectPest && (
                <Button
                  onClick={() => onSelectPest(result.pestName, result.epaChemicals)}
                  className="w-full font-bold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Apply to Job Treatment Log
                </Button>
              )}

              {mode === "customer" && (
                <Button
                  onClick={() => onBookService?.(result.pestName)}
                  className="w-full font-bold"
                >
                  <Bug className="w-4 h-4 mr-1.5" />
                  Schedule {result.pestName} Extermination
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

