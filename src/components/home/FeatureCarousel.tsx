"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart, ShoppingBag, Ticket, Heart, MapPin, Calendar, Wallet } from "lucide-react";

// Structurally borrowed from revelator.com's "A Complete Operating System"
// card carousel: a 3D-perspective fan where the active card sits flat and
// centered while its neighbors rotate away and recede. Replaces the
// FeatureMarquee ticker (same feature list, richer treatment) — the two
// showing the same seven items back to back would have been redundant.
const FEATURES = [
  { title: "Music", icon: ShoppingCart, color: "bg-[#FF3700]" },
  { title: "Merchandise", icon: ShoppingBag, color: "bg-indigo-700" },
  { title: "Tickets", icon: Ticket, color: "bg-emerald-700" },
  { title: "Subscriptions", icon: Heart, color: "bg-rose-700" },
  { title: "Crowdfund", icon: MapPin, color: "bg-amber-700" },
  { title: "Bookings", icon: Calendar, color: "bg-sky-700" },
  { title: "Payments", icon: Wallet, color: "bg-violet-700" },
] as const;

export default function FeatureCarousel() {
  const [active, setActive] = useState(0);
  const prev = () => setActive((a) => Math.max(0, a - 1));
  const next = () => setActive((a) => Math.min(FEATURES.length - 1, a + 1));

  return (
    <div className="snap-start w-full bg-black py-16 flex flex-col items-center px-4">
      <h2 className="text-white font-black text-3xl sm:text-4xl text-center mb-10 px-6">A Complete Platform</h2>

      {/* Card width/height tuned against a recorded mobile pass of
          revelator.com's own carousel: its active card runs ~83% of
          viewport width, not a small fixed box — this mirrors that
          proportion instead of the original's ~43%. Rotation/depth are
          eased back from the first pass too, since Revelator's own
          mobile cards sit almost flat (the pronounced 3D fan reads
          mainly on desktop). */}
      <div className="relative w-full max-w-sm sm:max-w-md h-96 overflow-hidden [perspective:1000px]">
        {FEATURES.map((f, i) => {
          const offset = i - active;
          const abs = Math.abs(offset);
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className={`absolute top-0 left-1/2 w-[82%] max-w-xs h-full rounded-2xl flex flex-col items-center justify-center gap-5 text-white shadow-2xl transition-all duration-500 ease-out ${f.color}`}
              style={{
                transform: `translateX(-50%) translateX(${offset * 260}px) translateZ(${-abs * 40}px) rotateY(${offset * -12}deg)`,
                opacity: abs > 2 ? 0 : 1,
                zIndex: 10 - abs,
                pointerEvents: abs > 2 ? "none" : "auto",
              }}
              aria-hidden={offset !== 0}
            >
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <Icon className="w-8 h-8" aria-hidden="true" />
              </div>
              <span className="font-black text-2xl text-center px-4">{f.title}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-8">
        <button
          type="button"
          onClick={prev}
          disabled={active === 0}
          aria-label="Previous feature"
          className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={next}
          disabled={active === FEATURES.length - 1}
          aria-label="Next feature"
          className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
