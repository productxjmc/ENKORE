"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type AccordionItem = { id: string | number; header: ReactNode; body: ReactNode };

// Ported from the new Base44 export's src/components/presentation/Accordion.jsx
// (2 Sept 2026 design pass). Reusable expandable accordion — not wired
// into a page yet here, since it backs MusicianFAQ in the source app and
// that page hasn't been ported.
export default function Accordion({
  items,
  allowMultiple = false,
  defaultOpenId = null,
}: {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenId?: string | number | null;
}) {
  const [openIds, setOpenIds] = useState<Set<string | number>>(() =>
    defaultOpenId !== null && defaultOpenId !== undefined ? new Set([defaultOpenId]) : new Set(),
  );

  const toggle = (id: string | number) => {
    setOpenIds((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id} className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03]">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left active:scale-[0.99] transition-transform"
              aria-expanded={isOpen}
            >
              <span className="flex-1 min-w-0">{item.header}</span>
              <ChevronDown
                className={`w-5 h-5 text-white/50 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">{item.body}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
