"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Slide from "@/components/presentation/Slide";
import AnimatedText from "@/components/presentation/AnimatedText";
import WaitlistField from "@/components/home/WaitlistField";
import FeatureCarousel from "@/components/home/FeatureCarousel";
import Sparkle from "@/components/home/Sparkle";

// Ported from the Base44 app's src/pages/Home.jsx — the 5-slide scroll-snap
// narrative and the waitlist are unchanged. Scoped down for a same-day
// ship: the auto-popup MissionModal and the role-picker SignupModal are
// deferred (not core to "landing page with a waitlist"), and the two links
// that pointed at pages this rebuild hasn't reached yet (/demo, /Journey)
// now scroll within the page instead of dead-linking.
export default function Home() {
  const [logoVisible, setLogoVisible] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setLogoVisible(el.scrollTop < 80);
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToNext = () => {
    scrollRef.current?.querySelectorAll("section")[1]?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div ref={scrollRef} className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-0">
      {/* Slide 1 — Hero */}
      <Slide bg="bg-[#FF3700]" text="text-white" className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[140%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.25),transparent_60%)] blur-3xl" />
        </div>
        <div
          className={`absolute top-6 left-0 right-0 flex justify-center z-20 transition-opacity duration-500 ${
            logoVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- externally hosted brand asset, not a Next/Image-managed source */}
          <img
            src="https://media.base44.com/images/public/691b0c6b868d3cd0bc483403/c6eb417d2_ENKORESYMBOLTEXTWHITEBACKGROUND.png"
            alt="ENKORE Music Africa"
            className="h-16 w-16 object-contain"
          />
        </div>
        <div className="text-center max-w-md">
          <AnimatedText text="BUILT FOR CHRISTIAN MUSICIANS" className="font-black uppercase text-4xl leading-[0.95] tracking-tight mb-8" />
          <AnimatedText text="Amplify, thrive and sustain your music career." className="font-normal text-lg leading-relaxed opacity-90" delay={0.3} />
          <AnimatedText text="Sell music, merchandise, tickets and get bookings," className="font-normal text-lg leading-relaxed opacity-90" delay={0.5} />
          <AnimatedText text="all in one place." className="font-normal text-lg leading-relaxed mb-10 opacity-90" delay={0.7} />
          <div className="flex flex-col gap-3">
            <Link
              href="/musician-pre-register"
              className="w-full bg-white text-[#FF3700] font-black uppercase px-6 py-4 rounded-full text-sm text-center active:scale-[0.97] transition-transform shadow-lg"
            >
              Sign Up Free
            </Link>
            <button
              type="button"
              onClick={scrollToNext}
              className="w-full bg-transparent border-2 border-white text-white font-bold uppercase px-6 py-4 rounded-full text-sm text-center active:scale-[0.97] transition-transform"
            >
              Show me how it works →
            </button>
            <WaitlistField />
          </div>
        </div>
        <motion.div className="absolute bottom-6 left-0 right-0 flex justify-center" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          <ChevronDown className="w-6 h-6 text-white/60" />
        </motion.div>
      </Slide>

      <FeatureCarousel />

      {/* Slide 4 — For Musicians */}
      <Slide bg="bg-black" text="text-white">
        <div className="text-center max-w-md">
          <p className="flex items-center justify-center gap-2 text-[#FF3700] text-xs font-black uppercase tracking-[0.3em] mb-4">
            <Sparkle className="w-3 h-3" />
            Made For
          </p>
          <AnimatedText text="Musicians" className="font-black uppercase text-6xl leading-none tracking-tight mb-6" />
          <AnimatedText
            text="Upload tracks and sell direct — no label middleman, no gatekeepers. Track revenue, manage payouts, and plan events, all in one place."
            className="text-lg text-gray-400 leading-relaxed"
            delay={0.2}
          />
        </div>
      </Slide>

      {/* Slide 4b — For Fans */}
      <Slide bg="bg-gray-50" text="text-black">
        <div className="text-center max-w-md">
          <p className="flex items-center justify-center gap-2 text-[#FF3700] text-xs font-black uppercase tracking-[0.3em] mb-4">
            <Sparkle className="w-3 h-3" />
            Made For
          </p>
          <AnimatedText text="Fans" className="font-black uppercase text-6xl leading-none tracking-tight mb-6" />
          <AnimatedText
            text="Support the musicians shaping your faith. Buy their music, back their tours, and become part of the community they're building."
            className="text-lg text-gray-600 leading-relaxed"
            delay={0.2}
          />
        </div>
      </Slide>

      {/* Slide 5 — CTA */}
      <Slide bg="bg-[#FF3700]" text="text-white">
        <div className="text-center max-w-md">
          <AnimatedText text="Your gift is your calling." className="font-black text-3xl mb-2" />
          <AnimatedText text="ENKORE makes it your livelihood." className="font-black text-3xl mb-10" delay={0.2} />
          <Link
            href="/musician-pre-register"
            className="inline-block bg-white text-[#FF3700] font-black uppercase px-10 py-4 rounded-full text-lg active:scale-[0.97] transition-transform shadow-lg"
          >
            Join the Mission
          </Link>
          <button
            type="button"
            onClick={scrollToTop}
            className="block mx-auto mt-6 bg-transparent border-2 border-white text-white font-bold uppercase px-10 py-4 rounded-full text-lg text-center active:scale-[0.97] transition-transform"
          >
            Back to Top
          </button>
        </div>
      </Slide>

      {/* Slide 6 — Footer */}
      <Slide bg="bg-black" text="text-white">
        <div className="w-full max-w-md flex flex-col items-center text-center gap-8">
          <span className="text-2xl font-black tracking-tight">ENKORE</span>
          <div className="w-full">
            <WaitlistField />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <Link href="/musician-pre-register" className="hover:text-white transition-colors">
              Founding Musician Registration
            </Link>
            <Link href="/first-fruits" className="hover:text-white transition-colors">
              First Fruits Application
            </Link>
          </div>
          <p className="text-gray-600 text-xs">© 2026 ENKORE · Fanbase Africa (Pty) Ltd</p>
        </div>
      </Slide>
    </div>
  );
}
