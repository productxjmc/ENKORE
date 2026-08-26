"use client";

import { useId, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function FirstFruitsForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formId = useId();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") ?? ""),
      artistName: String(form.get("artistName") ?? ""),
      location: String(form.get("location") ?? "") || undefined,
      songLink: String(form.get("songLink") ?? ""),
      fanReachAnswer: String(form.get("fanReachAnswer") ?? ""),
    };

    try {
      const res = await fetch("/api/first-fruits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrorMessage(body?.issues?.[0]?.message ?? "Something went wrong — try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMessage("Something went wrong — try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-[#B8860B]/40 bg-[#B8860B]/10 p-6 text-[#F5F5F5]">
        <p className="text-lg font-semibold">Got it — thank you.</p>
        <p className="mt-2 text-[#A0A0A0]">
          We read every application ourselves, so expect to hear from us within 7 to 21 working days.
        </p>
      </div>
    );
  }

  const label = "block text-sm font-medium text-[#F5F5F5]";
  const input =
    "mt-1 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-[#F5F5F5] placeholder:text-[#A0A0A0] focus:border-[#B8860B] focus:outline-none focus:ring-1 focus:ring-[#B8860B]";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-describedby={errorMessage ? `${formId}-error` : undefined}>
      <div>
        <label htmlFor={`${formId}-email`} className={label}>
          Email address
        </label>
        <input id={`${formId}-email`} name="email" type="email" required className={input} placeholder="you@example.com" />
      </div>

      <fieldset className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="flex-1">
          <label htmlFor={`${formId}-artistName`} className={label}>
            Artist / stage name
          </label>
          <input id={`${formId}-artistName`} name="artistName" required className={input} placeholder="Your name" />
        </div>
        <div className="flex-1">
          <label htmlFor={`${formId}-location`} className={label}>
            Where are you based?
          </label>
          <input id={`${formId}-location`} name="location" className={input} placeholder="City, country" />
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${formId}-songLink`} className={label}>
          Drop a link to one song
        </label>
        <input
          id={`${formId}-songLink`}
          name="songLink"
          required
          className={input}
          placeholder="Spotify, YouTube, a voice note — whatever you've got"
        />
      </div>

      <div>
        <label htmlFor={`${formId}-fanReachAnswer`} className={label}>
          Be honest — right now, could you email or message your fans directly? How many, roughly?
        </label>
        <textarea id={`${formId}-fanReachAnswer`} name="fanReachAnswer" required rows={3} className={input} />
      </div>

      {errorMessage && (
        <p id={`${formId}-error`} className="text-sm text-[#e2725b]" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 rounded-full bg-[#B8860B] px-6 py-3 font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting" ? "Sending…" : "Send My Application"}
      </button>
    </form>
  );
}
