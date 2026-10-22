import * as React from "react";
import { requireSuperAdmin } from "@/lib/admin";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  Users,
  Database,
  ArrowLeft,
  Crown,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Super Admin Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5" />
          <span>PESTPILOT MASTER SUPER ADMIN PORTAL • CONFIDENTIAL FOUNDER ACCESS ONLY</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span>Logged in as: {user.email}</span>
        </div>
      </div>

      {/* Super Admin Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-foreground flex items-center gap-2">
                PestPilot <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold uppercase tracking-wider">Super Admin</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Back to Client App Dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to App Dashboard</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
