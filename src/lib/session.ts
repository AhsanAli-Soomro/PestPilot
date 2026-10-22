import { auth } from "./auth";
import { db } from "./db";
import { getTenantDb, type TenantContext } from "./tenant";
import { Role, PlanTier } from "@prisma/client";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;

  // Fallback: If session user doesn't have organizationId yet (e.g. freshly created org or stale token),
  // sync directly from database active membership
  if (!session.user.organizationId && (session.user.id || session.user.email)) {
    try {
      const membership = await db.membership.findFirst({
        where: {
          OR: [
            session.user.id ? { userId: session.user.id } : {},
            session.user.email ? { user: { email: session.user.email.toLowerCase().trim() } } : {},
          ],
          deletedAt: null,
        },
        include: { organization: true },
        orderBy: { createdAt: "desc" },
      });

      if (membership) {
        session.user.id = membership.userId;
        session.user.organizationId = membership.organizationId;
        session.user.organizationName = membership.organization.name;
        session.user.role = membership.role as Role;
        session.user.planTier = membership.organization.planTier as PlanTier;
      }
    } catch (err) {
      console.error("Error looking up active membership in getCurrentUser:", err);
    }
  }

  return session.user;
}

export async function requireAuth(): Promise<TenantContext> {
  const user = await getCurrentUser();
  if (!user || !user.id || !user.organizationId) {
    throw new Error("Unauthorized: Active session and organization required");
  }

  return {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role as Role,
    userEmail: user.email || "",
    userName: user.name,
  };
}

export async function getScopedDb() {
  const context = await requireAuth();
  return getTenantDb(context);
}

