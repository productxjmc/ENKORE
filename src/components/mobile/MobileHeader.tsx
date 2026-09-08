import { Repeat } from "lucide-react";

// Static shell for Phase 0 — currency comes from the already-built
// src/lib/pricingConfig.ts and the role switch needs real signed-in state,
// both wired up in Phase 1 (identity & onboarding). This proves the header
// renders and sticks correctly; it isn't interactive yet.
export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2.5 border-b-2 px-4 py-2.5" style={{ background: "var(--m-ground)", borderColor: "var(--m-line)" }}>
      <span className="mr-auto text-[17px] font-extrabold tracking-tight">ENKORE</span>
      <button
        type="button"
        disabled
        className="min-h-9 border px-2.5 py-1.5 text-[11px] font-semibold opacity-60"
        style={{ borderColor: "var(--m-line)" }}
      >
        ZAR
      </button>
      <button
        type="button"
        disabled
        className="inline-flex min-h-9 items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-white opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        <Repeat className="h-[13px] w-[13px]" />
        Member
      </button>
    </header>
  );
}
