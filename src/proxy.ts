import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { GEO_COOKIE, normalizeCountry } from "@/lib/geo";

// Dashboard/admin routes require a signed-in user; storefronts, checkout,
// and lead-gen forms stay public by product design (see the RLS notes in
// prisma/rls.sql — those tables are public-read or public-insert).
//
// `(/.*)?` (not `(.*)`) so each pattern matches only the base path and its
// sub-paths, not any path that merely starts with the same letters — a bare
// `(.*)` on "/api/musician(.*)" silently matched /api/musician-pre-register
// too, sending an unrelated public lead-gen form's submissions through a
// Clerk sign-in redirect. Confirmed the bug by curl, not assumed.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(/.*)?",
  "/admin(/.*)?",
  "/partners(/.*)?",
  "/api/musician(/.*)?",
  "/api/admin(/.*)?",
  "/api/partners/activate",
]);

// Next.js 16 renamed Middleware to Proxy — this file must be named
// `proxy.ts` (not `middleware.ts`) at the same level as `app/` for the
// framework to pick it up at all; the exported name can stay `proxy` or
// default. See node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
export const proxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  const response = NextResponse.next();

  // Cache the visitor's country once, at the edge, so pricing.config.ts's
  // resolveCurrency() can pick ZAR/USD without a client-side flash.
  if (!req.cookies.get(GEO_COOKIE)) {
    const country = normalizeCountry(
      req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry"),
    );
    if (country) {
      response.cookies.set(GEO_COOKIE, country, {
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
