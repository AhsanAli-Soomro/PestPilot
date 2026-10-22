"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
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
  ShieldCheck,
  Crown,
} from "lucide-react";

interface SidebarProps {
  role?: string;
  isSuperAdmin?: boolean;
  className?: string;
}

export function Sidebar({ role, isSuperAdmin, className }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Today's Jobs (Field)", href: "/mobile/today", icon: Truck, highlight: true },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Quotes", href: "/quotes", icon: FileSpreadsheet },
    { name: "Invoices", href: "/invoices", icon: Receipt },
    { name: "Recurring Plans", href: "/service-plans", icon: Repeat },
    { name: "Compliance Reports", href: "/reports", icon: FileCheck2 },
    { name: "Reminders", href: "/reminders", icon: Bell },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-64 border-r border-border bg-card/60 backdrop-blur-md p-4 justify-between h-screen sticky top-0",
        className
      )}
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-1">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-foreground block">
              Pest<span className="text-amber-500">Pilot</span>
            </span>
            <span className="text-[11px] font-medium text-muted-foreground block -mt-1">
              Field Service SaaS
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
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
                {item.highlight && !isActive && (
                  <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
                    Field
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Super Admin Link & Role Pill */}
      <div className="pt-4 border-t border-border px-2 space-y-2">
        {isSuperAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shadow-sm"
          >
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Super Admin Portal</span>
          </Link>
        )}
        <div className="rounded-xl bg-secondary/50 p-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Logged Role</p>
            <p className="text-xs font-bold text-foreground capitalize">{role?.toLowerCase() || "Technician"}</p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </aside>
  );
}

