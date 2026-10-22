import { localDb, type OutboxMutation, type ConflictRecord } from "./db";

function getApiUrl(path: string): string {
  if (typeof window !== "undefined" && window.location?.origin && !window.location.origin.startsWith("null")) {
    try {
      return new URL(path, window.location.origin).toString();
    } catch {
      return `http://localhost:3000${path}`;
    }
  }
  return `http://localhost:3000${path}`;
}

export type SyncStatus = "online" | "offline" | "syncing" | "error";

export interface SyncListener {
  (status: SyncStatus, pendingCount: number): void;
}

class SyncEngine {
  private status: SyncStatus = "online";
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.status = navigator.onLine ? "online" : "offline";
      window.addEventListener("online", () => this.handleOnline());
      window.addEventListener("offline", () => this.handleOffline());

      // Periodic check & sync every 30 seconds
      this.intervalTimer = setInterval(() => {
        if (navigator.onLine) {
          this.sync();
        }
      }, 30000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  private async notify() {
    let pendingCount = 0;
    try {
      pendingCount = await localDb.outbox.count();
    } catch {
      pendingCount = 0;
    }
    this.listeners.forEach((listener) => listener(this.status, pendingCount));
  }

  private handleOnline() {
    this.status = "online";
    this.notify();
    this.sync();
  }

  private handleOffline() {
    this.status = "offline";
    this.notify();
  }

  public async getPendingCount(): Promise<number> {
    try {
      return await localDb.outbox.count();
    } catch {
      return 0;
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  /**
   * Push all pending mutations from outbox, then pull latest changes
   */
  public async sync(): Promise<{ success: boolean; pushed: number; pulled: number }> {
    if (this.isSyncing) return { success: false, pushed: 0, pulled: 0 };
    if (typeof window !== "undefined" && !navigator.onLine) {
      this.status = "offline";
      this.notify();
      return { success: false, pushed: 0, pulled: 0 };
    }

    this.isSyncing = true;
    this.status = "syncing";
    this.notify();

    let pushedCount = 0;
    let pulledCount = 0;

    try {
      // 1. PUSH OUTBOX
      const pendingMutations = await localDb.outbox.orderBy("timestamp").toArray();
      if (pendingMutations.length > 0) {
        const response = await fetch(getApiUrl("/api/sync/push"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mutations: pendingMutations }),
        });

        if (response.ok) {
          const result = await response.json();
          // Remove processed mutations from outbox
          const processedIds: string[] = result.processedIds || [];
          if (processedIds.length > 0) {
            await localDb.outbox.bulkDelete(processedIds);
            pushedCount = processedIds.length;
          }

          // Handle any conflicts reported by server
          if (result.conflicts && Array.isArray(result.conflicts)) {
            for (const conflict of result.conflicts) {
              const record: ConflictRecord = {
                id: crypto.randomUUID(),
                entity: conflict.entity,
                entityId: conflict.entityId,
                serverVersion: conflict.serverVersion,
                clientVersion: conflict.clientVersion,
                resolvedAt: new Date().toISOString(),
                resolution: conflict.resolution || "Server version accepted (Last-write-wins)",
              };
              await localDb.conflictsLog.add(record);
            }
          }
        } else {
          // Increment attempts on failures for exponential backoff
          for (const mut of pendingMutations) {
            await localDb.outbox.update(mut.id, {
              attempts: mut.attempts + 1,
              lastError: `HTTP ${response.status}`,
            });
          }
          this.status = "error";
          return { success: false, pushed: 0, pulled: 0 };
        }
      }

      // 2. PULL CHANGES
      try {
        const metaCursor = await localDb.syncMeta.get("lastPullCursor");
        const since = metaCursor?.value || "1970-01-01T00:00:00.000Z";

        const pullResponse = await fetch(getApiUrl(`/api/sync/pull?since=${encodeURIComponent(since)}`));
        if (pullResponse.ok) {
          const data = await pullResponse.json();

          // Apply incoming server updates
          if (data.jobs && data.jobs.length > 0) {
            await localDb.jobs.bulkPut(data.jobs);
            pulledCount += data.jobs.length;
          }
          if (data.customers && data.customers.length > 0) {
            await localDb.customers.bulkPut(data.customers);
            pulledCount += data.customers.length;
          }
          if (data.properties && data.properties.length > 0) {
            await localDb.properties.bulkPut(data.properties);
            pulledCount += data.properties.length;
          }
          if (data.treatmentLogs && data.treatmentLogs.length > 0) {
            await localDb.treatmentLogs.bulkPut(data.treatmentLogs);
            pulledCount += data.treatmentLogs.length;
          }
          if (data.invoices && data.invoices.length > 0) {
            await localDb.invoices.bulkPut(data.invoices);
            pulledCount += data.invoices.length;
          }

          // Update cursor
          if (data.currentCursor) {
            await localDb.syncMeta.put({ key: "lastPullCursor", value: data.currentCursor });
          }
        }
      } catch (pullErr) {
        console.warn("[Sync Engine]: Background pull skipped (offline or network error):", pullErr);
      }

      this.status = "online";
      return { success: true, pushed: pushedCount, pulled: pulledCount };
    } catch (err) {
      console.warn("[Sync Engine]: Sync cycle error:", err);
      this.status = "error";
      try {
        const pendingMutations = await localDb.outbox.toArray();
        for (const mut of pendingMutations) {
          await localDb.outbox.update(mut.id, {
            attempts: mut.attempts + 1,
            lastError: err instanceof Error ? err.message : "Network error",
          });
        }
      } catch {}
      return { success: false, pushed: pushedCount, pulled: pulledCount };
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  /**
   * Enqueue a local mutation into Dexie outbox
   */
  public async queueMutation(
    entity: OutboxMutation["entity"],
    action: OutboxMutation["action"],
    payload: Record<string, unknown>,
    autoSync = true
  ): Promise<string> {
    const mutationId = crypto.randomUUID();
    const mutation: OutboxMutation = {
      id: mutationId,
      entity,
      action,
      payload,
      timestamp: Date.now(),
      attempts: 0,
      lastError: null,
    };

    await localDb.outbox.add(mutation);
    this.notify();

    // Trigger sync in background if online and autoSync is enabled
    if (autoSync && typeof window !== "undefined" && navigator.onLine) {
      this.sync().catch(console.error);
    }

    return mutationId;
  }
}

export const syncEngine = new SyncEngine();
