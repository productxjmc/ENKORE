"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReplyForm({ musicianId, fanEmail }: { musicianId: string; fanEmail: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const send = async () => {
    if (!text.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/m/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicianId, fanEmail, messageBody: text.trim() }),
      });
      if (!res.ok) throw new Error();
      setText("");
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="sticky bottom-0 flex items-end gap-2 border-t-2 p-3" style={{ borderColor: "var(--m-line)", background: "var(--m-ground)" }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply..."
        rows={1}
        maxLength={2000}
        className="min-h-11 flex-1 resize-none border-2 bg-white px-3 py-2 text-[14px] outline-none focus:border-[var(--m-accent)]"
        style={{ borderColor: "var(--m-line)" }}
      />
      <button
        type="button"
        onClick={send}
        disabled={!text.trim() || status === "submitting"}
        className="flex min-h-11 items-center px-4 text-[12px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        Send
      </button>
      {status === "error" && <p className="text-[11px] font-semibold" style={{ color: "var(--m-accent)" }}>Failed</p>}
    </div>
  );
}
