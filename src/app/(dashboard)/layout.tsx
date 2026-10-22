import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { checkIsSuperAdmin } from "@/lib/admin";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // If user doesn't have an active organization, redirect to onboarding
  if (!user.organizationId) {
    redirect("/onboarding");
  }

  const isSuper = checkIsSuperAdmin(user);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Sidebar role={user.role} isSuperAdmin={isSuper} />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          organizationName={user.organizationName}
          userName={user.name}
          userEmail={user.email}
          role={user.role}
          isSuperAdmin={isSuper}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

