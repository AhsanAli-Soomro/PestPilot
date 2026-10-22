import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { OutboxMutation } from "@/lib/offline/db";
import { JobStatus, PaymentMethod } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { organizationId } = user;
    const body = await req.json();
    const mutations: OutboxMutation[] = body.mutations || [];

    const processedIds: string[] = [];
    const conflicts: Array<{
      entity: string;
      entityId: string;
      serverVersion: number;
      clientVersion: number;
      resolution: string;
    }> = [];

    for (const mutation of mutations) {
      const { id: mutationId, entity, action, payload } = mutation;
      const entityId = (payload.id as string) || "";

      try {
        if (entity === "treatmentLog") {
          // Append-only: never overwritten
          const existing = await db.treatmentLog.findUnique({ where: { id: entityId } });
          if (!existing) {
            await db.treatmentLog.create({
              data: {
                id: entityId,
                organizationId,
                jobId: payload.jobId as string,
                technicianId: user.id,
                pestType: payload.pestType as string,
                chemicalProduct: payload.chemicalProduct as string,
                epaRegistrationNumber: payload.epaRegistrationNumber as string,
                quantity: payload.quantity as string,
                areasTreated: payload.areasTreated as string,
                applicatorName: (payload.applicatorName as string) || user.name || "Technician",
                licenseNumber: (payload.licenseNumber as string) || null,
                technicianSignature: (payload.technicianSignature as string) || null,
                photos: payload.photos ? JSON.stringify(payload.photos) : null,
                notes: (payload.notes as string) || null,
                windSpeed: (payload.windSpeed as string) || null,
                temperature: (payload.temperature as string) || null,
              },
            });
          }
          processedIds.push(mutationId);
          continue;
        }

        if (entity === "payment") {
          // Append-only: never overwritten
          const existing = await db.payment.findUnique({ where: { id: entityId } });
          if (!existing) {
            const invoice = await db.invoice.findFirst({
              where: { id: payload.invoiceId as string, organizationId },
            });
            if (invoice) {
              const amountCents = Number(payload.amountCents);
              await db.payment.create({
                data: {
                  id: entityId,
                  invoiceId: invoice.id,
                  amountCents,
                  method: (payload.method as PaymentMethod) || PaymentMethod.CASH,
                  reference: (payload.reference as string) || null,
                  notes: (payload.notes as string) || null,
                  paidAt: payload.paidAt ? new Date(payload.paidAt as string) : new Date(),
                },
              });

              const newPaidCents = invoice.paidCents + amountCents;
              await db.invoice.update({
                where: { id: invoice.id },
                data: {
                  paidCents: newPaidCents,
                  status: newPaidCents >= invoice.totalCents ? "PAID" : "PARTIALLY_PAID",
                  version: { increment: 1 },
                },
              });
            }
          }
          processedIds.push(mutationId);
          continue;
        }

        if (entity === "job") {
          const clientVersion = (payload.version as number) || 1;
          const existing = await db.job.findFirst({
            where: { id: entityId, organizationId },
          });

          if (existing) {
            // Check version conflict
            if (existing.version > clientVersion) {
              conflicts.push({
                entity: "job",
                entityId,
                serverVersion: existing.version,
                clientVersion,
                resolution: "Server version retained (server version newer)",
              });
              processedIds.push(mutationId);
              continue;
            }

            // Apply updates
            await db.job.update({
              where: { id: entityId },
              data: {
                status: (payload.status as JobStatus) || existing.status,
                completedAt: payload.completedAt ? new Date(payload.completedAt as string) : existing.completedAt,
                notes: (payload.notes as string) !== undefined ? (payload.notes as string) : existing.notes,
                version: { increment: 1 },
              },
            });
          }
          processedIds.push(mutationId);
          continue;
        }

        // Generic catch-all processed
        processedIds.push(mutationId);
      } catch (mutationErr) {
        console.error(`[Sync Push] Error processing mutation ${mutationId}:`, mutationErr);
      }
    }

    return NextResponse.json({
      success: true,
      processedIds,
      conflicts,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync push failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

