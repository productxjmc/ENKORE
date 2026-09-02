"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Clock } from "lucide-react";
import { CHRISTIAN_GENRE_OPTIONS } from "@/lib/validation/musicianPreRegistration";
import { HOW_HEARD_OPTIONS } from "@/lib/validation/seasonOfSinging";

// New application form, replacing First Fruits — see the Season of
// Singing marketing plan / FAQ / term sheet. Real, capped offer: full
// platform access, 0% ENKORE commission, free for 3 months, for the
// first 100 accepted applicants. Application window Sept 2-15 (14 days)
// or until 100 spots fill, whichever is first.
//
// Single-page form rather than musician-pre-register's 3-step wizard —
// the field list here is short enough (10 fields, 2 of them checkboxes)
// that a wizard would add friction, not clarity, and this needs to ship
// same-day. Same floating-label input treatment as musician-pre-register
// for visual consistency, duplicated locally rather than extracted into
// a shared component — matching how that page already does it.
type FormState = {
  artistName: string;
  location: string;
  songLink: string;
  christianGenre: string;
  email: string;
  phoneNumber: string;
  bio: string;
  howHeard: string;
  agreedToTerms: boolean;
  agreedToLaunchTerms: boolean;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function floatingLabelClasses(hasError: boolean, animated: boolean) {
  const restColor = hasError ? "text-[#FF3700]" : "text-gray-500";
  const emptyColor = hasError ? "text-[#FF3700]" : "text-gray-400";
  const base = `absolute left-4 top-2 text-[10px] font-semibold uppercase tracking-wide pointer-events-none transition-all duration-150 ${restColor}`;
  if (!animated) return base;
  return `${base} peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:${emptyColor} peer-placeholder-shown:peer-focus:top-2 peer-placeholder-shown:peer-focus:translate-y-0 peer-placeholder-shown:peer-focus:text-[10px] peer-placeholder-shown:peer-focus:font-semibold peer-placeholder-shown:peer-focus:uppercase peer-placeholder-shown:peer-focus:tracking-wide peer-focus:text-[#FF3700] peer-placeholder-shown:peer-focus:text-[#FF3700]`;
}

// Hoisted to module scope, not declared inside the page component — a
// component declared inside another component's body is a NEW function
// reference every render, so React treats it as a different component
// type each time and remounts it. For a controlled <input>, that means
// losing DOM focus after every single keystroke (confirmed live: typing
// into any field dropped focus after the first character). Fixed by
// hoisting and threading `errors` through as a prop instead of a closure.
function Field({
  label,
  id,
  errors,
  children,
  hint,
  animated = true,
}: {
  label: string;
  id: keyof FormState;
  errors: FieldErrors;
  children: ReactNode;
  hint?: string;
  animated?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        {children}
        <label htmlFor={id} className={floatingLabelClasses(Boolean(errors[id]), animated)}>
          {label}
        </label>
      </div>
      {errors[id] && (
        <p className="text-xs text-[#FF3700] flex items-center gap-1 mt-0.5">
          <span className="w-1 h-1 rounded-full bg-[#FF3700] inline-block" />
          {errors[id]}
        </p>
      )}
      {hint && !errors[id] && <p className="text-xs text-gray-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

export default function SeasonOfSingingPage() {
  const [form, setForm] = useState<FormState>({
    artistName: "",
    location: "",
    songLink: "",
    christianGenre: "",
    email: "",
    phoneNumber: "",
    bio: "",
    howHeard: "",
    agreedToTerms: false,
    agreedToLaunchTerms: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (field: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!form.artistName.trim()) e.artistName = "Required";
    if (!form.songLink.trim()) e.songLink = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.phoneNumber.trim()) e.phoneNumber = "Required";
    if (!form.agreedToTerms) e.agreedToTerms = "Required";
    if (!form.agreedToLaunchTerms) e.agreedToLaunchTerms = "Required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStatus("submitting");
    setSubmitError(null);
    try {
      const data: Record<string, string | boolean> = {
        artistName: form.artistName,
        songLink: form.songLink,
        email: form.email,
        phoneNumber: form.phoneNumber,
        agreedToTerms: form.agreedToTerms,
        agreedToLaunchTerms: form.agreedToLaunchTerms,
      };
      if (form.location) data.location = form.location;
      if (form.christianGenre) data.christianGenre = form.christianGenre;
      if (form.bio) data.bio = form.bio;
      if (form.howHeard) data.howHeard = form.howHeard;

      const res = await fetch("/api/season-of-singing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Submission failed");
      setStatus("success");
    } catch {
      setStatus("error");
      setSubmitError("Submission failed. Please try again.");
    }
  };

  const inputBase = (field: keyof FormState) =>
    `peer w-full bg-white border rounded-xl px-4 pt-6 pb-2 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2 focus:ring-[#FF3700]/30 focus:border-[#FF3700] ${
      errors[field] ? "border-[#FF3700] ring-2 ring-[#FF3700]/20" : "border-gray-200 hover:border-gray-300"
    }`;

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-5 text-center">
        <div className="max-w-md">
          <p className="text-[#FF3700] text-xs font-black uppercase tracking-[0.3em] mb-4">Application Received</p>
          <h1 className="text-3xl font-black text-white mb-4">You&apos;re in the running.</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            We read every application ourselves. If you&apos;re one of the first 100 accepted, we&apos;ll reach out with
            onboarding steps — the earlier you applied, the more free selling time you get once your page launches.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#FF3700] hover:bg-[#CC2E00] text-white font-black uppercase px-8 py-4 rounded-full text-sm transition-colors duration-150"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
      <div className="max-w-2xl mx-auto px-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-semibold tracking-widest uppercase transition-colors duration-150 py-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-5 pb-12">
        <div className="mb-6">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF3700] mb-3">Season of Singing</p>
          <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-white mb-3">
            14 days. 100 spots. <span className="text-[#FF3700]">That&apos;s it.</span>
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed max-w-lg mb-4">
            Full platform access — selling music, merch, tickets, everything — free for 3 months, zero ENKORE
            commission, for the first 100 Christian musicians who apply and are accepted.
          </p>
          <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
            <Clock className="w-4 h-4 text-[#FF3700] shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-white font-semibold">Applications close Sept 15</strong> or the moment all 100
              spots fill, whichever comes first. Onboarding 100 musicians properly by Sept 23 is genuinely as much as
              we can do well — that&apos;s the real reason for the cap, not a marketing trick.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-5">
              <Field label="Artist / Stage Name *" id="artistName" errors={errors}>
                <input
                  id="artistName"
                  value={form.artistName}
                  onChange={(e) => set("artistName", e.target.value)}
                  placeholder=" "
                  className={inputBase("artistName")}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck="false"
                />
              </Field>

              <Field label="Location" id="location" errors={errors}>
                <input
                  id="location"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder=" "
                  className={inputBase("location")}
                />
              </Field>

              <Field label="Link to One Song *" id="songLink" errors={errors} hint="Spotify, YouTube, or a voice note — whatever you've got">
                <input
                  id="songLink"
                  value={form.songLink}
                  onChange={(e) => set("songLink", e.target.value)}
                  placeholder=" "
                  className={inputBase("songLink")}
                />
              </Field>

              <Field label="Gospel Genre" id="christianGenre" errors={errors} animated={false}>
                <select
                  id="christianGenre"
                  value={form.christianGenre}
                  onChange={(e) => set("christianGenre", e.target.value)}
                  className={`${inputBase("christianGenre")} cursor-pointer`}
                >
                  <option value="">Select your primary gospel genre…</option>
                  {CHRISTIAN_GENRE_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Email Address *" id="email" errors={errors}>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder=" "
                  className={inputBase("email")}
                />
              </Field>

              <Field label="WhatsApp Number *" id="phoneNumber" errors={errors} hint="Include country code">
                <input
                  id="phoneNumber"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => set("phoneNumber", e.target.value)}
                  placeholder=" "
                  className={inputBase("phoneNumber")}
                />
              </Field>

              <Field label="Short Bio" id="bio" errors={errors} hint="Optional — 2-3 sentences" animated={false}>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="Your musical journey, who you make music for, what you're working on…"
                  className={`${inputBase("bio")} min-h-[90px] resize-none`}
                />
              </Field>

              <Field label="How did you hear about Season of Singing?" id="howHeard" errors={errors} animated={false}>
                <select
                  id="howHeard"
                  value={form.howHeard}
                  onChange={(e) => set("howHeard", e.target.value)}
                  className={`${inputBase("howHeard")} cursor-pointer`}
                >
                  <option value="">Select an option…</option>
                  {HOW_HEARD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedToTerms}
                  onChange={(e) => set("agreedToTerms", e.target.checked)}
                  className="mt-0.5 w-5 h-5 shrink-0 accent-[#FF3700] cursor-pointer"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  I have read and agree to the Season of Singing Program Terms, including the monthly feedback
                  requirement.
                </span>
              </label>
              {errors.agreedToTerms && (
                <p className="text-xs text-[#FF3700] flex items-center gap-1 -mt-2 ml-8">
                  <span className="w-1 h-1 rounded-full bg-[#FF3700] inline-block" />
                  {errors.agreedToTerms}
                </p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedToLaunchTerms}
                  onChange={(e) => set("agreedToLaunchTerms", e.target.checked)}
                  className="mt-0.5 w-5 h-5 shrink-0 accent-[#FF3700] cursor-pointer"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  I understand my ENKORE page launches (and my 3-month free term begins) as soon as my onboarding is
                  complete, no later than Sept 23. Applications close Sept 15 or when 100 spots are filled, and I am
                  not guaranteed a spot by applying.
                </span>
              </label>
              {errors.agreedToLaunchTerms && (
                <p className="text-xs text-[#FF3700] flex items-center gap-1 -mt-2 ml-8">
                  <span className="w-1 h-1 rounded-full bg-[#FF3700] inline-block" />
                  {errors.agreedToLaunchTerms}
                </p>
              )}
            </div>

            {submitError && <p className="text-xs text-[#FF3700] mt-4">{submitError}</p>}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="mt-7 w-full flex items-center justify-center gap-2 bg-[#FF3700] hover:bg-[#CC2E00] disabled:opacity-60 text-white font-bold text-sm tracking-wide rounded-xl py-3.5 transition-colors duration-150 cursor-pointer"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  Submit My Application <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
