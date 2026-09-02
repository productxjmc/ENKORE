"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

const AUTO_DISMISS_MS = 3000;

// Ported from the new Base44 export's src/components/home/HeroIntroPopup.jsx
// (2 Sept 2026 design pass). Full-screen intro shown once per page load,
// auto-dismisses after a short read or on tap.
export default function HeroIntroPopup() {
  const [open, setOpen] = useState(true);

  // Lock body scroll while popup is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Auto-dismiss after a short read
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [open]);

  const dismiss = () => setOpen(false);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-stretch justify-stretch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Scrim — lets slideshow bleed through subtly */}
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={dismiss} aria-hidden="true" />

          {/* Full-screen panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="intro-popup-title"
            className="relative w-full h-full bg-card overflow-hidden flex flex-col"
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            {/* Close affordance */}
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white text-black shadow-lg ring-1 ring-black/10 hover:bg-gray-100 active:scale-95 transition"
            >
              <X className="w-6 h-6" strokeWidth={2.5} />
            </button>

            {/* Accent header band */}
            <div className="enkore-orange-gradient px-6 pt-10 pb-8">
              <h2 id="intro-popup-title" className="font-black uppercase text-3xl leading-[0.95] tracking-tight text-white">
                Built for Christian musicians
              </h2>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 pt-6 pb-8 bg-card text-card-foreground flex flex-col justify-center">
              <p className="font-black text-2xl leading-tight text-foreground mb-4">
                Your gift is a blessing. Your music is a calling. Build it for His glory.
              </p>
              <p className="font-bold text-lg leading-snug text-foreground/90 mb-2">Join the ENKORE mission.</p>
              <p className="font-normal text-base leading-relaxed text-foreground/80 mb-8">
                Sell your music, merchandise and manage bookings, all on one platform.
              </p>
              <button
                onClick={dismiss}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl enkore-orange-gradient text-white font-bold uppercase tracking-wide active:scale-[0.98] transition-transform"
              >
                Get started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
