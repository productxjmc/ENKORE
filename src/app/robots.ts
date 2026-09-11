import type { MetadataRoute } from "next";

// Next's file-convention route — this and sitemap.ts both take routing
// priority over the [slug] dynamic catch-all automatically (a static/
// convention route always wins over a dynamic segment at the same
// path), which is what actually fixes the bug: before this file
// existed, /robots.txt had no matching route of its own, so it fell
// through to [slug]/page.tsx and rendered as a full HTML "musician not
// found" page instead of a robots directive file.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://enkoremusic.online";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api/", "/m/dash", "/m/payouts", "/m/profile", "/m/library", "/m/tickets", "/m/onboarding"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
