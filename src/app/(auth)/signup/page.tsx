"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerUserAction } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);

      const res = await registerUserAction(formData);

      if (!res.success) {
        toast.error(res.error || "Failed to create account");
        setLoading(false);
        return;
      }

      toast.success("Account created successfully! Signing in...");

      // Automatically sign in
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.error("Account created, please sign in.");
        window.location.href = "/login";
      } else {
        window.location.href = "/onboarding";
      }
    } catch {
      toast.error("An error occurred during signup.");
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
            Field-service software built for 1 to 5 truck pest control teams
          </p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>Get started in less than 3 minutes. No credit card required.</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Dave Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="dave@millerpest.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (min 6 characters)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex justify-center border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

