"use client";

import { useState, useEffect } from "react";
import { Crown } from "lucide-react";

const TOTAL_SEATS = 100;

// Ported from the Base44 app's src/components/partner/FoundingPartnerCounter.jsx.
export default function FoundingPartnerCounter() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/partners/stats")
      .then((res) => res.json())
      .then((data) => setRemaining(data?.foundingSeatsRemaining ?? TOTAL_SEATS))
      .catch(() => setRemaining(TOTAL_SEATS));
  }, []);

  const taken = remaining === null ? 0 : TOTAL_SEATS - remaining;
  const pct = Math.min(100, (taken / TOTAL_SEATS) * 100);

  return (
    <div className="bg-gradient-to-r from-[#FF3700]/15 to-[#FF3700]/5 border border-[#FF3700]/25 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-[#FF3700]" />
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700]">Founding Partner Seats</span>
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        {remaining === null ? (
          <span className="text-3xl font-black text-white/40">…</span>
        ) : (
          <>
            <span className="text-3xl font-black text-white">{remaining}</span>
            <span className="text-sm text-white/40">of {TOTAL_SEATS} remaining</span>
          </>
        )}
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-[#FF3700] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-white/35 text-xs mt-2 leading-relaxed">
        The first 100 partners earn lifetime <strong className="text-white/60">Founding Partner</strong> status — an
        enduring badge of honour in the ENKORE community.
      </p>
    </div>
  );
}
