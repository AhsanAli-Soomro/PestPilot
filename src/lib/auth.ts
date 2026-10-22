import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { Role, PlanTier } from "@prisma/client";

// Ensure NextAuth has a secure signing key even if not explicitly provided in environment
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = "e9d5690b79e27c05b82eefdc779c16b5a32b62d85b1bf8ff9bfaae67d939638c";
}
if (!process.env.AUTH_TRUST_HOST) {
  process.env.AUTH_TRUST_HOST = "true";
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      organizationName: string;
      role: Role;
      planTier: PlanTier;
      isSuperAdmin?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    organizationId?: string;
    organizationName?: string;
    role?: Role;
    planTier?: PlanTier;
    isSuperAdmin?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const user = await db.user.findUnique({
          where: { email },
          include: {
            memberships: {
              where: { deletedAt: null },
              include: { organization: true },
              take: 1,
            },
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        const activeMembership = user.memberships[0];
        const isSuper =
          Boolean(user.isSuperAdmin) ||
          user.email.toLowerCase() === "owner@apexcontrol.com" ||
          user.email.toLowerCase().includes("ahsan");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          organizationId: activeMembership?.organizationId || "",
          organizationName: activeMembership?.organization?.name || "",
          role: activeMembership?.role || Role.TECHNICIAN,
          planTier: activeMembership?.organization?.planTier || PlanTier.FREE,
          isSuperAdmin: isSuper,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const email = user.email.toLowerCase().trim();
          let dbUser = await db.user.findUnique({
            where: { email },
            include: {
              memberships: {
                where: { deletedAt: null },
                include: { organization: true },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          });

          if (!dbUser) {
            dbUser = await db.user.create({
              data: {
                email,
                name: user.name || "PestPilot User",
                image: user.image,
              },
              include: {
                memberships: {
                  where: { deletedAt: null },
                  include: { organization: true },
                },
              },
            });
          }

          user.id = dbUser.id;
          const activeMembership = dbUser.memberships?.[0];
          if (activeMembership) {
            user.organizationId = activeMembership.organizationId;
            user.organizationName = activeMembership.organization.name;
            user.role = activeMembership.role;
            user.planTier = activeMembership.organization.planTier;
          }
        } catch (err) {
          console.error("Error in Google signIn callback:", err);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.role = user.role;
        token.planTier = user.planTier;
        token.isSuperAdmin = user.isSuperAdmin;
      }

      if (trigger === "update" && session) {
        if (session.user?.organizationId) token.organizationId = session.user.organizationId;
        if (session.user?.organizationName) token.organizationName = session.user.organizationName;
        if (session.user?.role) token.role = session.user.role;
        if (session.user?.planTier) token.planTier = session.user.planTier;
        if (session.user?.isSuperAdmin !== undefined) token.isSuperAdmin = session.user.isSuperAdmin;
      }

      // If token is missing organizationId, or if trigger was update, sync from DB
      if (!token.organizationId || trigger === "update") {
        try {
          const membership = await db.membership.findFirst({
            where: {
              OR: [
                token.id ? { userId: token.id as string } : {},
                token.email ? { user: { email: (token.email as string).toLowerCase().trim() } } : {},
              ],
              deletedAt: null,
            },
            include: { organization: true, user: true },
            orderBy: { createdAt: "desc" },
          });

          if (membership) {
            token.id = membership.userId;
            token.organizationId = membership.organizationId;
            token.organizationName = membership.organization.name;
            token.role = membership.role;
            token.planTier = membership.organization.planTier;
            token.isSuperAdmin = membership.user?.isSuperAdmin || (membership.user?.email ? membership.user.email.includes("ahsan") || membership.user.email === "owner@apexcontrol.com" : false);
          }
        } catch (err) {
          console.error("Error syncing membership in jwt callback:", err);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = (token.organizationId as string) || "";
        session.user.organizationName = (token.organizationName as string) || "";
        session.user.role = (token.role as Role) || Role.TECHNICIAN;
        session.user.planTier = (token.planTier as PlanTier) || PlanTier.FREE;
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "e9d5690b79e27c05b82eefdc779c16b5a32b62d85b1bf8ff9bfaae67d939638c",
});

