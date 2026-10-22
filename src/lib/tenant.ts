import { db } from "./db";
import { Role, Prisma } from "@prisma/client";

export interface TenantContext {
  organizationId: string;
  userId: string;
  role: Role;
  userEmail: string;
  userName?: string | null;
}

/**
 * Creates scoped queries for a specific tenant and role context.
 * Guarantees that every query enforces organizationId and role restrictions.
 */
export function getTenantDb(context: TenantContext) {
  const { organizationId, userId, role, userName, userEmail } = context;

  if (!organizationId) {
    throw new Error("Multi-tenancy violation: missing organizationId in tenant context");
  }

  return {
    organizationId,
    userId,
    role,
    userName,
    userEmail,

    // Permissions helpers
    isOwner: role === Role.OWNER,
    isAdminOrOwner: role === Role.OWNER || role === Role.ADMIN,
    isTechnician: role === Role.TECHNICIAN,

    // Scope helper for where clauses
    scopeWhere<T extends Record<string, unknown>>(whereClause: T = {} as T) {
      return {
        ...whereClause,
        organizationId,
        deletedAt: null,
      };
    },

    // Organization
    async getOrganization() {
      return db.organization.findUnique({
        where: { id: organizationId },
        include: { subscription: true },
      });
    },

    async updateOrganization(data: Parameters<typeof db.organization.update>[0]["data"]) {
      if (role !== Role.OWNER && role !== Role.ADMIN) {
        throw new Error("Unauthorized: Only owners or admins can update organization settings");
      }
      return db.organization.update({
        where: { id: organizationId },
        data: {
          ...data,
          version: { increment: 1 },
        },
      });
    },

    // Customers
    customers: {
      async findMany(args?: Parameters<typeof db.customer.findMany>[0]) {
        return db.customer.findMany({
          ...args,
          where: {
            ...args?.where,
            organizationId,
            deletedAt: null,
          },
          orderBy: args?.orderBy ?? { updatedAt: "desc" },
        });
      },

      async findUnique(id: string) {
        return db.customer.findFirst({
          where: { id, organizationId, deletedAt: null },
          include: {
            properties: {
              where: { deletedAt: null },
            },
            jobs: {
              where: { deletedAt: null },
              orderBy: { scheduledDate: "desc" },
              take: 10,
            },
            invoices: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
            },
            quotes: {
              where: { deletedAt: null },
              orderBy: { createdAt: "desc" },
            },
          },
        });
      },

      async create(data: Omit<Prisma.CustomerUncheckedCreateInput, "organizationId">) {
        return db.customer.create({
          data: {
            ...data,
            organizationId,
          },
        });
      },

      async update(id: string, data: Parameters<typeof db.customer.update>[0]["data"]) {
        const existing = await db.customer.findFirst({ where: { id, organizationId, deletedAt: null } });
        if (!existing) throw new Error("Customer not found or unauthorized");
        return db.customer.update({
          where: { id },
          data: {
            ...data,
            version: { increment: 1 },
          },
        });
      },

      async softDelete(id: string) {
        const existing = await db.customer.findFirst({ where: { id, organizationId, deletedAt: null } });
        if (!existing) throw new Error("Customer not found or unauthorized");
        return db.customer.update({
          where: { id },
          data: { deletedAt: new Date(), version: { increment: 1 } },
        });
      },
    },

    // Properties
    properties: {
      async findMany(args?: Parameters<typeof db.property.findMany>[0]) {
        return db.property.findMany({
          ...args,
          where: {
            ...args?.where,
            organizationId,
            deletedAt: null,
          },
          include: {
            customer: true,
            servicePlans: { where: { deletedAt: null } },
            ...args?.include,
          },
        });
      },

      async findUnique(id: string) {
        return db.property.findFirst({
          where: { id, organizationId, deletedAt: null },
          include: {
            customer: true,
            servicePlans: { where: { deletedAt: null } },
            jobs: {
              where: { deletedAt: null },
              orderBy: { scheduledDate: "desc" },
            },
          },
        });
      },

      async create(data: Omit<Prisma.PropertyUncheckedCreateInput, "organizationId">) {
        return db.property.create({
          data: {
            ...data,
            organizationId,
          },
        });
      },

      async update(id: string, data: Parameters<typeof db.property.update>[0]["data"]) {
        const existing = await db.property.findFirst({ where: { id, organizationId, deletedAt: null } });
        if (!existing) throw new Error("Property not found or unauthorized");
        return db.property.update({
          where: { id },
          data: {
            ...data,
            version: { increment: 1 },
          },
        });
      },

      async softDelete(id: string) {
        const existing = await db.property.findFirst({ where: { id, organizationId, deletedAt: null } });
        if (!existing) throw new Error("Property not found or unauthorized");
        return db.property.update({
          where: { id },
          data: { deletedAt: new Date(), version: { increment: 1 } },
        });
      },
    },

    // Jobs
    jobs: {
      async findMany(args?: Parameters<typeof db.job.findMany>[0]) {
        // Enforce technician assignment scope
        const technicianScope = role === Role.TECHNICIAN ? { technicianId: userId } : {};

        return db.job.findMany({
          ...args,
          where: {
            ...args?.where,
            ...technicianScope,
            organizationId,
            deletedAt: null,
          },
          include: {
            customer: true,
            property: true,
            technician: {
              select: { id: true, name: true, email: true, phone: true },
            },
            treatmentLogs: {
              where: { deletedAt: null },
            },
            ...args?.include,
          },
          orderBy: args?.orderBy ?? { scheduledDate: "asc" },
        });
      },

      async findUnique(id: string) {
        const technicianScope = role === Role.TECHNICIAN ? { technicianId: userId } : {};
        return db.job.findFirst({
          where: {
            id,
            organizationId,
            ...technicianScope,
            deletedAt: null,
          },
          include: {
            customer: true,
            property: true,
            technician: {
              select: { id: true, name: true, email: true, phone: true },
            },
            treatmentLogs: {
              where: { deletedAt: null },
            },
            invoices: {
              where: { deletedAt: null },
            },
          },
        });
      },

      async create(data: Omit<Prisma.JobUncheckedCreateInput, "organizationId">) {
        return db.job.create({
          data: {
            ...data,
            organizationId,
          },
        });
      },

      async update(id: string, data: Parameters<typeof db.job.update>[0]["data"]) {
        const technicianScope = role === Role.TECHNICIAN ? { technicianId: userId } : {};
        const existing = await db.job.findFirst({
          where: { id, organizationId, ...technicianScope, deletedAt: null },
        });
        if (!existing) throw new Error("Job not found or unauthorized");

        return db.job.update({
          where: { id },
          data: {
            ...data,
            version: { increment: 1 },
          },
        });
      },

      async softDelete(id: string) {
        if (role === Role.TECHNICIAN) {
          throw new Error("Technicians cannot delete jobs");
        }
        const existing = await db.job.findFirst({ where: { id, organizationId, deletedAt: null } });
        if (!existing) throw new Error("Job not found or unauthorized");

        return db.job.update({
          where: { id },
          data: { deletedAt: new Date(), version: { increment: 1 } },
        });
      },
    },

    // Treatment Logs (Append-only)
    treatmentLogs: {
      async findMany(args?: Parameters<typeof db.treatmentLog.findMany>[0]) {
        return db.treatmentLog.findMany({
          ...args,
          where: {
            ...args?.where,
            organizationId,
            deletedAt: null,
          },
          include: {
            job: {
              include: { customer: true, property: true },
            },
            technician: {
              select: { id: true, name: true, licenseNumber: true },
            },
            ...args?.include,
          },
          orderBy: { createdAt: "desc" },
        });
      },

      async create(data: Omit<Prisma.TreatmentLogUncheckedCreateInput, "organizationId">) {
        return db.treatmentLog.create({
          data: {
            ...data,
            organizationId,
          },
        });
      },
    },

    // Quotes
    quotes: {
      async findMany(args?: Parameters<typeof db.quote.findMany>[0]) {
        return db.quote.findMany({
          ...args,
          where: {
            ...args?.where,
            organizationId,
            deletedAt: null,
          },
          include: {
            customer: true,
            property: true,
            lineItems: true,
            ...args?.include,
          },
          orderBy: args?.orderBy ?? { createdAt: "desc" },
        });
      },

      async findUnique(id: string) {
        return db.quote.findFirst({
          where: { id, organizationId, deletedAt: null },
          include: {
            customer: true,
            property: true,
            lineItems: true,
            invoice: true,
          },
        });
      },

      async create(
        quoteData: Omit<Prisma.QuoteUncheckedCreateInput, "organizationId" | "subtotalCents" | "taxCents" | "totalCents">,
        lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>
      ) {
        const subtotalCents = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPriceCents, 0);
        const org = await db.organization.findUnique({ where: { id: organizationId } });
        const taxRate = org?.taxRatePercent ? org.taxRatePercent / 100 : 0;
        const taxCents = Math.round(subtotalCents * taxRate);
        const totalCents = subtotalCents + taxCents;

        return db.quote.create({
          data: {
            ...quoteData,
            subtotalCents,
            taxCents,
            totalCents,
            organizationId,
            lineItems: {
              create: lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
                totalCents: item.quantity * item.unitPriceCents,
              })),
            },
          },
          include: {
            lineItems: true,
            customer: true,
          },
        });
      },

      async update(id: string, data: Parameters<typeof db.quote.update>[0]["data"]) {
        const existing = await db.quote.findFirst({ where: { id, organizationId, deletedAt: null } });
        if (!existing) throw new Error("Quote not found or unauthorized");
        return db.quote.update({
          where: { id },
          data: {
            ...data,
            version: { increment: 1 },
          },
        });
      },
    },

    // Invoices & Payments
    invoices: {
      async findMany(args?: Parameters<typeof db.invoice.findMany>[0]) {
        return db.invoice.findMany({
          ...args,
          where: {
            ...args?.where,
            organizationId,
            deletedAt: null,
          },
          include: {
            customer: true,
            job: true,
            payments: true,
            lineItems: true,
            ...args?.include,
          },
          orderBy: args?.orderBy ?? { createdAt: "desc" },
        });
      },

      async findUnique(id: string) {
        return db.invoice.findFirst({
          where: { id, organizationId, deletedAt: null },
          include: {
            customer: true,
            job: { include: { property: true } },
            payments: { orderBy: { paidAt: "desc" } },
            lineItems: true,
            quote: true,
          },
        });
      },

      async create(
        invoiceData: Omit<Prisma.InvoiceUncheckedCreateInput, "organizationId" | "subtotalCents" | "taxCents" | "totalCents">,
        lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>
      ) {
        const subtotalCents = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPriceCents, 0);
        const org = await db.organization.findUnique({ where: { id: organizationId } });
        const taxRate = org?.taxRatePercent ? org.taxRatePercent / 100 : 0;
        const taxCents = Math.round(subtotalCents * taxRate);
        const totalCents = subtotalCents + taxCents;

        return db.invoice.create({
          data: {
            ...invoiceData,
            subtotalCents,
            taxCents,
            totalCents,
            organizationId,
            lineItems: {
              create: lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPriceCents: item.unitPriceCents,
                totalCents: item.quantity * item.unitPriceCents,
              })),
            },
          },
          include: {
            lineItems: true,
            payments: true,
            customer: true,
          },
        });
      },

      async addPayment(invoiceId: string, amountCents: number, method: Parameters<typeof db.payment.create>[0]["data"]["method"], reference?: string, notes?: string) {
        const invoice = await db.invoice.findFirst({
          where: { id: invoiceId, organizationId, deletedAt: null },
        });
        if (!invoice) throw new Error("Invoice not found");

        const payment = await db.payment.create({
          data: {
            invoiceId,
            amountCents,
            method,
            reference,
            notes,
          },
        });

        const newPaidCents = invoice.paidCents + amountCents;
        const newStatus = newPaidCents >= invoice.totalCents ? "PAID" : "PARTIALLY_PAID";

        await db.invoice.update({
          where: { id: invoiceId },
          data: {
            paidCents: newPaidCents,
            status: newStatus,
            version: { increment: 1 },
          },
        });

        return payment;
      },
    },

    // Service Plans
    servicePlans: {
      async findMany(args?: Parameters<typeof db.servicePlan.findMany>[0]) {
        return db.servicePlan.findMany({
          ...args,
          where: {
            ...args?.where,
            organizationId,
            deletedAt: null,
          },
          include: {
            property: { include: { customer: true } },
            ...args?.include,
          },
        });
      },
      async create(data: Omit<Prisma.ServicePlanUncheckedCreateInput, "organizationId">) {
        return db.servicePlan.create({
          data: {
            ...data,
            organizationId,
          },
        });
      },
    },

    // Audit Logging
    async logAudit(action: string, entityType: string, entityId: string, changes?: Record<string, unknown>) {
      return db.auditLog.create({
        data: {
          organizationId,
          userId,
          action,
          entityType,
          entityId,
          changes: changes ? JSON.stringify(changes) : null,
        },
      });
    },
  };
}
