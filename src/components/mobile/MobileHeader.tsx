"use client";

import { Repeat } from "lucide-react";
import { useMobileShell } from "./MobileShellProvider";

// Currency toggle is still a placeholder — real wiring (reusing
// src/lib/pricingConfig.ts, already fully built) lands in Phase 2 once
// there's actual priced content on screen to convert. The role switch is
// real: see MobileShellProvider for the signed-out / no-musician-profile /
// has-profile branching ("tap it without a musician profile and you get
// the pitch, not a dead end").
export default function MobileHeader() {
  const { role, toggleRole } = useMobileShell();

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
        onClick={toggleRole}
        className="inline-flex min-h-9 items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-white"
        style={{ background: "var(--m-accent)" }}
      >
        <Repeat className="h-[13px] w-[13px]" />
        {role === "musician" ? "Musician" : "Member"}
      </button>
    </header>
  );
}
