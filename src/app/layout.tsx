import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "PestPilot - Field-Service Management for Pest Control",
  description:
    "Quote, schedule, service, invoice, and send recurring reminders in one simple tool that works offline in the field.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PestPilot",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b4332",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <Providers>
          {children}
          <Toaster richColors position="bottom-right" />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
