import { headers } from "next/headers";

/**
 * Returns the dynamic base URL of the application.
 * Automatically adapts to whatever port or host the server is currently running on (localhost:3000, 3001, 3002, etc.)
 * In production, it respects NEXT_PUBLIC_APP_URL if provided with a custom domain.
 */
export async function getBaseUrl(): Promise<string> {
  // If in browser context:
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  // If running in production with a custom domain:
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/$/, "");
  }

  // Dynamically detect host and port from incoming HTTP request headers
  try {
    const headerList = await headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    const proto =
      headerList.get("x-forwarded-proto") ||
      (host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https");

    if (host) {
      return `${proto}://${host}`;
    }
  } catch {
    // Outside active request context (e.g. build time or background jobs without request headers)
  }

  return envUrl?.replace(/\/$/, "") || "http://localhost:3000";
}

/**
 * Synchronous client-safe helper for getting base URL
 */
export function getClientBaseUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

