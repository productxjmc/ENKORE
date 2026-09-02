"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

// Ported from the new Base44 export's src/components/presentation/StatementSlide.jsx
// (2 Sept 2026 design pass — reusable slide-deck system). A single
// full-screen black statement slide: a concise one-liner + a relevant
// scripture reference, no CTAs. Backs the /about, /why, and /vision pages.
export default function StatementSlide({
  title = "ENKORE",
  kicker,
  line,
  scripture,
  reference,
  homePath = "/",
}: {
  title?: string;
  kicker?: string;
  line: string;
  scripture?: string;
  reference?: string;
  homePath?: string;
}) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto px-3 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-9 h-9 -ml-1 rounded-lg active:scale-90 transition-all text-white/80"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Link href={homePath} className="text-xs font-black uppercase tracking-[0.2em] text-white">
            {title}
          </Link>
          <span className="w-9" />
        </div>
      </div>

      <div className="h-full flex items-center justify-center px-6">
        <motion.div
          className="text-center max-w-md w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {kicker && (
            <motion.p
              className="text-[#FF3700] text-xs font-black uppercase tracking-[0.3em] mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              {kicker}
            </motion.p>
          )}
          <motion.h1
            className="font-black text-3xl leading-[1.15] tracking-tight mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {line}
          </motion.h1>
          {scripture && (
            <motion.div
              className="border-l-2 border-[#FF3700]/60 pl-5 text-left mx-auto inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <p className="font-bold text-lg leading-snug text-white/80 italic">&ldquo;{scripture}&rdquo;</p>
              {reference && <p className="text-white/40 font-bold tracking-wide text-xs mt-2">— {reference}</p>}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
