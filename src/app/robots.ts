import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://pestpilots.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/terms",
          "/privacy",
          "/login",
          "/signup",
          "/portal",
          "/verify/",
          "/quote/",
          "/invoice/",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/customers/",
          "/leads/",
          "/invoices/",
          "/quotes/",
          "/inventory/",
          "/service-plans/",
          "/reminders/",
          "/reports/",
          "/complaints/",
          "/settings/",
          "/schedule/",
          "/onboarding/",
          "/mobile/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

