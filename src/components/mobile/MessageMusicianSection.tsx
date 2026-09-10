"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function MessageMusicianSection({ musicianId, musicianName, signedIn }: { musicianId: string; musicianName: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");

  if (!signedIn) {
    return (
      <Link href="/m/signin" className="flex min-h-11 items-center gap-2 border-2 px-3 text-[12px] font-bold" style={{ borderColor: "var(--m-line)" }}>
        <MessageSquare className="h-4 w-4" style={{ color: "var(--m-accent)" }} />
        Sign in to message {musicianName}
      </Link>
    );
  }

  if (status === "sent") {
    return (
      <p className="flex min-h-11 items-center gap-2 border-2 px-3 text-[12px] font-bold" style={{ borderColor: "var(--m-line)", color: "var(--m-accent)" }}>
        <MessageSquare className="h-4 w-4" /> Message sent
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex min-h-11 items-center gap-2 border-2 px-3 text-[12px] font-bold" style={{ borderColor: "var(--m-line)" }}>
        <MessageSquare className="h-4 w-4" style={{ color: "var(--m-accent)" }} />
        Message {musicianName}
      </button>
    );
  }

  const send = async () => {
    if (!text.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/m/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicianId, messageBody: text.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="border-2 p-3" style={{ borderColor: "var(--m-line)" }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Say something to ${musicianName}...`}
        rows={3}
        maxLength={2000}
        className="w-full resize-none border-2 bg-[var(--m-ground)] p-2 text-[13px] outline-none focus:border-[var(--m-accent)]"
        style={{ borderColor: "var(--m-line)" }}
      />
      {status === "error" && <p className="mt-1 text-[11px] font-semibold" style={{ color: "var(--m-accent)" }}>Couldn&apos;t send. Try again.</p>}
      <button
        type="button"
        onClick={send}
        disabled={!text.trim() || status === "submitting"}
        className="mt-2 min-h-10 w-full px-4 text-[12px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        Send
      </button>
    </div>
  );
}
