"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Truck, Calendar, Users, Receipt, LayoutDashboard } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { name: "Today", href: "/mobile/today", icon: Truck, highlight: true },
    { name: "Schedule", href: "/schedule", icon: Calendar },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Invoices", href: "/invoices", icon: Receipt },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom shadow-lg"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all touch-target text-center min-w-[56px]",
                isActive
                  ? "text-primary font-bold"
                  : item.highlight
                  ? "text-amber-600 dark:text-amber-400 font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-lg",
                  isActive ? "bg-primary/10" : item.highlight ? "bg-amber-500/10" : ""
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5]" : "")} />
              </div>
              <span className="text-[11px] leading-tight mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

