"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role, PlanTier } from "@prisma/client";
import { onboardingSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/session";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUserAction(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name") as string,
      email: (formData.get("email") as string)?.toLowerCase().trim(),
      password: formData.get("password") as string,
    };

    const validated = registerSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const existingUser = await db.user.findUnique({
      where: { email: validated.data.email },
    });

    if (existingUser) {
      return { success: false, error: "An account with this email already exists" };
    }

    const passwordHash = await bcrypt.hash(validated.data.password, 10);

    const user = await db.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        passwordHash,
      },
    });

    return { success: true, userId: user.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Registration failed";
    return { success: false, error: msg };
  }
}

export async function completeOnboardingAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id) {
      return { success: false, error: "Authentication required" };
    }

    const rawData = {
      companyName: formData.get("companyName") as string,
      currency: (formData.get("currency") as string) || "USD",
      timezone: (formData.get("timezone") as string) || "America/New_York",
      taxRatePercent: formData.get("taxRatePercent") ? Number(formData.get("taxRatePercent")) : 0,
      customerFirstName: formData.get("customerFirstName") as string,
      customerLastName: formData.get("customerLastName") as string,
      customerEmail: formData.get("customerEmail") as string,
      customerPhone: formData.get("customerPhone") as string,
      propertyAddress: formData.get("propertyAddress") as string,
      propertyCity: formData.get("propertyCity") as string,
      propertyState: formData.get("propertyState") as string,
      propertyPostalCode: formData.get("propertyPostalCode") as string,
    };

    const validated = onboardingSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const {
      companyName,
      currency,
      timezone,
      taxRatePercent,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      propertyAddress,
      propertyCity,
      propertyState,
      propertyPostalCode,
    } = validated.data;

    const slug = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create organization, membership, first customer, and first property in a transaction
    const result = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: companyName,
          slug,
          currency,
          timezone,
          taxRatePercent,
          planTier: PlanTier.FREE,
          subscription: {
            create: {
              plan: PlanTier.FREE,
              status: "active",
            },
          },
        },
      });

      await tx.membership.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: Role.OWNER,
          inviteAccepted: true,
        },
      });

      const customer = await tx.customer.create({
        data: {
          organizationId: org.id,
          firstName: customerFirstName,
          lastName: customerLastName,
          email: customerEmail,
          phone: customerPhone,
          tags: "Residential, First Customer",
          notes: "Created during initial PestPilot onboarding",
        },
      });

      const property = await tx.property.create({
        data: {
          organizationId: org.id,
          customerId: customer.id,
          address: propertyAddress,
          city: propertyCity,
          state: propertyState,
          postalCode: propertyPostalCode,
          country: "US",
          notes: "Initial service address",
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          action: "CREATE",
          entityType: "Organization",
          entityId: org.id,
          changes: JSON.stringify({ name: companyName, firstCustomerId: customer.id, firstPropertyId: property.id }),
        },
      });

      return { org, customer, property };
    });

    return { success: true, organizationId: result.org.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Onboarding failed";
    return { success: false, error: msg };
  }
}

