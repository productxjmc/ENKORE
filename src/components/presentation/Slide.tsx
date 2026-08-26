import type { ReactNode } from "react";

// Ported verbatim from the Base44 app's src/components/presentation/Slide.jsx.
export default function Slide({
  children,
  bg = "bg-white",
  text = "text-gray-900",
  className = "",
}: {
  children: ReactNode;
  bg?: string;
  text?: string;
  className?: string;
}) {
  return (
    <section className={`snap-start min-h-[100dvh] w-full flex flex-col items-center justify-center px-6 py-20 ${bg} ${text} ${className}`}>
      {children}
    </section>
  );
}
