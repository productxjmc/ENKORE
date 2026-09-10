"use client";

import { useEffect, useState } from "react";

const AUDIENCES = [
  { value: "ALL_FOLLOWERS", label: "All followers" },
  { value: "SUBSCRIBERS", label: "Active subscribers" },
  { value: "RECENT_BUYERS", label: "Bought in the last 90 days" },
  { value: "TICKET_HOLDERS", label: "Ticket holders" },
] as const;

const CHANNELS = [
  { value: "APP", label: "In-app" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
] as const;

type Audience = (typeof AUDIENCES)[number]["value"];
type Channel = (typeof CHANNELS)[number]["value"];

export default function BroadcastComposer({ musicianId }: { musicianId: string }) {
  const [audience, setAudience] = useState<Audience>("ALL_FOLLOWERS");
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "logged" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/m/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ musicianId, audience, channel, preview: true }),
    })
      .then((r) => r.json())
      .then((body) => { if (!cancelled) setCount(body.recipientCount ?? 0); })
      .catch(() => { if (!cancelled) setCount(null); });
    return () => { cancelled = true; };
  }, [musicianId, audience, channel]);

  const fieldClass = "min-h-[48px] w-full border-2 bg-[var(--m-ground)] px-3 text-[14px] outline-none focus:border-[var(--m-accent)]";

  const send = async () => {
    if (!message.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/m/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicianId, audience, channel, message: message.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("logged");
      setMessage("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "logged") {
    return (
      <div className="border-2 p-4 text-center" style={{ borderColor: "var(--m-line)" }}>
        <p className="text-[15px] font-extrabold">Logged</p>
        <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
          Would have reached {count} {count === 1 ? "person" : "people"} via {CHANNELS.find((c) => c.value === channel)?.label}. No message was actually sent — no provider is connected yet.
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-3 text-[12px] font-bold" style={{ color: "var(--m-accent)" }}>
          Compose another
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Audience</p>
        <select className={fieldClass} value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Channel</p>
        <div className="grid grid-cols-4 gap-1.5">
          {CHANNELS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setChannel(c.value)}
              className="flex min-h-11 items-center justify-center px-1 text-[11px] font-bold"
              style={{ background: channel === c.value ? "var(--m-accent)" : "var(--m-ground)", color: channel === c.value ? "#fff" : "var(--m-ink)" }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12px]" style={{ color: "var(--m-text-muted)" }}>
        {count === null ? "Calculating reach…" : `Reaches ${count} ${count === 1 ? "person" : "people"} who opted into this channel.`}
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your message..."
        rows={5}
        maxLength={2000}
        className={`${fieldClass} resize-none`}
      />

      {status === "error" && <p className="text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>Couldn&apos;t log this broadcast. Try again.</p>}

      <button
        type="button"
        onClick={send}
        disabled={!message.trim() || status === "submitting"}
        className="min-h-12 w-full px-4 text-[13px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        {status === "submitting" ? "Logging…" : "Log broadcast"}
      </button>
    </div>
  );
}
