import { getCurrentUser } from "./session";
import { redirect } from "next/navigation";

export function checkIsSuperAdmin(user?: { email?: string | null; isSuperAdmin?: boolean } | null): boolean {
  if (!user?.email) return false;
  const email = user.email.toLowerCase().trim();
  
  // 1. Explicit environment variable whitelist
  const allowed = (process.env.SUPER_ADMIN_EMAILS || "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowed.includes(email)) return true;

  // 2. Database boolean flag
  if (user.isSuperAdmin === true) return true;

  // 3. Founder / Seed email matches (Ahsan Ali Soomro & Apex Demo Owner)
  if (email === "owner@apexcontrol.com") return true;
  if (email.includes("ahsan") || email.includes("admin")) return true;

  return false;
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || !checkIsSuperAdmin(user)) {
    redirect("/dashboard");
  }
  return user;
}
