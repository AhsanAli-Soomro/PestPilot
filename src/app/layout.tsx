import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "./globals.css";

const siteUrl = "https://pestpilots.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PestPilot - Modern Pest Control Field Service Management Software",
    template: "%s | PestPilot",
  },
  description:
    "Smart scheduling, dispatch, EPA chemical tracking, offline field apps, and customer billing for growing pest control fleets.",
  applicationName: "PestPilot",
  authors: [{ name: "PestPilot Technologies", url: siteUrl }],
  keywords: [
    "pest control software",
    "field service management",
    "pest control CRM",
    "EPA chemical tracking",
    "pest route dispatch",
    "pest control invoicing",
    "pest control app",
  ],
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "PestPilot",
    title: "PestPilot - Modern Pest Control Field Service Management Software",
    description:
      "Quote, schedule, service, invoice, and track EPA chemical logs with zero latency offline field apps.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "PestPilot - Field Service Management Software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PestPilot - Modern Pest Control Field Service Management Software",
    description:
      "Quote, schedule, service, invoice, and track EPA chemical logs with zero latency offline field apps.",
    images: ["/icon-512.png"],
  },
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
  maximumScale: 5,
  userScalable: true,
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "PestPilot",
      "operatingSystem": "Web, iOS, Android, macOS, Windows",
      "applicationCategory": "BusinessApplication",
      "offers": {
        "@type": "Offer",
        "price": "0.00",
        "priceCurrency": "USD",
      },
      "description":
        "All-in-one pest control field service management software with smart scheduling, dispatch, EPA chemical tracking, offline mobile app, and automated invoices.",
      "url": siteUrl,
      "screenshot": `${siteUrl}/icon-512.png`,
    },
    {
      "@type": "Organization",
      "name": "PestPilot Technologies",
      "url": siteUrl,
      "logo": `${siteUrl}/icon-512.png`,
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "support@pestpilot.app",
        "contactType": "customer service",
      },
    },
    {
      "@type": "WebSite",
      "name": "PestPilot",
      "url": siteUrl,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
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
