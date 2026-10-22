"use server";

import { getScopedDb } from "@/lib/session";
import { db } from "@/lib/db";
import { jobSchema, treatmentLogSchema, servicePlanSchema } from "@/lib/validations";
import { checkPlanLimits } from "@/lib/stripe";
import { JobStatus, ReminderType, ReminderChannel, ReminderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendEmail, sendSms } from "@/lib/notifications";
import { formatMoney, formatDate } from "@/lib/utils";
import { getBaseUrl } from "@/lib/url";

export async function createJobAction(rawData: {
  customerId: string;
  propertyId: string;
  servicePlanId?: string | null;
  technicianId?: string | null;
  title: string;
  description?: string | null;
  scheduledDate: string;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  routeOrder?: number;
  notes?: string | null;
}) {
  try {
    const scopedDb = await getScopedDb();

    // Check plan limits (Free plan 20 jobs/month)
    const limitCheck = await checkPlanLimits(scopedDb.organizationId, "jobs");
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.reason };
    }

    const validated = jobSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const job = await scopedDb.jobs.create({
      customerId: validated.data.customerId,
      propertyId: validated.data.propertyId,
      servicePlanId: validated.data.servicePlanId || null,
      technicianId: validated.data.technicianId || null,
      title: validated.data.title,
      description: validated.data.description || null,
      status: validated.data.status,
      scheduledDate: new Date(validated.data.scheduledDate),
      scheduledStartTime: validated.data.scheduledStartTime || null,
      scheduledEndTime: validated.data.scheduledEndTime || null,
      routeOrder: validated.data.routeOrder || 0,
      notes: validated.data.notes || null,
    });

    await scopedDb.logAudit("CREATE", "Job", job.id, { title: job.title, date: job.scheduledDate });

    revalidatePath("/schedule");
    revalidatePath("/mobile/today");
    revalidatePath(`/customers/${validated.data.customerId}`);
    return { success: true, jobId: job.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create job";
    return { success: false, error: msg };
  }
}

export async function updateJobStatusAction(jobId: string, status: JobStatus) {
  try {
    const scopedDb = await getScopedDb();

    const updateData: { status: JobStatus; completedAt?: Date } = { status };
    if (status === JobStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const job = await scopedDb.jobs.update(jobId, updateData);
    await scopedDb.logAudit("UPDATE_STATUS", "Job", jobId, { status });

    revalidatePath("/schedule");
    revalidatePath("/mobile/today");
    return { success: true, job };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update job status";
    return { success: false, error: msg };
  }
}

export async function rescheduleJobAction(
  jobId: string,
  scheduledDate: string,
  scheduledStartTime?: string | null,
  routeOrder?: number
) {
  try {
    const scopedDb = await getScopedDb();

    await scopedDb.jobs.update(jobId, {
      scheduledDate: new Date(scheduledDate),
      scheduledStartTime: scheduledStartTime || null,
      routeOrder: routeOrder ?? 0,
    });

    revalidatePath("/schedule");
    revalidatePath("/mobile/today");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to reschedule job";
    return { success: false, error: msg };
  }
}

export async function submitTreatmentLogAction(rawData: {
  jobId: string;
  pestType: string;
  chemicalProduct: string;
  epaRegistrationNumber: string;
  quantity: string;
  areasTreated: string;
  applicatorName?: string | null;
  licenseNumber?: string | null;
  technicianSignature?: string | null;
  photos?: string | null;
  windSpeed?: string | null;
  temperature?: string | null;
  notes?: string | null;
}) {
  try {
    const scopedDb = await getScopedDb();

    const validated = treatmentLogSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const job = await scopedDb.jobs.findUnique(validated.data.jobId);
    if (!job) throw new Error("Job not found");

    // 1. Create TreatmentLog (append-only)
    const treatmentLog = await scopedDb.treatmentLogs.create({
      jobId: validated.data.jobId,
      technicianId: scopedDb.userId,
      pestType: validated.data.pestType,
      chemicalProduct: validated.data.chemicalProduct,
      epaRegistrationNumber: validated.data.epaRegistrationNumber,
      quantity: validated.data.quantity,
      areasTreated: validated.data.areasTreated,
      applicatorName: validated.data.applicatorName || scopedDb.userName || "Technician",
      licenseNumber: validated.data.licenseNumber || null,
      technicianSignature: validated.data.technicianSignature || null,
      photos: validated.data.photos || null,
      windSpeed: validated.data.windSpeed || null,
      temperature: validated.data.temperature || null,
      notes: validated.data.notes || null,
    });

    // 2. Mark job as COMPLETED
    await scopedDb.jobs.update(job.id, {
      status: JobStatus.COMPLETED,
      completedAt: new Date(),
    });

    // 3. Auto-invoice on completion if associated with ServicePlan or requested
    if (job.servicePlanId) {
      const plan = await db.servicePlan.findUnique({ where: { id: job.servicePlanId } });
      if (plan && plan.autoInvoice) {
        const org = await scopedDb.getOrganization();
        const invoiceNumber = `${org?.invoicePrefix || "INV-"}${org?.nextInvoiceNum || 1001}`;
        if (org) {
          await scopedDb.updateOrganization({ nextInvoiceNum: org.nextInvoiceNum + 1 });
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14); // Net 14

        await scopedDb.invoices.create(
          {
            customerId: job.customerId,
            jobId: job.id,
            invoiceNumber,
            dueDate,
            notes: `Auto-generated for recurring service: ${plan.name}`,
          },
          [
            {
              description: `Completed Service: ${plan.name}`,
              quantity: 1,
              unitPriceCents: plan.priceCents,
            },
          ]
        );

        // 4. Advance next recurring service date for the plan
        const nextDate = new Date();
        if (plan.frequency === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);
        else if (plan.frequency === "QUARTERLY") nextDate.setMonth(nextDate.getMonth() + 3);
        else if (plan.frequency === "BIANNUAL") nextDate.setMonth(nextDate.getMonth() + 6);
        else nextDate.setFullYear(nextDate.getFullYear() + 1);

        await db.servicePlan.update({
          where: { id: plan.id },
          data: { nextServiceDate: nextDate, version: { increment: 1 } },
        });

        // Auto-generate next future job
        await scopedDb.jobs.create({
          customerId: job.customerId,
          propertyId: job.propertyId,
          servicePlanId: plan.id,
          technicianId: job.technicianId,
          title: `Recurring: ${plan.name}`,
          scheduledDate: nextDate,
          scheduledStartTime: job.scheduledStartTime,
          scheduledEndTime: job.scheduledEndTime,
          status: JobStatus.SCHEDULED,
        });
      }
    }

    await scopedDb.logAudit("CREATE", "TreatmentLog", treatmentLog.id, {
      chemical: treatmentLog.chemicalProduct,
      pest: treatmentLog.pestType,
    });

    revalidatePath("/mobile/today");
    revalidatePath("/schedule");
    revalidatePath("/reports");
    return { success: true, logId: treatmentLog.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to submit treatment log";
    return { success: false, error: msg };
  }
}

export async function createServicePlanAction(rawData: {
  propertyId: string;
  name: string;
  description?: string | null;
  frequency: "MONTHLY" | "QUARTERLY" | "BIANNUAL" | "ANNUAL";
  priceCents: number;
  nextServiceDate: string;
  autoInvoice?: boolean;
}) {
  try {
    const scopedDb = await getScopedDb();

    const validated = servicePlanSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const property = await scopedDb.properties.findUnique(validated.data.propertyId);
    if (!property) throw new Error("Property not found");

    const plan = await scopedDb.servicePlans.create({
      propertyId: validated.data.propertyId,
      name: validated.data.name,
      description: validated.data.description || null,
      frequency: validated.data.frequency,
      priceCents: validated.data.priceCents,
      nextServiceDate: new Date(validated.data.nextServiceDate),
      autoInvoice: validated.data.autoInvoice ?? true,
    });

    // Generate initial scheduled job for this service plan
    await scopedDb.jobs.create({
      customerId: property.customerId,
      propertyId: property.id,
      servicePlanId: plan.id,
      title: `Recurring Service: ${plan.name}`,
      scheduledDate: new Date(validated.data.nextServiceDate),
      scheduledStartTime: "09:00",
      status: JobStatus.SCHEDULED,
    });

    await scopedDb.logAudit("CREATE", "ServicePlan", plan.id, { name: plan.name });

    revalidatePath("/service-plans");
    revalidatePath("/schedule");
    return { success: true, planId: plan.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create service plan";
    return { success: false, error: msg };
  }
}

export async function triggerManualRemindersAction() {
  try {
    const scopedDb = await getScopedDb();
    const orgId = scopedDb.organizationId;
    const org = await scopedDb.getOrganization();

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const appUrl = await getBaseUrl();
    let sentCount = 0;

    // 1. Tomorrow's appointments
    const upcomingJobs = await db.job.findMany({
      where: {
        organizationId: orgId,
        scheduledDate: { gte: tomorrow, lt: dayAfterTomorrow },
        status: JobStatus.SCHEDULED,
        deletedAt: null,
      },
      include: { customer: true, property: true },
    });

    for (const job of upcomingJobs) {
      const subject = `Pest Service Reminder: Appointment Tomorrow with ${org?.name || "PestPilot"}`;
      const body = `Hi ${job.customer.firstName}, your pest service appointment is scheduled for tomorrow (${formatDate(job.scheduledDate)}) at ${job.property.address}. Please ensure pets are secured and gate codes are accessible.`;

      await sendEmail({ to: job.customer.email, subject, html: `<p>${body}</p>` });
      if (job.customer.phone) {
        await sendSms({ to: job.customer.phone, message: body });
      }

      await db.reminder.create({
        data: {
          organizationId: orgId,
          customerId: job.customerId,
          jobId: job.id,
          type: ReminderType.APPOINTMENT_TOMORROW,
          channel: ReminderChannel.EMAIL,
          scheduledFor: now,
          sentAt: now,
          recipientEmail: job.customer.email,
          recipientPhone: job.customer.phone,
          status: ReminderStatus.SENT,
          subject,
          body,
        },
      });
      sentCount++;
    }

    // 2. Overdue Invoices
    const overdueInvoices = await db.invoice.findMany({
      where: {
        organizationId: orgId,
        dueDate: { lt: now },
        status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
        deletedAt: null,
      },
      include: { customer: true },
    });

    for (const inv of overdueInvoices) {
      const balanceCents = Math.max(0, inv.totalCents - inv.paidCents);
      const payUrl = `${appUrl}/invoice/${inv.publicToken}`;
      const subject = `Notice: Invoice ${inv.invoiceNumber} from ${org?.name || "PestPilot"}`;
      const body = `Hi ${inv.customer.firstName}, invoice ${inv.invoiceNumber} has an outstanding balance of ${formatMoney(balanceCents, org?.currency || "USD")}. Review and pay online: ${payUrl}`;

      await sendEmail({ to: inv.customer.email, subject, html: `<p>${body}</p>` });
      await db.reminder.create({
        data: {
          organizationId: orgId,
          customerId: inv.customerId,
          invoiceId: inv.id,
          type: ReminderType.INVOICE_OVERDUE,
          channel: ReminderChannel.EMAIL,
          scheduledFor: now,
          sentAt: now,
          recipientEmail: inv.customer.email,
          recipientPhone: inv.customer.phone,
          status: ReminderStatus.SENT,
          subject,
          body,
        },
      });
      sentCount++;
    }

    revalidatePath("/reminders");
    return { success: true, count: sentCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to dispatch reminders";
    return { success: false, error: msg };
  }
}

