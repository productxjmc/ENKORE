"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Music2, Shirt, Ticket } from "lucide-react";
import Slide from "@/components/presentation/Slide";
import AnimatedText from "@/components/presentation/AnimatedText";
import WaitlistField from "@/components/home/WaitlistField";
import FeatureCarousel from "@/components/home/FeatureCarousel";
import HeroSlideshow from "@/components/home/HeroSlideshow";
import ScriptureLine from "@/components/home/ScriptureLine";
import HeroIntroPopup from "@/components/home/HeroIntroPopup";
import WhatsAppButton from "@/components/home/WhatsAppButton";
import HomeMenu from "@/components/home/HomeMenu";

// Hero re-ported from the new Base44 export's src/pages/Home.jsx (2 Sept
// 2026 design pass): rotating photo slideshow background, a hamburger
// HomeMenu, a looping ScriptureLine under the logo, a first-visit
// HeroIntroPopup, and four quick-action buttons replacing the old
// "Sign Up Free" text button. The source app's quick actions each opened a
// role-picker modal (Musician / Supporter / Partner) — only the musician
// path exists in this rebuild (fan signup and the affiliate/partner
// system are unbuilt), so all three sell-* buttons go straight to
// /musician-pre-register rather than a modal where 2 of 3 choices would
// dead-end. FeatureCarousel and the footer (with its own waitlist pill)
// are kept below, scrollable — the source Home is a single fixed screen
// with no waitlist at all, but this app is still pre-launch and needs
// that capture point, so it wasn't dropped. "BUILT FOR HIS GLORY" is also
// kept as a second headline line even though the source only has one —
// it was an explicit prior request, not something this redesign meant to
// undo.
const HERO_IMAGES = [
  "https://media.base44.com/images/public/691b0c6b868d3cd0bc483403/f986112f0_generated_image.png",
  "https://media.base44.com/images/public/691b0c6b868d3cd0bc483403/eaff9d397_generated_image.png",
  "https://media.base44.com/images/public/691b0c6b868d3cd0bc483403/35b174b02_generated_image.png",
  "https://media.base44.com/images/public/691b0c6b868d3cd0bc483403/fd998faa3_generated_image.png",
  "https://media.base44.com/images/public/691b0c6b868d3cd0bc483403/88e7fd210_generated_image.png",
];

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

  return (
    <>
      <HomeMenu />

      <div ref={scrollRef} className="fixed inset-0 overflow-y-scroll snap-y snap-mandatory scrollbar-hide z-0">
        {/* Slide 1 — Hero */}
        <Slide bg="bg-black" text="text-white" className="relative">
          <HeroSlideshow images={HERO_IMAGES} />

          <div
            className={`absolute top-6 left-0 right-0 flex flex-col items-center gap-3 z-20 px-6 transition-opacity duration-500 ${
              logoVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- externally hosted brand asset, not a Next/Image-managed source */}
            <img
              src="https://media.base44.com/images/public/691b0c6b868d3cd0bc483403/c6eb417d2_ENKORESYMBOLTEXTWHITEBACKGROUND.png"
              alt="ENKORE Music Africa"
              className="h-16 w-16 object-contain"
            />
            <ScriptureLine />
          </div>

          <div className="text-center max-w-md relative z-10">
            <AnimatedText text="BUILT FOR CHRISTIAN MUSICIANS" className="font-black uppercase text-4xl leading-[0.95] tracking-tight" />
            <AnimatedText text="BUILT FOR HIS GLORY" className="font-black uppercase text-4xl leading-[0.95] tracking-tight" delay={0.15} />
          </div>

          <div className="absolute bottom-6 left-0 right-0 px-6 z-20">
            <div className="grid grid-cols-4 gap-2">
              <Link
                href="/musician-pre-register"
                aria-label="Sell Music"
                className="flex flex-col items-center justify-center bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl py-4 text-white active:scale-95 transition-transform"
              >
                <Music2 className="w-6 h-6" />
              </Link>
              <Link
                href="/musician-pre-register"
                aria-label="Sell Merch"
                className="flex flex-col items-center justify-center bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl py-4 text-white active:scale-95 transition-transform"
              >
                <Shirt className="w-6 h-6" />
              </Link>
              <Link
                href="/musician-pre-register"
                aria-label="Sell Tickets"
                className="flex flex-col items-center justify-center bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl py-4 text-white active:scale-95 transition-transform"
              >
                <Ticket className="w-6 h-6" />
              </Link>
              <WhatsAppButton />
            </div>
          </div>
        </Slide>

        <FeatureCarousel />

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
              <Link href="/demo" className="hover:text-white transition-colors">
                Demo
              </Link>
            </div>
            <p className="text-gray-600 text-xs">© 2026 ENKORE · Fanbase Africa (Pty) Ltd</p>
          </div>
        </Slide>
      </div>

      <HeroIntroPopup />
    </>
  );
}
