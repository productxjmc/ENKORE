"use client";

import { useState, useEffect } from "react";

const VISIT_KEY = "enkore_hero_visit_count";
const SLIDE_INTERVAL = 4000;

// Ported from the new Base44 export's src/components/home/HeroSlideshow.jsx
// (2 Sept 2026 design pass) — replaces the old solid-orange hero background.
export default function HeroSlideshow({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Advance the starting image each visit so repeat visitors see variety.
    let count = 0;
    try {
      count = parseInt(localStorage.getItem(VISIT_KEY) || "0", 10) || 0;
    } catch {
      // localStorage unavailable (private mode etc.) — fall back to the first image.
    }
    setActive(count % images.length);
    try {
      localStorage.setItem(VISIT_KEY, String(count + 1));
    } catch {
      // ignore
    }

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % images.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="absolute inset-0">
      {images.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out"
          style={{
            backgroundImage: `url(${src})`,
            opacity: i === active ? 1 : 0,
          }}
        />
      ))}
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black/55" />
    </div>
  );
}
