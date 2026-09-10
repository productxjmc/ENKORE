"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";

export default function NotifyMeButton({ musicianId, signedIn }: { musicianId: string; signedIn: boolean }) {
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");

  if (!signedIn) {
    return (
      <Link
        href="/m/signin"
        className="flex min-h-11 items-center gap-2 border-2 px-3 text-[12px] font-bold"
        style={{ borderColor: "var(--m-line)" }}
      >
        <Bell className="h-4 w-4" style={{ color: "var(--m-accent)" }} />
        Sign in to get notified
      </Link>
    );
  }

  const onClick = async () => {
    setState("submitting");
    try {
      const res = await fetch("/api/m/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicianId }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <span className="flex min-h-11 items-center gap-2 border-2 px-3 text-[12px] font-bold" style={{ borderColor: "var(--m-line)", color: "var(--m-accent)" }}>
        <BellRing className="h-4 w-4" />
        You&apos;ll be notified
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === "submitting"}
      className="flex min-h-11 items-center gap-2 border-2 px-3 text-[12px] font-bold disabled:opacity-60"
      style={{ borderColor: "var(--m-line)" }}
    >
      <Bell className="h-4 w-4" style={{ color: "var(--m-accent)" }} />
      {state === "error" ? "Try again" : "Notify me about new music/shows"}
    </button>
  );
}
