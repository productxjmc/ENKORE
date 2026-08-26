"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

// Ported from the Base44 app's src/components/home/WaitlistField.jsx.
// Adapted to inline success/error state instead of a toast — the shadcn
// toast system isn't ported yet, and this needed to ship today; the
// inline-state pattern is already proven on the First Fruits and
// Musician Pre-Register forms this session.
export default function WaitlistField() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <input
        type="email"
        required
        placeholder="Submit your email to join the waitlist"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "submitting"}
        className="w-full bg-white/10 border-2 border-white/30 text-white placeholder-white/60 px-6 py-4 rounded-full text-sm outline-none focus:border-white transition-colors text-center"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-black text-white font-bold uppercase px-6 py-4 rounded-full text-sm active:scale-[0.97] transition-transform disabled:opacity-60"
      >
        {status === "submitting" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Joining...
          </span>
        ) : (
          "Submit"
        )}
      </button>
      {status === "error" && <p className="text-center text-sm text-white/90">{errorMessage}</p>}
    </form>
  );
}
