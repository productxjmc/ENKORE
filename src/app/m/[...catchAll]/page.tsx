import { notFound } from "next/navigation";

// Without this, an arbitrary unmatched path under /m (a typo, an old
// bookmark) has no route file to attribute it to /m's segment tree at
// all, so Next.js falls all the way up to the site-wide not-found.tsx
// instead of the mobile one at src/app/m/not-found.tsx — confirmed live
// (the same explicit notFound() call from a matched dynamic route, e.g.
// src/app/m/u/[slug]/page.tsx, already rendered the mobile version
// correctly; only a truly routeless path needed this catch-all).
export default function MobileCatchAll(): never {
  notFound();
}
