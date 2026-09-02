"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Ported from the new Base44 export's src/components/home/HomeMenu.jsx
// (2 Sept 2026 design pass), scoped to links that actually exist here.
// The source app's Pricing/FAQs/Contact/Policies routes aren't built in
// this rebuild yet, so they're left off rather than wired to dead links —
// About/Why/Vision are ported alongside this component and do exist.
const ABOUT_SUB_LINKS = [
  { label: "About", path: "/about" },
  { label: "Why ENKORE", path: "/why" },
  { label: "Vision", path: "/vision" },
];

export default function HomeMenu() {
  const [open, setOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(true);
  const pathname = usePathname();

  const close = () => setOpen(false);
  const isActive = (path: string) => pathname === path;
  const aboutActive = ABOUT_SUB_LINKS.some(({ path }) => isActive(path));

  return (
    <>
      {/* Trigger — always visible, top-right, legible on any slide background */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-6 right-4 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm text-white active:scale-90 transition-all"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="home-menu"
            className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Top bar: logo icon + close */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element -- externally hosted brand asset, not a Next/Image-managed source */}
              <img
                src="https://media.base44.com/images/public/691b0c6b868d3cd0bc483403/002077f6d_ENKORESYMBOLWHITE.png"
                alt="ENKORE Music Africa"
                className="w-8 h-8 object-contain"
              />
              <button
                onClick={close}
                className="flex items-center justify-center w-11 h-11 text-gray-400 hover:text-white active:scale-90 transition-all rounded-lg"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col items-end gap-1">
                <div className="w-full">
                  <button
                    onClick={() => setAboutOpen((v) => !v)}
                    className={`flex items-center justify-end gap-1.5 w-full py-3 px-3 text-sm font-medium rounded-lg active:scale-[0.97] transition-all ${
                      aboutActive ? "text-orange-500 bg-orange-500/10" : "text-gray-300 hover:text-orange-400 hover:bg-white/5"
                    }`}
                  >
                    About
                    <ChevronDown className={`w-4 h-4 transition-transform ${aboutOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {aboutOpen && (
                      <motion.div
                        key="about-sub"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col items-end gap-1 pr-4 pt-1">
                          {ABOUT_SUB_LINKS.map(({ label, path }) => (
                            <Link
                              key={path}
                              href={path}
                              onClick={close}
                              className={`py-2.5 px-3 text-sm font-medium rounded-lg active:scale-[0.97] transition-all ${
                                isActive(path)
                                  ? "text-orange-500 bg-orange-500/10"
                                  : "text-gray-400 hover:text-orange-400 hover:bg-white/5"
                              }`}
                            >
                              {label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
