import Link from "next/link";
import { SearchX } from "lucide-react";

// Renders within the /m layout (Next's App Router wraps a segment's
// not-found.tsx in that segment's own layout.tsx), so it already gets
// the .enkore-m design tokens, header, and bottom nav for free — this
// file only needs the page content, matching the same eyebrow/heading/
// muted-body/CTA shape every other /m page uses (e.g. src/app/m/library).
export default function MobileNotFound() {
  return (
    <div className="flex flex-col items-center p-4 py-16 text-center">
      <SearchX className="h-8 w-8" style={{ color: "var(--m-text-faint)" }} />
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>
        404
      </p>
      <h1 className="mt-2 text-[22px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em]">
        This page went quiet.
      </h1>
      <p className="mt-3 max-w-[36ch] text-[13px] leading-[1.5]" style={{ color: "var(--m-text-muted)" }}>
        Whatever you were looking for isn&apos;t here — the link may be old, or the page may have moved.
      </p>
      <Link
        href="/m"
        className="mt-6 flex min-h-11 items-center px-6 text-[12px] font-bold text-white"
        style={{ background: "var(--m-accent)" }}
      >
        Back to Home
      </Link>
    </div>
  );
}
