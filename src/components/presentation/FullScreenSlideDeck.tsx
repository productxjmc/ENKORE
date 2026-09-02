"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import Slide from "@/components/presentation/Slide";

export type SlideDeckSlide = {
  bg?: string;
  text?: string;
  dark?: boolean;
  content: ReactNode;
};

// Ported from the new Base44 export's src/components/presentation/FullScreenSlideDeck.jsx
// (2 Sept 2026 design pass). Reusable full-screen, snap-scrolling slide
// deck with a theme-adaptive progress header (back, title -> home, slide
// counter, progress bar). Not wired into a page yet in this rebuild — it's
// the building block the source app uses for Features/MusicianFAQ/Pricing,
// none of which have been ported here, so it's available for whichever of
// those gets built next.
export default function FullScreenSlideDeck({
  title = "ENKORE",
  slides = [],
  homePath = "/",
}: {
  title?: string;
  slides?: SlideDeckSlide[];
  homePath?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const idx = Math.round(el.scrollTop / el.clientHeight);
        setActiveIndex(Math.max(0, Math.min(idx, total - 1)));
        ticking = false;
      });
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [total]);

  const goTo = useCallback(
    (i: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(i, total - 1));
      el.scrollTo({ top: clamped * el.clientHeight, behavior: "smooth" });
    },
    [total],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goTo(activeIndex + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goTo(activeIndex - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, goTo]);

  const active = slides[activeIndex] ?? { dark: false, content: null };
  const dark = active.dark ?? false;
  const progressPercent = total > 0 ? Math.round(((activeIndex + 1) / total) * 100) : 0;

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div ref={scrollRef} className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-0">
        {slides.map((slide, i) => (
          <Slide key={i} bg={slide.bg} text={slide.text} className="relative">
            {slide.content}
            {i < total - 1 && (
              <motion.div
                className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none"
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
              >
                <ChevronDown className={`w-6 h-6 ${slide.dark ? "text-white/40" : "text-black/30"}`} />
              </motion.div>
            )}
          </Slide>
        ))}
      </div>

      <div className="fixed top-0 left-0 right-0 z-30">
        <div className={`transition-colors duration-300 ${dark ? "bg-transparent" : "bg-white/80 backdrop-blur-md"}`}>
          <div className="max-w-md mx-auto px-3 py-3 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className={`flex items-center justify-center w-9 h-9 -ml-1 rounded-lg active:scale-90 transition-all ${dark ? "text-white/80" : "text-black/70"}`}
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <Link href={homePath} className={`text-xs font-black uppercase tracking-[0.2em] ${dark ? "text-white" : "text-black"}`}>
              {title}
            </Link>
            <span className={`text-xs font-bold tabular-nums w-10 text-right ${dark ? "text-white/60" : "text-gray-400"}`}>
              {String(activeIndex + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </span>
          </div>
          <div className={`h-0.5 w-full ${dark ? "bg-white/20" : "bg-gray-200"}`}>
            <div className="h-full bg-[#FF3700] transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
