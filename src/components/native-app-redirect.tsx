"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function NativeAppRedirect() {
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();
      const isAndroidWV = /PestPilotNative|Capacitor/i.test(navigator.userAgent);
      if (isCapacitor || isAndroidWV) {
        router.replace("/login");
      }
    }
  }, [router]);

  return null;
}
