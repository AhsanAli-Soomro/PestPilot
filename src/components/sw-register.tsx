"use client";

import * as React from "react";

export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[Service Worker] Registered successfully:", reg.scope);
        })
        .catch((err) => {
          console.warn("[Service Worker] Registration error:", err);
        });
    }
  }, []);

  return null;
}

