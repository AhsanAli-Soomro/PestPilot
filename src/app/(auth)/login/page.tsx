"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, Loader2, Truck, Users, Building2, Home, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { loginCustomerPortalAction } from "@/actions/portal";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = React.useState<"staff" | "customer">("staff");

  // Staff credentials
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Customer identifier
  const [customerIdentifier, setCustomerIdentifier] = React.useState("");

  const [loading, setLoading] = React.useState(false);

  // Staff / Technician login
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        // Query active session to auto-route technicians to mobile field view
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          if (sessionData?.user?.role === "TECHNICIAN") {
            toast.success("Welcome, Technician! Opening your daily field route...");
            window.location.href = "/mobile/today";
            return;
          }
        } catch {
          // fallback to dashboard
        }
        toast.success("Welcome back to PestPilot!");
        window.location.href = "/dashboard";
      }
    } catch {
      toast.error("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleStaffDemoLogin = async (demoEmail: string, isTech: boolean = false) => {
    setEmail(demoEmail);
    setPassword("PestPilot123!");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: demoEmail,
        password: "PestPilot123!",
        redirect: false,
      });
      if (res?.error) {
        toast.error("Demo login error: Seed database first or sign up.");
      } else {
        if (isTech) {
          toast.success("Signed in as Field Technician! Opening mobile jobs...");
          window.location.href = "/mobile/today";
        } else {
          toast.success("Signed in as Company Owner!");
          window.location.href = "/dashboard";
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Customer portal direct login
  const handleCustomerSubmit = async (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    const idToUse = (customId || customerIdentifier).trim();

    if (!idToUse) {
      toast.error("Please enter your registered email, mobile phone, or invoice #");
      return;
    }

    setLoading(true);
    try {
      const res = await loginCustomerPortalAction(idToUse);
      if (res.success && res.customer) {
        toast.success(`Welcome, ${res.customer.firstName}! Redirecting to Customer Portal...`);
        window.location.href = `/portal?email=${encodeURIComponent(res.customer.email || idToUse)}`;
      } else {
        toast.success("Loading Demo Customer Portal...");
        window.location.href = `/portal?email=${encodeURIComponent(idToUse)}`;
      }
    } catch {
      toast.error("Could not sign in to customer portal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/30">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <span className="text-2xl font-black tracking-tight text-foreground">
              Pest<span className="text-amber-500">Pilot</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground">
            All-in-one Pest Control Field Operations &amp; Customer Portal
          </p>
        </div>

        {/* Role Segment Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-card border border-border shadow-sm">
          <button
            type="button"
            onClick={() => setLoginType("staff")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              loginType === "staff"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Staff &amp; Techs</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginType("customer")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              loginType === "customer"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer Portal</span>
          </button>
        </div>

        <Card className="border-border shadow-xl">
          {loginType === "staff" ? (
            /* Staff / Technician Form */
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Staff &amp; Field Technician Sign In</CardTitle>
                <CardDescription className="text-xs">
                  For company owners, dispatchers, and field technicians
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleStaffSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold">Company Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="owner@apexcontrol.com or tech1@apexcontrol.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="text-xs"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2 font-bold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In as Staff <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </form>

              <div className="px-6 pb-4">
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="bg-card px-2 text-muted-foreground">Quick One-Click Test Accounts</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => handleStaffDemoLogin("owner@apexcontrol.com", false)}
                  >
                    <Building2 className="w-3.5 h-3.5 mr-1 text-primary" />
                    <span>Owner Demo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30"
                    onClick={() => handleStaffDemoLogin("tech1@apexcontrol.com", true)}
                  >
                    <Truck className="w-3.5 h-3.5 mr-1" />
                    <span>Tech Demo (Mobile)</span>
                  </Button>
                </div>
              </div>

              <CardFooter className="flex justify-center border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Don&apos;t have a company account?{" "}
                  <Link href="/signup" className="font-semibold text-primary hover:underline">
                    Sign up for PestPilot
                  </Link>
                </p>
              </CardFooter>
            </>
          ) : (
            /* Customer Portal Form */
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Customer Portal Access</CardTitle>
                <CardDescription className="text-xs">
                  For homeowners &amp; clients to view appointments, EPA reports, and pay invoices
                </CardDescription>
              </CardHeader>

              <form onSubmit={(e) => handleCustomerSubmit(e)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cust-id" className="text-xs font-semibold">
                      Registered Email, Mobile Phone, or Invoice #
                    </Label>
                    <Input
                      id="cust-id"
                      type="text"
                      placeholder="e.g. ali.ahmed@example.com or +92 300 1234567"
                      value={customerIdentifier}
                      onChange={(e) => setCustomerIdentifier(e.target.value)}
                      className="text-xs"
                      autoFocus
                    />
                    <p className="text-[11px] text-muted-foreground">
                      No password required. Instant lookup using your booking contact details.
                    </p>
                  </div>

                  <Button type="submit" className="w-full mt-2 font-bold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Accessing Portal...
                      </>
                    ) : (
                      <>
                        Open Customer Portal <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </form>

              <div className="px-6 pb-4">
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="bg-card px-2 text-muted-foreground">Or Explore Demo Portals</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => handleCustomerSubmit(undefined, "ali.ahmed@example.com")}
                  >
                    <Home className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    <span>Residential Demo</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-9"
                    onClick={() => handleCustomerSubmit(undefined, "rdecker@austintacos.com")}
                  >
                    <Building2 className="w-3.5 h-3.5 mr-1 text-blue-500" />
                    <span>Commercial Demo</span>
                  </Button>
                </div>
              </div>

              <CardFooter className="flex justify-center border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  Need to schedule service or get an instant quote?{" "}
                  <Link href="/#free-tools" className="font-semibold text-primary hover:underline">
                    Try Free Tools
                  </Link>
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
