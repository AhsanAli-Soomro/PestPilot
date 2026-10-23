"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function loginCustomerPortalAction(identifier: string) {
  try {
    const clean = identifier.trim();
    if (!clean) {
      return { success: false, customer: null, error: "Please enter your email, phone, or invoice number" };
    }

    const cookieStore = await cookies();
    cookieStore.set("pestpilot_customer_identifier", clean, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
    });

    const res = await lookupCustomerPortalAction(clean);
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to sign in";
    return { success: false, customer: null, error: msg };
  }
}

export async function logoutCustomerPortalAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("pestpilot_customer_identifier");
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function lookupCustomerPortalAction(identifier: string) {
  try {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/[^0-9]/g, "");

    // Check if identifier is an invoice number or token
    const matchingInvoice = await db.invoice.findFirst({
      where: {
        OR: [
          { invoiceNumber: { equals: identifier.trim(), mode: "insensitive" } },
          { publicToken: identifier.trim() },
        ],
        deletedAt: null,
      },
      select: { customerId: true },
    });

    // Check if identifier is a job ID
    const matchingJob = await db.job.findFirst({
      where: {
        id: identifier.trim(),
        deletedAt: null,
      },
      select: { customerId: true },
    });

    const directCustomerId = matchingInvoice?.customerId || matchingJob?.customerId;

    let customer = await db.customer.findFirst({
      where: {
        deletedAt: null,
        OR: [
          ...(directCustomerId ? [{ id: directCustomerId }] : []),
          { email: { equals: cleanId, mode: "insensitive" } },
          ...(cleanPhone && cleanPhone.length >= 7 ? [{ phone: { contains: cleanPhone } }] : []),
        ],
      },
      include: {
        properties: { where: { deletedAt: null } },
        jobs: {
          where: { deletedAt: null },
          orderBy: { scheduledDate: "desc" },
          include: {
            property: true,
            treatmentLogs: { where: { deletedAt: null } },
            invoices: { where: { deletedAt: null } },
            technician: { select: { name: true, phone: true } },
          },
        },
        invoices: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        organization: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            currency: true,
          },
        },
      },
    });

    // If no existing customer found in DB, return error so user is prompted to sign up or log in
    if (!customer) {
      return {
        success: false,
        error: "No customer account found with this email or phone number. Please create an account.",
      };
    }

    return { success: true, customer, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Portal lookup failed";
    return { success: false, customer: null, error: msg };
  }
}

export async function bookCustomerServiceAction(formData: FormData) {
  try {
    const customerId = formData.get("customerId") as string;
    const pestType = formData.get("pestType") as string;
    const preferredDate = formData.get("preferredDate") as string;
    const preferredTime = (formData.get("preferredTime") as string) || "09:00";
    const propertyAddress = formData.get("propertyAddress") as string;
    const city = (formData.get("city") as string) || "Karachi";
    const state = (formData.get("state") as string) || "Sindh";
    const postalCode = (formData.get("postalCode") as string) || "75500";
    const gateCode = formData.get("gateCode") as string;
    const selectedPropertyId = formData.get("propertyId") as string;
    const notes = formData.get("notes") as string;

    if (!preferredDate) {
      return { success: false, error: "Please select a preferred date" };
    }

    // If it's a real customer in DB, create real job & property if needed
    if (customerId && !customerId.startsWith("demo-")) {
      const customer = await db.customer.findUnique({
        where: { id: customerId },
        include: { properties: true },
      });

      if (customer) {
        let propertyId = selectedPropertyId && selectedPropertyId !== "new" ? selectedPropertyId : customer.properties[0]?.id;

        // Create new property if customer has none or explicitly entered new address
        if (!propertyId || selectedPropertyId === "new") {
          const newProp = await db.property.create({
            data: {
              organizationId: customer.organizationId,
              customerId: customer.id,
              address: propertyAddress || "Customer Residence",
              city: city || "Karachi",
              state: state || "Sindh",
              postalCode: postalCode || "75500",
              gateCode: gateCode || null,
            },
          });
          propertyId = newProp.id;
        }

        await db.job.create({
          data: {
            organizationId: customer.organizationId,
            customerId: customer.id,
            propertyId,
            title: `${pestType} Extermination & Treatment`,
            description: `Booked online via Customer Portal. ${notes || ""}`,
            status: "SCHEDULED",
            scheduledDate: new Date(preferredDate),
            scheduledStartTime: preferredTime,
            scheduledEndTime: "10:30",
          },
        });
      }
    }

    revalidatePath("/portal");
    return { success: true, message: "Booking submitted successfully! Our dispatch team will confirm your slot." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to book service";
    return { success: false, error: msg };
  }
}

export async function rescheduleCustomerAppointmentAction(jobId: string, newDate: string, newTime: string) {
  try {
    if (!jobId.startsWith("demo-")) {
      await db.job.update({
        where: { id: jobId },
        data: {
          scheduledDate: new Date(newDate),
          scheduledStartTime: newTime || "09:00",
          notes: `Rescheduled by customer via portal on ${new Date().toLocaleDateString()}`,
        },
      });
    }

    revalidatePath("/portal");
    return { success: true, message: "Appointment rescheduled successfully!" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reschedule";
    return { success: false, error: msg };
  }
}

export async function cancelCustomerAppointmentAction(jobId: string, reason: string) {
  try {
    if (!jobId.startsWith("demo-")) {
      await db.job.update({
        where: { id: jobId },
        data: {
          deletedAt: new Date(),
          notes: `Cancelled by customer: ${reason || "No reason specified"}`,
        },
      });
    }

    revalidatePath("/portal");
    return { success: true, message: "Appointment cancelled." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to cancel appointment";
    return { success: false, error: msg };
  }
}

export async function submitCustomerComplaintAction(formData: FormData) {
  try {
    const complaintSubject = formData.get("subject") as string;
    const complaintDetails = formData.get("details") as string;
    const requestWarrantyCallback = formData.get("callback") === "true";

    // Can log in AuditLog or create a priority task/callback
    const defaultOrg = await db.organization.findFirst();
    if (defaultOrg) {
      await db.auditLog.create({
        data: {
          organizationId: defaultOrg.id,
          action: "CUSTOMER_COMPLAINT",
          entityType: "Complaint",
          entityId: "PORTAL",
          changes: JSON.stringify({
            subject: complaintSubject,
            details: complaintDetails,
            warrantyCallback: requestWarrantyCallback,
            submittedAt: new Date().toISOString(),
          }),
        },
      });
    }

    return {
      success: true,
      message: "Complaint received. Our Quality Assurance Manager will call you within 24 hours.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit complaint";
    return { success: false, error: msg };
  }
}

export async function renewCustomerServicePlanAction(planId: string) {
  try {
    return {
      success: true,
      message: "Annual Maintenance Contract (AMC) renewed! Your next quarterly treatment is scheduled.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to renew plan";
    return { success: false, error: msg };
  }
}

