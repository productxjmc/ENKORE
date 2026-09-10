"use client";

import { useState } from "react";

const EVENT_TYPES = [
  { value: "WEDDING", label: "Wedding" },
  { value: "CORPORATE", label: "Corporate" },
  { value: "CHURCH_SERVICE", label: "Church service" },
  { value: "CONCERT", label: "Concert" },
  { value: "PRIVATE_PARTY", label: "Private party" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "OTHER", label: "Other" },
] as const;

export default function BookingRequestForm({ musicianId, musicianName }: { musicianId: string; musicianName: string }) {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState<(typeof EVENT_TYPES)[number]["value"]>("CHURCH_SERVICE");
  const [venue, setVenue] = useState("");
  const [budget, setBudget] = useState("");
  const [sponsored, setSponsored] = useState<boolean | null>(null);
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const fieldClass = "min-h-[48px] w-full border-2 bg-[var(--m-ground)] px-3 text-[14px] outline-none focus:border-[var(--m-accent)]";

  const submit = async () => {
    if (!eventName || !eventDate || sponsored === null || !organizerName || !organizerEmail) {
      setError("Fill in the required fields.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/m/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musicianId,
          eventName,
          eventDate,
          eventType,
          venue: venue || undefined,
          budget: budget || undefined,
          sponsored,
          organizerName,
          organizerEmail,
          organizerPhone: organizerPhone || undefined,
          message: message || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't send your request. Try again.");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't send your request. Try again.");
    }
  };

  if (status === "done") {
    return (
      <div className="border-2 p-4 text-center" style={{ borderColor: "var(--m-line)" }}>
        <p className="text-[15px] font-extrabold">Request sent</p>
        <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>{musicianName} will reach out to {organizerEmail}.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input className={fieldClass} placeholder="Event name *" value={eventName} onChange={(e) => setEventName(e.target.value)} />
      <input className={fieldClass} type="date" placeholder="Event date *" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
      <select className={fieldClass} value={eventType} onChange={(e) => setEventType(e.target.value as typeof eventType)}>
        {EVENT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <input className={fieldClass} placeholder="Venue (optional)" value={venue} onChange={(e) => setVenue(e.target.value)} />
      <input className={fieldClass} placeholder="Budget (optional)" value={budget} onChange={(e) => setBudget(e.target.value)} />

      <div>
        <p className="mb-1.5 text-[11px] font-bold" style={{ color: "var(--m-ink)" }}>Is this event sponsored? *</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSponsored(true)}
            className="flex min-h-11 items-center justify-center border-2 text-[13px] font-bold"
            style={{ borderColor: "var(--m-line)", background: sponsored === true ? "var(--m-accent)" : "var(--m-ground)", color: sponsored === true ? "#fff" : "var(--m-ink)" }}
          >
            Sponsored
          </button>
          <button
            type="button"
            onClick={() => setSponsored(false)}
            className="flex min-h-11 items-center justify-center border-2 text-[13px] font-bold"
            style={{ borderColor: "var(--m-line)", background: sponsored === false ? "var(--m-accent)" : "var(--m-ground)", color: sponsored === false ? "#fff" : "var(--m-ink)" }}
          >
            Not sponsored
          </button>
        </div>
      </div>

      <div className="mt-2 border-t-2 pt-3" style={{ borderColor: "var(--m-line)" }}>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Your details</p>
        <div className="flex flex-col gap-3">
          <input className={fieldClass} placeholder="Your name *" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} />
          <input className={fieldClass} type="email" placeholder="Your email *" value={organizerEmail} onChange={(e) => setOrganizerEmail(e.target.value)} />
          <input className={fieldClass} placeholder="Your phone (optional)" value={organizerPhone} onChange={(e) => setOrganizerPhone(e.target.value)} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Anything else? (optional)"
            rows={3}
            maxLength={1000}
            className={`${fieldClass} resize-none`}
          />
        </div>
      </div>

      {error && <p className="text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={status === "submitting"}
        className="mt-1 flex min-h-[52px] w-full items-center justify-center px-4 text-[13px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        Send request
      </button>
    </div>
  );
}
