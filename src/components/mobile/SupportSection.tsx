"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import SupportFlow from "./SupportFlow";

type Musician = { id: string; musicianName: string; country: string | null };

export default function SupportSection({ musician, fanEmail, fanName }: { musician: Musician; fanEmail: string; fanName: string }) {
  const [open, setOpen] = useState(false);

  if (open) return <SupportFlow musician={musician} fanEmail={fanEmail} fanName={fanName} onClose={() => setOpen(false)} />;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex min-h-14 w-full items-center justify-center gap-2 border-2 text-[13px] font-bold"
      style={{ borderColor: "var(--m-line)" }}
    >
      <Heart className="h-4 w-4" style={{ color: "var(--m-accent)" }} />
      Support {musician.musicianName} monthly
    </button>
  );
}
