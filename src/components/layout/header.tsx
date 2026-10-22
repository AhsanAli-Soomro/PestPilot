"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { SyncStatusBadge } from "@/components/sync-status-badge";
import {
  ShieldCheck,
  LogOut,
  Building2,
  User,
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  Truck,
  Users,
  FileSpreadsheet,
  Receipt,
  Repeat,
  FileCheck2,
  Bell,
  Settings,
  Crown,
  Download,
  Laptop,
  UserPlus,
  Boxes,
  AlertOctagon,
  Globe,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { InstallAppModal } from "@/components/install-app-modal";

interface HeaderProps {
  organizationName?: string;
  userName?: string | null;
  userEmail?: string | null;
  role?: string;
  isSuperAdmin?: boolean;
}

export function Header({ organizationName, userName, userEmail, role, isSuperAdmin }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [installModalOpen, setInstallModalOpen] = React.useState(false);
  const pathname = usePathname();

  const allNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Today's Jobs (Field)", href: "/mobile/today", icon: Truck, highlight: true },
    { name: "Schedule & Route", href: "/schedule", icon: Calendar },
    { name: "Customers (CRM)", href: "/customers", icon: Users },
    { name: "Leads & Inquiries", href: "/leads", icon: UserPlus },
    { name: "Quotes", href: "/quotes", icon: FileSpreadsheet },
    { name: "Invoices", href: "/invoices", icon: Receipt },
    { name: "Recurring Plans (AMC)", href: "/service-plans", icon: Repeat },
    { name: "Chemicals & Inventory", href: "/inventory", icon: Boxes },
    { name: "Complaints & Warranty", href: "/complaints", icon: AlertOctagon },
    { name: "Compliance Reports", href: "/reports", icon: FileCheck2 },
    { name: "Reminders & WhatsApp", href: "/reminders", icon: Bell },
    { name: "Customer Portal", href: "/portal", icon: Globe },
    { name: "Settings & Team", href: "/settings", icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur-md">
        {/* Mobile & Tablet Menu Button + Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors touch-target focus:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="font-bold text-base text-foreground lg:hidden">
              Pest<span className="text-amber-500">Pilot</span>
            </span>
          </div>

          {organizationName && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-xs font-semibold text-foreground">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{organizationName}</span>
            </div>
          )}
        </div>

        {/* Right Actions: Sync Status, Install App, Theme Toggle, User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setInstallModalOpen(true)}
            title="Download Offline App for Mac, PC & Android"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted/60 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Install App</span>
          </button>
          <SyncStatusBadge />
          <ThemeToggle />

          {/* User Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-card hover:bg-muted/60 transition-colors touch-target focus:outline-none"
              aria-expanded={dropdownOpen}
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
                {userName ? userName.slice(0, 2) : <User className="w-4 h-4" />}
              </div>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl z-50 text-sm animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="font-semibold text-foreground truncate">{userName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {role || "TECHNICIAN"}
                    </span>
                  </div>

                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-muted/60 transition-colors touch-target"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Settings & Team
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setInstallModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-foreground hover:bg-muted/60 transition-colors touch-target text-left"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    Install App / APK
                  </button>

                  {isSuperAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-500/10 transition-colors touch-target"
                    >
                      <Crown className="w-4 h-4 text-amber-500" />
                      Super Admin Portal
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors touch-target font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Drawer (Accessible on mobile and tablet screens) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-card border-r border-border p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <span className="font-extrabold text-base tracking-tight text-foreground block">
                      Pest<span className="text-amber-500">Pilot</span>
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground block -mt-0.5">
                      {organizationName || "Field Service SaaS"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
                {allNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all touch-target select-none",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                          : item.highlight
                          ? "text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                      )}
                    >
                      <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-foreground" : "")} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm font-bold touch-target hover:bg-amber-500/25 transition-all shadow-sm"
                >
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>Super Admin Portal</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  signOut({ callbackUrl: "/login" });
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold touch-target hover:bg-destructive/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Desktop / Mobile Installation Modal */}
      <InstallAppModal
        isOpen={installModalOpen}
        onClose={() => setInstallModalOpen(false)}
      />
    </>
  );
}

