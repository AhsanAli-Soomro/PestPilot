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
      <div className="bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 truncate">
          <Crown className="w-3.5 h-3.5 shrink-0 text-amber-200" />
          <span className="truncate">PESTPILOT SUPER ADMIN • FOUNDER CONSOLE</span>
        </div>
        <div className="hidden md:flex items-center gap-3 shrink-0 text-amber-100">
          <span>{user.email}</span>
        </div>
      </div>

      {/* Super Admin Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur-md px-3 sm:px-8 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/admin" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-foreground flex items-center gap-1.5 truncate">
                PestPilot <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold uppercase tracking-wider">Admin</span>
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Back to Client App Dashboard */}
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to App</span>
            <span className="sm:hidden text-[11px]">App</span>
          </Link>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

