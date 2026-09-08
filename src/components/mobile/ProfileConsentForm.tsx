"use client";

import { useState } from "react";

type Consent = { app: boolean; email: boolean; sms: boolean; whatsapp: boolean };

const CONSENT_CHANNELS: { key: keyof Consent; label: string }[] = [
  { key: "app", label: "In-app notifications" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "whatsapp", label: "WhatsApp" },
];

export default function ProfileConsentForm({ initialConsent }: { initialConsent: Consent }) {
  const [consent, setConsent] = useState(initialConsent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const toggle = async (key: keyof Consent) => {
    const next = { ...consent, [key]: !consent[key] };
    setConsent(next);
    setStatus("saving");
    try {
      const res = await fetch("/api/m/fan/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: next }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>
          How musicians can reach you
        </p>
        {status === "saving" && <span className="text-[10px]" style={{ color: "var(--m-text-faint)" }}>Saving…</span>}
        {status === "error" && <span className="text-[10px]" style={{ color: "var(--m-accent)" }}>Couldn&apos;t save</span>}
      </div>
      <div className="flex flex-col gap-2">
        {CONSENT_CHANNELS.map(({ key, label }) => (
          <label key={key} className="flex min-h-12 items-center gap-3 border-2 px-3 py-2" style={{ borderColor: "var(--m-line)" }}>
            <input type="checkbox" checked={consent[key]} onChange={() => toggle(key)} className="h-5 w-5 accent-[var(--m-accent)]" />
            <span className="text-[13px] font-bold">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
