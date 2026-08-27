"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";

// Ported from the Base44 app's src/components/home/WaitlistField.jsx.
// Adapted to inline success/error state instead of a toast — the shadcn
// toast system isn't ported yet, and this needed to ship today; the
// inline-state pattern is already proven on the First Fruits and
// Musician Pre-Register forms this session.
export default function WaitlistField() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const isInvalid = touched && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!email.trim() || status === "submitting") return;

    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Something went wrong");
      }
      setStatus("success");
      setEmail("");
      setTouched(false);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="w-full rounded-full border-2 border-white/30 bg-white/10 px-6 py-4 text-center text-sm text-white">
        You&apos;re on the waitlist! We&apos;ll email you on launch day — Sunday, 30 August 2026 at 9am.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
      <label htmlFor="waitlist-email" className="text-center text-xs font-medium uppercase tracking-wide text-white/70">
        Not ready to sign up? Get notified at launch
      </label>
      <div
        className={`w-full flex items-center gap-2 bg-white/10 border-2 rounded-full pl-5 pr-2 py-2 transition-colors ${
          isInvalid ? "border-red-300" : "border-white/30 focus-within:border-white"
        }`}
      >
        <Mail className="w-4 h-4 text-white/60 shrink-0" aria-hidden="true" />
        <input
          id="waitlist-email"
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={status === "submitting"}
          aria-invalid={isInvalid}
          className="min-w-0 flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none py-2"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="shrink-0 flex items-center gap-1.5 bg-black text-white font-bold px-5 py-3 rounded-full text-sm active:scale-[0.97] transition-transform disabled:opacity-60"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Joining...</span>
            </>
          ) : (
            <>
              <span>Notify Me</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
      {isInvalid && <p className="text-center text-sm text-red-200">Enter a valid email address.</p>}
      {status === "error" && <p className="text-center text-sm text-white/90">{errorMessage}</p>}
    </form>
  );
}
