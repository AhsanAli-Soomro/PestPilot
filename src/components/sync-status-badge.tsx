"use client";

import * as React from "react";
import { syncEngine, type SyncStatus } from "@/lib/offline/sync-engine";
import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";

export function SyncStatusBadge() {
  const [status, setStatus] = React.useState<SyncStatus>("online");
  const [pendingCount, setPendingCount] = React.useState(0);
  const [isManualSyncing, setIsManualSyncing] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newStatus, count) => {
      setStatus(newStatus);
      setPendingCount(count);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await syncEngine.sync();
    } finally {
      setIsManualSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleManualSync}
        disabled={status === "offline" || isManualSyncing}
        title={
          status === "offline"
            ? "Offline: changes are saved locally and will sync when reconnected"
            : `Status: ${status}. Click to sync now.`
        }
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all touch-target focus:outline-none"
        style={{
          backgroundColor:
            status === "offline"
              ? "hsl(var(--muted))"
              : status === "syncing" || isManualSyncing
              ? "hsl(var(--accent) / 0.15)"
              : "hsl(var(--primary) / 0.12)",
          borderColor:
            status === "offline"
              ? "hsl(var(--border))"
              : status === "syncing" || isManualSyncing
              ? "hsl(var(--accent))"
              : "hsl(var(--primary) / 0.3)",
          color:
            status === "offline"
              ? "hsl(var(--muted-foreground))"
              : status === "syncing" || isManualSyncing
              ? "hsl(var(--accent))"
              : "hsl(var(--primary))",
        }}
        aria-label={`Sync Status: ${status}, ${pendingCount} pending mutations`}
      >
        {status === "offline" ? (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline</span>
          </>
        ) : status === "syncing" || isManualSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing</span>
          </>
        ) : status === "error" ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
            <span>Sync Alert</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span>Online</span>
          </>
        )}

        {pendingCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-black font-bold rounded-full text-[10px]">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
}

