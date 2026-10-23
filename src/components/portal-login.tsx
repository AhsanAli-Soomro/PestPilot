"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  Mail,
  Lock,
  Phone,
  User,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import {
  requestCustomerOtpAction,
  verifyCustomerOtpAction,
  loginCustomerWithPasswordAction,
  getOAuthConfigAction,
  initCustomerOAuthOtpAction,
} from "@/actions/customer-auth";

interface CustomerPortalLoginProps {
  initialOAuthData?: {
    provider: "google" | "apple";
    email: string;
    name?: string;
  };
}

export function CustomerPortalLogin({ initialOAuthData }: CustomerPortalLoginProps = {}) {
  const router = useRouter();

  // Mode: "signin" | "signup" | "otp" | "success"
  const [authMode, setAuthMode] = React.useState<"signin" | "signup" | "otp" | "success">("signin");
  const [authMethod, setAuthMethod] = React.useState<"password" | "otp">("password");
  const [oauthProvider, setOauthProvider] = React.useState<"google" | "apple" | null>(
    initialOAuthData?.provider || null
  );

  // Sign In fields
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");

  // Sign Up fields
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [signupEmail, setSignupEmail] = React.useState("");
  const [signupPhone, setSignupPhone] = React.useState("");

  // OTP Verification fields
  const [otpTargetEmail, setOtpTargetEmail] = React.useState("");
  const [otpCode, setOtpCode] = React.useState("");
  const [otpPendingMode, setOtpPendingMode] = React.useState<"login" | "signup">("login");
  const [resendCooldown, setResendCooldown] = React.useState(0);

  // Success state with auto-generated password
  const [createdPassword, setCreatedPassword] = React.useState("");
  const [hasCopiedPassword, setHasCopiedPassword] = React.useState(false);

  const [loading, setLoading] = React.useState(false);

  // Cooldown timer for resend OTP
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 1. Handle Direct Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      toast.error("Please enter your registered email address.");
      return;
    }
    if (!loginPassword.trim()) {
      toast.error("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginCustomerWithPasswordAction(loginEmail, loginPassword);
      if (res.success && res.customer) {
        toast.success(`Welcome back, ${res.customer.firstName}!`);
        router.push("/portal");
        router.refresh();
      } else {
        toast.error(res.error || "Login failed. You can sign in using a One-Time Email Code.");
      }
    } catch {
      toast.error("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Request OTP (Either from Sign Up or Forgot/OTP Login)
  const handleRequestOtp = async (mode: "login" | "signup") => {
    const emailToUse = mode === "signup" ? signupEmail.trim() : loginEmail.trim();

    if (!emailToUse || !emailToUse.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (mode === "signup") {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error("Please enter your First Name and Last Name.");
        return;
      }
      if (!signupPhone.trim()) {
        toast.error("Please enter your contact phone number.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await requestCustomerOtpAction({
        email: emailToUse,
        mode,
        signupData:
          mode === "signup"
            ? {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: signupPhone.trim(),
              }
            : undefined,
      });

      if (res.success) {
        setOtpTargetEmail(emailToUse);
        setOtpPendingMode(mode);
        setOtpCode("");
        setResendCooldown(60);
        setAuthMode("otp");
        toast.success(res.message || "Verification code sent to your email!");
      } else {
        toast.error(res.error || "Failed to send verification code.");
      }
    } catch {
      toast.error("Failed to connect to verification service.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-process arrival from authentic Google / Apple OAuth flow
  React.useEffect(() => {
    if (!initialOAuthData?.email) return;

    let isMounted = true;
    const processOAuthArrival = async () => {
      setLoading(true);
      try {
        const res = await initCustomerOAuthOtpAction({
          email: initialOAuthData.email,
          name: initialOAuthData.name,
          provider: initialOAuthData.provider,
        });

        if (!isMounted) return;

        if (res.success) {
          if (res.alreadyVerified) {
            toast.success(`Welcome back! ${initialOAuthData.provider === "google" ? "Google" : "Apple"} account verified.`);
            router.push("/portal");
            router.refresh();
          } else {
            setOtpTargetEmail(res.email || initialOAuthData.email);
            setFirstName(res.firstName || "");
            setLastName(res.lastName || "");
            setOauthProvider(initialOAuthData.provider);
            setOtpPendingMode("signup");
            setAuthMode("otp");
            toast.success(res.message);
          }
        } else {
          toast.error(res.error || "Failed to initiate verification.");
        }
      } catch {
        if (isMounted) toast.error("An error occurred during social verification.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    processOAuthArrival();
    return () => {
      isMounted = false;
    };
  }, [initialOAuthData, router]);

  // Handle Real Authentic Google / Apple OAuth Sign In
  const handleSocialClick = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const config = await getOAuthConfigAction();
      if (provider === "google" && !config.isGoogleConfigured) {
        toast.error(
          "Google OAuth credentials missing: Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from Google Cloud Console in .env / Vercel."
        );
        setLoading(false);
        return;
      }
      if (provider === "apple" && !config.isAppleConfigured) {
        toast.error(
          "Apple Sign-In credentials missing: Please add AUTH_APPLE_ID and AUTH_APPLE_SECRET in .env / Vercel."
        );
        setLoading(false);
        return;
      }

      await signIn(provider, {
        callbackUrl: `/portal?auth_provider=${provider}`,
      });
    } catch {
      toast.error(`Could not initiate ${provider === "google" ? "Google" : "Apple"} sign-in.`);
      setLoading(false);
    }
  };

  // 3. Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyCustomerOtpAction({
        email: otpTargetEmail,
        code: otpCode.trim(),
        mode: otpPendingMode,
        signupData:
          otpPendingMode === "signup"
            ? {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: signupPhone.trim(),
              }
            : undefined,
      });

      if (res.success) {
        if (res.autoPassword) {
          setCreatedPassword(res.autoPassword);
          setAuthMode("success");
          toast.success("Account verified! We generated your login password.");
        } else {
          toast.success("Verification successful! Opening your customer portal...");
          router.push("/portal");
          router.refresh();
        }
      } else {
        toast.error(res.error || "Invalid code. Please check and try again.");
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (!createdPassword) return;
    navigator.clipboard.writeText(createdPassword);
    setHasCopiedPassword(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setHasCopiedPassword(false), 2500);
  };

  return (
    <Card className="max-w-md mx-auto border-border shadow-2xl bg-card overflow-hidden">
      {/* Header */}
      <CardHeader className="text-center space-y-2 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-primary mx-auto flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
          <ShieldCheck className="w-7 h-7 text-emerald-300" />
        </div>
        <CardTitle className="text-2xl font-black tracking-tight">Customer Portal</CardTitle>
        <CardDescription className="text-xs max-w-xs mx-auto">
          Manage pest treatments, book appointments, view EPA certificates, and pay invoices online.
        </CardDescription>

        {/* Mode Selector Tabs (Sign In vs Create Account) */}
        {authMode !== "otp" && authMode !== "success" && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-xl mt-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAuthMode("signin")}
              className={`py-2 rounded-lg transition-all ${
                authMode === "signin"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`py-2 rounded-lg transition-all ${
                authMode === "signup"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>
        )}
      </CardHeader>

      {/* --------------------------------------------------------------------- */}
      {/* View 1: Sign In View */}
      {/* --------------------------------------------------------------------- */}
      {authMode === "signin" && (
        <CardContent className="space-y-4">
          {/* Social Sign In UI Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              className="text-xs h-10 font-semibold hover:bg-muted/80 border-border"
              onClick={() => handleSocialClick("google")}
            >
              <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              className="text-xs h-10 font-semibold hover:bg-muted/80 border-border"
              onClick={() => handleSocialClick("apple")}
            >
              <svg className="w-4 h-4 mr-2 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.56.65-.98 1.7-.85 2.72.99.08 2.03-.51 2.55-1.22z" />
              </svg>
              <span>Apple</span>
            </Button>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">Or with Email</span>
            </div>
          </div>

          {authMethod === "password" ? (
            <form onSubmit={handlePasswordLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-semibold">
                  Registered Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="h-10 text-xs pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-semibold">
                    Account Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => handleRequestOtp("login")}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Send One-Time Code
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your account password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-10 text-xs pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full font-bold h-10 shadow-md shadow-primary/20">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Sign In with Password
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMethod("otp")}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Don&apos;t remember password? <span className="text-primary font-bold">Sign in via Email Code</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="otp-email" className="text-xs font-semibold">
                  Enter Your Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    id="otp-email"
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="h-10 text-xs pl-9"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  We will send a 6-digit verification code to your inbox.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => handleRequestOtp("login")}
                disabled={loading}
                className="w-full font-bold h-10 shadow-md shadow-primary/20"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                Send 6-Digit Verification Code
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMethod("password")}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Remember your password? <span className="text-primary font-bold">Sign in with Password</span>
                </button>
              </div>
            </div>
          )}
        </CardContent>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* View 2: Sign Up View (First Name, Last Name, Email, Phone Number) */}
      {/* --------------------------------------------------------------------- */}
      {authMode === "signup" && (
        <CardContent className="space-y-3.5">
          {/* Quick Sign Up with Google / Apple */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              className="text-xs h-9 font-semibold hover:bg-muted/80 border-border"
              onClick={() => handleSocialClick("google")}
            >
              <svg className="w-3.5 h-3.5 mr-1.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              className="text-xs h-9 font-semibold hover:bg-muted/80 border-border"
              onClick={() => handleSocialClick("apple")}
            >
              <svg className="w-3.5 h-3.5 mr-1.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.56.65-.98 1.7-.85 2.72.99.08 2.03-.51 2.55-1.22z" />
              </svg>
              <span>Apple</span>
            </Button>
          </div>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">Or register with email</span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRequestOtp("signup");
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="reg-first-name" className="text-xs font-semibold">
                  First Name
                </Label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    id="reg-first-name"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-9 text-xs pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-last-name" className="text-xs font-semibold">
                  Last Name
                </Label>
                <Input
                  id="reg-last-name"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-email" className="text-xs font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="h-9 text-xs pl-8"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reg-phone" className="text-xs font-semibold">
                Phone Number (For Appointment SMS)
              </Label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  className="h-9 text-xs pl-8"
                  required
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-secondary/50 border border-border text-[11px] text-muted-foreground">
              🛡️ Upon verification, an <strong>auto-generated login password</strong> will be emailed to you instantly.
            </div>

            <Button type="submit" disabled={loading} className="w-full font-bold h-10 shadow-md shadow-primary/20">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Verification Code...
                </>
              ) : (
                <>
                  Verify &amp; Create Account <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* View 3: OTP Code Verification View */}
      {/* --------------------------------------------------------------------- */}
      {authMode === "otp" && (
        <CardContent className="space-y-4">
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-1">
            <Mail className="w-6 h-6 text-primary mx-auto" />
            <h4 className="font-bold text-sm text-foreground">
              {oauthProvider
                ? `${oauthProvider === "google" ? "Google" : "Apple"} Account Connected! 🎉`
                : "Check Your Email"}
            </h4>
            <p className="text-xs text-muted-foreground">
              We sent a 6-digit security code to:
            </p>
            <p className="text-xs font-bold text-primary font-mono">{otpTargetEmail}</p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1.5 text-center">
              <Label htmlFor="otp-input" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Enter 6-Digit Code
              </Label>
              <Input
                id="otp-input"
                type="text"
                maxLength={6}
                placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="h-12 text-center text-2xl font-mono tracking-[10px] font-black focus:ring-2 focus:ring-primary"
                autoFocus
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full font-bold h-10 shadow-md shadow-primary/20">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying Code...
                </>
              ) : (
                <>
                  Verify Code &amp; Activate Account <CheckCircle2 className="w-4 h-4 ml-2 text-emerald-300" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <button
                type="button"
                onClick={() => setAuthMode(otpPendingMode === "signup" ? "signup" : "signin")}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={() => handleRequestOtp(otpPendingMode)}
                className={`font-semibold ${
                  resendCooldown > 0 ? "opacity-50 cursor-not-allowed" : "text-primary hover:underline"
                }`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>
          </form>
        </CardContent>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* View 4: Success View (Shows Auto-generated Password & Redirects) */}
      {/* --------------------------------------------------------------------- */}
      {authMode === "success" && (
        <CardContent className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground">Account Verified! 🎉</h3>
            <p className="text-xs text-muted-foreground">
              Your customer account is active. We also emailed your login credentials.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/70 border border-border text-left space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Your Auto-Generated Password:
            </span>
            <div className="flex items-center justify-between bg-card p-2 rounded-lg border border-border">
              <span className="font-mono text-sm font-black text-foreground select-all">{createdPassword}</span>
              <Button type="button" variant="ghost" size="sm" onClick={handleCopyPassword} className="h-7 px-2">
                {hasCopiedPassword ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Save this password or change it anytime in your <strong>Portal Settings</strong>.
            </p>
          </div>

          <Button
            type="button"
            className="w-full font-bold h-10 shadow-md shadow-primary/20"
            onClick={() => {
              router.push("/portal");
              router.refresh();
            }}
          >
            Enter Customer Portal <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      )}

      {/* Footer */}
      <CardFooter className="flex flex-col border-t border-border pt-3 pb-3 gap-1.5 text-center bg-muted/20">
        <div className="flex items-center justify-center gap-3 text-xs">
          <Link href="/#free-tools" className="font-semibold text-primary hover:underline">
            Free AI Pest Scanner
          </Link>
          <span className="text-muted-foreground">&bull;</span>
          <Link href="/#pricing" className="font-semibold text-primary hover:underline">
            Price Calculator
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
