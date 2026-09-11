import type { MetadataRoute } from "next";
import { withCurrentUser } from "@/lib/auth";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://enkoremusic.online";

const STATIC_ROUTES = ["", "/musician-pre-register", "/partners"];

// Same routing-priority fix as robots.ts — see that file's comment.
// Every live musician's storefront gets a real sitemap entry; RLS's
// musician_select policy is public (storefronts are public pages), same
// as every other public musician query in this app, so withCurrentUser
// (anonymous context) is enough — no service role needed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const musicians = await withCurrentUser((tx) =>
    tx.musician.findMany({
      where: { isLive: true, storefrontUrl: { not: null } },
      select: { storefrontUrl: true, updatedAt: true },
    }),
  );

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const storefrontEntries: MetadataRoute.Sitemap = musicians.map((m) => ({
    url: `${SITE_URL}/${m.storefrontUrl}`,
    lastModified: m.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...storefrontEntries];
}
