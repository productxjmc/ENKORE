"use client";

import { motion } from "framer-motion";

// Ported from the new Base44 export's src/components/home/ScriptureLine.jsx
// (2 Sept 2026 design pass). Gentle looping fade-in/fade-out beneath the
// hero logo — welcoming without distracting from the slideshow behind it.
export default function ScriptureLine() {
  return (
    <motion.div
      className="text-center max-w-xs"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        duration: 9,
        times: [0, 0.18, 0.82, 1],
        repeat: Infinity,
        repeatDelay: 1.2,
        ease: "easeInOut",
      }}
    >
      <p className="font-normal text-[11px] leading-snug text-white/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        So whether you eat or drink or whatever you do, do it all for the glory of God.
      </p>
      <p className="mt-1 font-bold text-[10px] tracking-wide text-white/60 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        1 Corinthians 10:31
      </p>
    </motion.div>
  );
}
