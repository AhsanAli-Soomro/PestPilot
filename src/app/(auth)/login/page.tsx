"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        toast.success("Welcome back to PestPilot!");
        window.location.href = "/dashboard";
      }
    } catch {
      toast.error("An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
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
        toast.success("Signed in with demo account!");
        window.location.href = "/dashboard";
      }
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
          <p className="text-sm text-muted-foreground">
            Sign in to manage your pest control field operations
          </p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to access your company dashboard</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@apexcontrol.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
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
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground font-semibold">Quick Demo Logins</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleDemoLogin("owner@apexcontrol.com")}
              >
                Owner Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleDemoLogin("tech1@apexcontrol.com")}
              >
                Tech Demo (Mobile)
              </Button>
            </div>
          </div>

          <CardFooter className="flex justify-center border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up for PestPilot
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

