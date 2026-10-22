import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { localDb } from "@/lib/offline/db";
import { syncEngine } from "@/lib/offline/sync-engine";

describe("PestPilot Offline Sync Engine Unit Tests", () => {
  beforeEach(async () => {
    // Clear all test tables in fake-indexeddb
    await localDb.outbox.clear();
    await localDb.jobs.clear();
    await localDb.treatmentLogs.clear();
    await localDb.payments.clear();
    await localDb.conflictsLog.clear();
    await localDb.syncMeta.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("queues mutations in the Dexie outbox with correct initial attempts", async () => {
    const mutationId = await syncEngine.queueMutation(
      "job",
      "UPDATE",
      {
        id: "job-123",
        status: "IN_PROGRESS",
      },
      false
    );

    expect(mutationId).toBeDefined();
    const count = await localDb.outbox.count();
    expect(count).toBe(1);

    const queued = await localDb.outbox.get(mutationId);
    expect(queued?.entity).toBe("job");
    expect(queued?.action).toBe("UPDATE");
    expect(queued?.attempts).toBe(0);
    expect(queued?.payload.status).toBe("IN_PROGRESS");
  });

  it("handles duplicate mutations idempotently without corrupting outbox", async () => {
    const mutationId1 = await syncEngine.queueMutation(
      "job",
      "UPDATE",
      {
        id: "job-456",
        status: "EN_ROUTE",
      },
      false
    );

    const mutationId2 = await syncEngine.queueMutation(
      "job",
      "UPDATE",
      {
        id: "job-456",
        status: "IN_PROGRESS",
      },
      false
    );

    const pending = await localDb.outbox.toArray();
    expect(pending.length).toBe(2);
    const pendingIds = pending.map((p) => p.id);
    expect(pendingIds).toContain(mutationId1);
    expect(pendingIds).toContain(mutationId2);
  });

  it("retries failed pushes and increments attempt counter with error log", async () => {
    // Mock fetch failure
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    });

    const mutationId = await syncEngine.queueMutation(
      "job",
      "UPDATE",
      {
        id: "job-failed",
        status: "COMPLETED",
      },
      false
    );

    // Run sync
    const result = await syncEngine.sync();
    expect(result.success).toBe(false);

    const queued = await localDb.outbox.get(mutationId);
    expect(queued?.attempts).toBe(1);
    expect(queued?.lastError).toContain("503");
  });

  it("removes processed mutations and records server conflict resolution", async () => {
    const mutationId = await syncEngine.queueMutation(
      "job",
      "UPDATE",
      {
        id: "job-conflict",
        version: 1,
        status: "COMPLETED",
      },
      false
    );

    // Mock fetch push returning processedIds and a conflict
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/sync/push")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              processedIds: [mutationId],
              conflicts: [
                {
                  entity: "job",
                  entityId: "job-conflict",
                  serverVersion: 2,
                  clientVersion: 1,
                  resolution: "Server version retained (Last-write-wins)",
                },
              ],
            }),
        });
      }
      if (url.includes("/api/sync/pull")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jobs: [],
              customers: [],
              properties: [],
              treatmentLogs: [],
              invoices: [],
              currentCursor: new Date().toISOString(),
            }),
        });
      }
      return Promise.reject(new Error("Unknown route"));
    });

    const result = await syncEngine.sync();
    expect(result.success).toBe(true);
    expect(result.pushed).toBe(1);

    // Outbox should be empty
    const outboxCount = await localDb.outbox.count();
    expect(outboxCount).toBe(0);

    // Conflicts log should contain record
    const conflicts = await localDb.conflictsLog.toArray();
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].entityId).toBe("job-conflict");
    expect(conflicts[0].serverVersion).toBe(2);
  });

  it("preserves append-only TreatmentLog locally without overwriting previous logs", async () => {
    const log1 = {
      id: "log-1",
      organizationId: "org-1",
      jobId: "job-100",
      technicianId: "tech-1",
      pestType: "Termites",
      chemicalProduct: "Taurus SC",
      epaRegistrationNumber: "53883-279",
      quantity: "4 gal",
      areasTreated: "Exterior perimeter foundation trench",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    const log2 = {
      id: "log-2",
      organizationId: "org-1",
      jobId: "job-100",
      technicianId: "tech-1",
      pestType: "Roaches",
      chemicalProduct: "Advion Gel",
      epaRegistrationNumber: "100-1484",
      quantity: "5 spots",
      areasTreated: "Kitchen plumbing void",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    await localDb.treatmentLogs.add(log1);
    await localDb.treatmentLogs.add(log2);

    const storedLogs = await localDb.treatmentLogs.where("jobId").equals("job-100").toArray();
    expect(storedLogs.length).toBe(2);
    expect(storedLogs.map((l) => l.pestType)).toContain("Termites");
    expect(storedLogs.map((l) => l.pestType)).toContain("Roaches");
  });

  it("pulls server changes and updates local store and sync cursor", async () => {
    const serverTimestamp = "2026-10-20T12:00:00.000Z";

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/sync/pull")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jobs: [
                {
                  id: "server-job-1",
                  organizationId: "org-1",
                  customerId: "cust-1",
                  propertyId: "prop-1",
                  title: "Quarterly Defense",
                  status: "SCHEDULED",
                  scheduledDate: "2026-10-21T09:00:00.000Z",
                  routeOrder: 1,
                  customerName: "Alice Miller",
                  customerPhone: "555-1234",
                  propertyAddress: "123 Elm St",
                  updatedAt: serverTimestamp,
                  version: 1,
                },
              ],
              customers: [],
              properties: [],
              treatmentLogs: [],
              invoices: [],
              currentCursor: serverTimestamp,
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ processedIds: [] }) });
    });

    const result = await syncEngine.sync();
    expect(result.success).toBe(true);
    expect(result.pulled).toBe(1);

    const savedJob = await localDb.jobs.get("server-job-1");
    expect(savedJob?.title).toBe("Quarterly Defense");
    expect(savedJob?.customerName).toBe("Alice Miller");

    const cursor = await localDb.syncMeta.get("lastPullCursor");
    expect(cursor?.value).toBe(serverTimestamp);
  });
});
