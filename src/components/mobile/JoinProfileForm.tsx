"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Consent = { app: boolean; email: boolean; sms: boolean; whatsapp: boolean };

const CONSENT_CHANNELS: { key: keyof Consent; label: string; hint: string }[] = [
  { key: "app", label: "In-app", hint: "Notifications inside ENKORE" },
  { key: "email", label: "Email", hint: "Receipts, booking replies, release news" },
  { key: "sms", label: "SMS", hint: "Ticket confirmations, urgent updates" },
  { key: "whatsapp", label: "WhatsApp", hint: "Broadcasts from musicians you follow" },
];

const fieldClass =
  "min-h-[48px] w-full border-2 bg-[var(--m-ground)] px-3 text-[14px] outline-none focus:border-[var(--m-accent)]";

// Per-channel consent, not a single "receive messages" toggle — the PRD
// left this open (§9: "a single toggle vs. separate consent per channel")
// and the design commits to per-channel, the more POPIA-aligned answer,
// so that's what ships here rather than reopening the question.
export default function JoinProfileForm({
  initialFullName,
  initialPhone,
  initialCity,
}: {
  initialFullName: string;
  initialPhone: string;
  initialCity: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [city, setCity] = useState(initialCity);
  const [consent, setConsent] = useState<Consent>({ app: true, email: true, sms: false, whatsapp: false });
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: keyof Consent) => setConsent((c) => ({ ...c, [key]: !c[key] }));

  const save = async () => {
    const res = await fetch("/api/m/fan/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone, city, consent }),
    });
    if (!res.ok) {
      const out = await res.json().catch(() => null);
      throw new Error(out?.error || "Could not save your profile. Please try again.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    try {
      await save();
      router.push("/m");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Please try again.");
    }
  };

  const handleMusician = async () => {
    setStatus("submitting");
    setError(null);
    try {
      await save();
      // The musician side already has its own full application/review
      // flow (musician-pre-register) — this hands off to it rather than
      // building a second, competing musician-creation path.
      router.push("/musician-pre-register");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>
          One more step
        </p>
        <h1 className="mt-2 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Tell us about you</h1>
      </div>

      {error && <p className="border-l-4 px-3 py-2 text-[12px] font-semibold" style={{ borderColor: "var(--m-accent)", background: "#fff2ef", color: "#5c1b0c" }}>{error}</p>}

      <div className="flex flex-col gap-3">
        <input className={fieldClass} placeholder="Your name" required value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={status === "submitting"} />
        <input className={fieldClass} placeholder="Mobile number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={status === "submitting"} />
        <input className={fieldClass} placeholder="City" required value={city} onChange={(e) => setCity(e.target.value)} disabled={status === "submitting"} />
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>
          How can musicians reach you?
        </p>
        <div className="flex flex-col gap-2">
          {CONSENT_CHANNELS.map(({ key, label, hint }) => (
            <label key={key} className="flex min-h-12 items-center gap-3 border-2 px-3 py-2" style={{ borderColor: "var(--m-line)" }}>
              <input type="checkbox" checked={consent[key]} onChange={() => toggle(key)} className="h-5 w-5 accent-[var(--m-accent)]" disabled={status === "submitting"} />
              <span>
                <span className="block text-[13px] font-bold">{label}</span>
                <span className="block text-[11px]" style={{ color: "var(--m-text-muted)" }}>{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="min-h-[52px] w-full text-[13px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        {status === "submitting" ? "Saving…" : "Continue to ENKORE"}
      </button>

      <div className="border-t-2 pt-4" style={{ borderColor: "var(--m-line)" }}>
        <p className="mb-3 text-[12px]" style={{ color: "var(--m-text-muted)" }}>
          Are you a musician or worship leader? The musician profile is added to this same account — same login, both sides.
        </p>
        <button
          type="button"
          onClick={handleMusician}
          disabled={status === "submitting"}
          className="min-h-[52px] w-full border-2 text-[13px] font-bold disabled:opacity-60"
          style={{ borderColor: "var(--m-line)" }}
        >
          I&apos;m a musician
        </button>
      </div>
    </form>
  );
}
