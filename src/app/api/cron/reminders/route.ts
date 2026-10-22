import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, sendSms } from "@/lib/notifications";
import { formatMoney, formatDate } from "@/lib/utils";
import { ReminderType, ReminderChannel, ReminderStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // 1. Authorize CRON_SECRET
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "cron_super_secret_token_12345";

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const results = {
      appointmentRemindersSent: 0,
      invoiceOverdueRemindersSent: 0,
      serviceDueRemindersSent: 0,
      errors: [] as string[],
    };

    // 2. APPOINTMENTS TOMORROW
    const tomorrowJobs = await db.job.findMany({
      where: {
        scheduledDate: { gte: tomorrow, lt: dayAfterTomorrow },
        status: "SCHEDULED",
        deletedAt: null,
      },
      include: {
        customer: true,
        property: true,
        organization: true,
      },
    });

    for (const job of tomorrowJobs) {
      const subject = `Reminder: Pest Control Service Tomorrow from ${job.organization.name}`;
      const body = `Hi ${job.customer.firstName}, this is a friendly reminder that your pest control service is scheduled for tomorrow (${formatDate(job.scheduledDate)}) at ${job.property.address}. Please ensure gates are unlocked and pets are secured.`;

      // Check if reminder already logged
      const existing = await db.reminder.findFirst({
        where: {
          jobId: job.id,
          type: ReminderType.APPOINTMENT_TOMORROW,
          scheduledFor: { gte: tomorrow, lt: dayAfterTomorrow },
        },
      });

      if (!existing) {
        const emailRes = await sendEmail({
          to: job.customer.email,
          subject,
          html: `<p>${body}</p>`,
        });

        // Also attempt SMS if phone available
        if (job.customer.phone) {
          await sendSms({
            to: job.customer.phone,
            message: `${job.organization.name}: Your service is scheduled for tomorrow at ${job.property.address}. Reply STOP to cancel.`,
          });
        }

        await db.reminder.create({
          data: {
            organizationId: job.organizationId,
            customerId: job.customerId,
            jobId: job.id,
            type: ReminderType.APPOINTMENT_TOMORROW,
            channel: ReminderChannel.EMAIL,
            status: emailRes.success ? ReminderStatus.SENT : ReminderStatus.FAILED,
            scheduledFor: now,
            sentAt: emailRes.success ? new Date() : null,
            recipientEmail: job.customer.email,
            recipientPhone: job.customer.phone,
            subject,
            body,
            errorMessage: emailRes.error || null,
          },
        });

        if (emailRes.success) results.appointmentRemindersSent++;
      }
    }

    // 3. OVERDUE INVOICES
    const overdueInvoices = await db.invoice.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
        deletedAt: null,
      },
      include: {
        customer: true,
        organization: true,
      },
    });

    for (const inv of overdueInvoices) {
      // Mark as OVERDUE if still SENT
      if (inv.status === "SENT") {
        await db.invoice.update({
          where: { id: inv.id },
          data: { status: "OVERDUE", version: { increment: 1 } },
        });
      }

      const balanceCents = Math.max(0, inv.totalCents - inv.paidCents);
      const appUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const payUrl = `${appUrl}/invoice/${inv.publicToken}`;

      const subject = `Overdue Notice: Invoice ${inv.invoiceNumber} from ${inv.organization.name}`;
      const body = `Dear ${inv.customer.firstName}, invoice ${inv.invoiceNumber} was due on ${formatDate(inv.dueDate)}. Outstanding balance: ${formatMoney(balanceCents, inv.organization.currency)}. Please pay online: ${payUrl}`;

      // Check if reminder sent recently (within last 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentReminder = await db.reminder.findFirst({
        where: {
          invoiceId: inv.id,
          type: ReminderType.INVOICE_OVERDUE,
          createdAt: { gte: sevenDaysAgo },
        },
      });

      if (!recentReminder) {
        const emailRes = await sendEmail({
          to: inv.customer.email,
          subject,
          html: `<p>${body}</p><p><a href="${payUrl}">Click here to pay now</a></p>`,
        });

        await db.reminder.create({
          data: {
            organizationId: inv.organizationId,
            customerId: inv.customerId,
            invoiceId: inv.id,
            type: ReminderType.INVOICE_OVERDUE,
            channel: ReminderChannel.EMAIL,
            status: emailRes.success ? ReminderStatus.SENT : ReminderStatus.FAILED,
            scheduledFor: now,
            sentAt: emailRes.success ? new Date() : null,
            recipientEmail: inv.customer.email,
            recipientPhone: inv.customer.phone,
            subject,
            body,
            errorMessage: emailRes.error || null,
          },
        });

        if (emailRes.success) results.invoiceOverdueRemindersSent++;
      }
    }

    // 4. RECURRING SERVICE DUE SOON (Within 7 Days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const duePlans = await db.servicePlan.findMany({
      where: {
        nextServiceDate: { gte: now, lte: sevenDaysFromNow },
        active: true,
        deletedAt: null,
      },
      include: {
        property: { include: { customer: true } },
        organization: true,
      },
    });

    for (const plan of duePlans) {
      const subject = `Upcoming Service Renewal: ${plan.name}`;
      const body = `Hi ${plan.property.customer.firstName}, your recurring pest service (${plan.name}) is coming up around ${formatDate(plan.nextServiceDate)}.`;

      const existing = await db.reminder.findFirst({
        where: {
          customerId: plan.property.customerId,
          type: ReminderType.SERVICE_DUE,
          createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        const emailRes = await sendEmail({
          to: plan.property.customer.email,
          subject,
          html: `<p>${body}</p>`,
        });

        await db.reminder.create({
          data: {
            organizationId: plan.organizationId,
            customerId: plan.property.customerId,
            type: ReminderType.SERVICE_DUE,
            channel: ReminderChannel.EMAIL,
            status: emailRes.success ? ReminderStatus.SENT : ReminderStatus.FAILED,
            scheduledFor: now,
            sentAt: emailRes.success ? new Date() : null,
            recipientEmail: plan.property.customer.email,
            subject,
            body,
          },
        });

        if (emailRes.success) results.serviceDueRemindersSent++;
      }
    }

    return NextResponse.json({
      success: true,
      executedAt: now.toISOString(),
      summary: results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Cron reminders failed";
    console.error("[Cron Reminders Error]:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

