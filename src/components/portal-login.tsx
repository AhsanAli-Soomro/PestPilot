"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ArrowRight, UserCheck, Loader2, Sparkles, Building2, Home } from "lucide-react";
import { toast } from "sonner";
import { loginCustomerPortalAction } from "@/actions/portal";

export function CustomerPortalLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    const idToUse = (customId || identifier).trim();

    if (!idToUse) {
      toast.error("Please enter your registered email, phone number, or invoice reference");
      return;
    }

    setLoading(true);
    try {
      const res = await loginCustomerPortalAction(idToUse);
      if (res.success && res.customer) {
        toast.success(`Welcome back, ${res.customer.firstName || "valued customer"}!`);
        router.refresh();
      } else {
        toast.error(res.error || "Customer account not found. Loading demo access...");
        router.push(`/portal?email=${encodeURIComponent(idToUse)}`);
      }
    } catch {
      toast.error("An error occurred during customer portal login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto border-border shadow-2xl bg-card">
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-primary mx-auto flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
          <ShieldCheck className="w-7 h-7 text-emerald-300" />
        </div>
        <CardTitle className="text-2xl font-black tracking-tight">Customer Portal</CardTitle>
        <CardDescription className="text-xs max-w-xs mx-auto">
          View scheduled technician visits, download certified EPA treatment certificates, and pay invoices securely
        </CardDescription>
      </CardHeader>

      <form onSubmit={(e) => handleLogin(e)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="portal-identifier" className="text-xs font-semibold">
              Email, Mobile Phone, or Invoice #
            </Label>
            <Input
              id="portal-identifier"
              type="text"
              placeholder="e.g. ali.ahmed@example.com or +92 300 1234567"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-10 text-xs"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Enter the phone number or email you provided when scheduling your pest treatment
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full font-bold h-10 shadow-md shadow-primary/20">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying Records...
              </>
            ) : (
              <>
                Sign In to Customer Portal <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">Or One-Click Demo Access</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9 justify-start"
              onClick={() => handleLogin(undefined, "ali.ahmed@example.com")}
            >
              <Home className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
              <span className="truncate">Residential Demo</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-9 justify-start"
              onClick={() => handleLogin(undefined, "rdecker@austintacos.com")}
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
              <span className="truncate">Commercial Demo</span>
            </Button>
          </div>
        </CardContent>
      </form>

      <CardFooter className="flex flex-col border-t border-border pt-4 pb-4 gap-2 text-center">
        <p className="text-xs text-muted-foreground">
          Need to schedule a new treatment first?
        </p>
        <div className="flex items-center justify-center gap-3 text-xs">
          <Link href="/#free-tools" className="font-semibold text-primary hover:underline">
            Free AI Pest Scanner
          </Link>
          <span className="text-muted-foreground">&bull;</span>
          <Link href="/#pricing" className="font-semibold text-primary hover:underline">
            Calculate Price
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
