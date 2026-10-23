"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, Loader2, Truck, Users } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { CustomerPortalLogin } from "@/components/portal-login";

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = React.useState<"staff" | "customer">("staff");

  // Staff credentials
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Check active session on mount to auto-route already logged in users
  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.user) {
          if (session.user.role === "TECHNICIAN") {
            window.location.href = "/mobile/today";
          } else {
            window.location.href = "/dashboard";
          }
        }
      })
      .catch(() => {});
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-8 px-3 sm:px-4 bg-muted/30">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-5 sm:space-y-6">
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
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all ${
              loginType === "staff"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span className="truncate">Staff &amp; Techs</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginType("customer")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all ${
              loginType === "customer"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">Customer Portal</span>
          </button>
        </div>

        {loginType === "staff" ? (
          <Card className="border-border shadow-xl overflow-hidden">
            <CardHeader className="space-y-1 p-4 sm:p-6 pb-2 sm:pb-4">
              <h1 className="text-lg sm:text-xl font-bold leading-none tracking-tight text-foreground">
                Staff &amp; Field Technician Sign In
              </h1>
              <CardDescription className="text-xs">
                For company owners, dispatchers, and field technicians
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleStaffSubmit}>
              <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
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

            <CardFooter className="flex justify-center border-t border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Don&apos;t have a company account?{" "}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                  Sign up for PestPilot
                </Link>
              </p>
            </CardFooter>
          </Card>
        ) : (
          <CustomerPortalLogin />
        )}
      </div>
    </div>
  );
}
