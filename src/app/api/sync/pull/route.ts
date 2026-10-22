import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId, id: userId, role } = user;
    const { searchParams } = new URL(req.url);
    const sinceParam = searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : new Date(0);

    // If technician, filter jobs to their assignments
    const jobTechnicianFilter = role === Role.TECHNICIAN ? { technicianId: userId } : {};

    const [jobs, customers, properties, treatmentLogs, invoices] = await Promise.all([
      db.job.findMany({
        where: {
          organizationId,
          updatedAt: { gt: since },
          ...jobTechnicianFilter,
        },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
          property: { select: { address: true, gateCode: true, petsKidsWarnings: true } },
        },
      }),
      db.customer.findMany({
        where: {
          organizationId,
          updatedAt: { gt: since },
        },
      }),
      db.property.findMany({
        where: {
          organizationId,
          updatedAt: { gt: since },
        },
      }),
      db.treatmentLog.findMany({
        where: {
          organizationId,
          updatedAt: { gt: since },
          ...(role === Role.TECHNICIAN ? { technicianId: userId } : {}),
        },
      }),
      db.invoice.findMany({
        where: {
          organizationId,
          updatedAt: { gt: since },
        },
      }),
    ]);

    // Format jobs with flat properties for local IndexedDB fast rendering
    const formattedJobs = jobs.map((j) => ({
      id: j.id,
      organizationId: j.organizationId,
      customerId: j.customerId,
      propertyId: j.propertyId,
      technicianId: j.technicianId,
      title: j.title,
      description: j.description,
      status: j.status,
      scheduledDate: j.scheduledDate.toISOString(),
      scheduledStartTime: j.scheduledStartTime,
      scheduledEndTime: j.scheduledEndTime,
      routeOrder: j.routeOrder,
      completedAt: j.completedAt ? j.completedAt.toISOString() : null,
      notes: j.notes,
      customerName: j.customer ? `${j.customer.firstName || ""} ${j.customer.lastName || ""}`.trim() : "Unknown Customer",
      customerPhone: j.customer?.phone || null,
      propertyAddress: j.property?.address || "Address not provided",
      gateCode: j.property?.gateCode || null,
      petsKidsWarnings: j.property?.petsKidsWarnings || null,
      updatedAt: j.updatedAt.toISOString(),
      version: j.version,
      deletedAt: j.deletedAt ? j.deletedAt.toISOString() : null,
    }));

    const formattedCustomers = customers.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      firstName: c.firstName,
      lastName: c.lastName,
      companyName: c.companyName,
      email: c.email,
      phone: c.phone,
      tags: c.tags,
      notes: c.notes,
      updatedAt: c.updatedAt.toISOString(),
      version: c.version,
      deletedAt: c.deletedAt ? c.deletedAt.toISOString() : null,
    }));

    const formattedProperties = properties.map((p) => ({
      id: p.id,
      organizationId: p.organizationId,
      customerId: p.customerId,
      address: p.address,
      unit: p.unit,
      city: p.city,
      state: p.state,
      postalCode: p.postalCode,
      gateCode: p.gateCode,
      petsKidsWarnings: p.petsKidsWarnings,
      notes: p.notes,
      updatedAt: p.updatedAt.toISOString(),
      version: p.version,
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
    }));

    const formattedTreatmentLogs = treatmentLogs.map((t) => ({
      id: t.id,
      organizationId: t.organizationId,
      jobId: t.jobId,
      technicianId: t.technicianId,
      pestType: t.pestType,
      chemicalProduct: t.chemicalProduct,
      epaRegistrationNumber: t.epaRegistrationNumber,
      quantity: t.quantity,
      areasTreated: t.areasTreated,
      applicatorName: t.applicatorName,
      licenseNumber: t.licenseNumber,
      technicianSignature: t.technicianSignature,
      photos: t.photos,
      notes: t.notes,
      windSpeed: t.windSpeed,
      temperature: t.temperature,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      version: t.version,
    }));

    const formattedInvoices = invoices.map((inv) => ({
      id: inv.id,
      organizationId: inv.organizationId,
      customerId: inv.customerId,
      jobId: inv.jobId,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      subtotalCents: inv.subtotalCents,
      taxCents: inv.taxCents,
      totalCents: inv.totalCents,
      paidCents: inv.paidCents,
      dueDate: inv.dueDate.toISOString(),
      publicToken: inv.publicToken,
      notes: inv.notes,
      updatedAt: inv.updatedAt.toISOString(),
      version: inv.version,
      deletedAt: inv.deletedAt ? inv.deletedAt.toISOString() : null,
    }));

    return NextResponse.json({
      jobs: formattedJobs,
      customers: formattedCustomers,
      properties: formattedProperties,
      treatmentLogs: formattedTreatmentLogs,
      invoices: formattedInvoices,
      currentCursor: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync pull failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

