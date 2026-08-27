"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Clock, Music2, Phone, Users } from "lucide-react";
import { motion } from "framer-motion";
import { CHRISTIAN_GENRE_OPTIONS } from "@/lib/validation/musicianPreRegistration";

// Ported from the Base44 app's src/pages/MusicianPreRegister.jsx. This is
// the paid "Founding Musician" track (R1,000 upfront, platform equity,
// board representation) — distinct from the free/open First Fruits tier
// at /first-fruits, per the notes in "ENKORE Connect — First Fruits
// Application Copy."
//
// Trimmed for a one-page-view pass: dropped the confirm_artist_name/
// confirm_email/confirm_phone_number double-entry fields (handleSubmit
// never sent them to the API even before this — they were purely a
// client-side "type it twice" pattern with no backend effect), the
// per-step explanatory sentences, the emoji trust-badge row, the
// standalone ENKORE wordmark (redundant with the "Join ENKORE"
// headline right below it), and the closing scripture block.
const STEPS = [
  { id: 1, label: "Your Profile", icon: Music2 },
  { id: 2, label: "Contact", icon: Phone },
  { id: 3, label: "Submit", icon: Users },
] as const;

type FormState = {
  artist_name: string;
  location: string;
  spotify_url: string;
  christian_genre: string;
  email: string;
  phone_number: string;
  bio: string;
  discount_code: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function MusicianPreRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");

  const [form, setForm] = useState<FormState>({
    artist_name: "",
    location: "",
    spotify_url: "",
    christian_genre: "",
    email: "",
    phone_number: "",
    bio: "",
    discount_code: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      setForm((prev) => ({ ...prev, discount_code: ref }));
      // TODO(Stage 10 — Affiliates): the original app recorded a click via
      // recordAffiliateClick here. Deferred until the affiliate program is
      // ported — no endpoint exists yet to call.
    }
  }, []);

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (s: number): FieldErrors => {
    const e: FieldErrors = {};
    if (s === 1) {
      if (!form.artist_name) e.artist_name = "Required";
    }
    if (s === 2) {
      if (!form.email) e.email = "Required";
      if (!form.phone_number) e.phone_number = "Required";
    }
    return e;
  };

  const next = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const data: Record<string, string> = {
        artistName: form.artist_name,
        email: form.email,
        phoneNumber: form.phone_number,
      };
      if (form.bio) data.bio = form.bio;
      if (form.location) data.location = form.location;
      if (form.spotify_url) data.spotifyUrl = form.spotify_url;
      if (form.christian_genre) data.christianGenre = form.christian_genre;

      const finalRef = form.discount_code || referralCode;
      if (finalRef) data.referralCode = finalRef.trim();

      const res = await fetch("/api/musician-pre-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Submission failed");

      router.push("/musician-pre-register/success");
    } catch {
      setSubmitError("Submission failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  // peer + placeholder=" " on the input drives the floating animation:
  // :placeholder-shown is only true while the field is empty, so the
  // label sits large/centered like a placeholder at rest and floats up
  // into a small label once there's a value or the field is focused —
  // real <label>, never just placeholder text, so it stays available to
  // screen readers and never disappears the way placeholder-only labels do.
  const inputBase = (field: keyof FormState) =>
    `peer w-full bg-white border rounded-xl px-4 pt-6 pb-2 text-sm text-gray-900 outline-none transition-colors duration-150 focus:ring-2 focus:ring-[#FF3700]/30 focus:border-[#FF3700] ${
      errors[field] ? "border-[#FF3700] ring-2 ring-[#FF3700]/20" : "border-gray-200 hover:border-gray-300"
    }`;

  // animated fields (plain inputs) float from a placeholder-like resting
  // position; select/textarea can't use :placeholder-shown the same way,
  // so their label just sits permanently in the floated position.
  function floatingLabelClasses(hasError: boolean, animated: boolean) {
    const restColor = hasError ? "text-[#FF3700]" : "text-gray-500";
    const emptyColor = hasError ? "text-[#FF3700]" : "text-gray-400";
    const base = `absolute left-4 top-2 text-[10px] font-semibold uppercase tracking-wide pointer-events-none transition-all duration-150 ${restColor}`;
    if (!animated) return base;
    return `${base} peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:${emptyColor} peer-placeholder-shown:peer-focus:top-2 peer-placeholder-shown:peer-focus:translate-y-0 peer-placeholder-shown:peer-focus:text-[10px] peer-placeholder-shown:peer-focus:font-semibold peer-placeholder-shown:peer-focus:uppercase peer-placeholder-shown:peer-focus:tracking-wide peer-focus:text-[#FF3700] peer-placeholder-shown:peer-focus:text-[#FF3700]`;
  }

  function Field({
    label,
    id,
    children,
    hint,
    animated = true,
  }: {
    label: string;
    id: keyof FormState;
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

      <motion.div
        className="max-w-2xl mx-auto px-5 pb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-0 mb-6">
          {STEPS.map((s, idx) => {
            const done = step > s.id;
            const active = step === s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="contents">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${
                      done ? "bg-[#FF3700] border-[#FF3700]" : active ? "bg-transparent border-[#FF3700]" : "bg-transparent border-gray-700"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Icon className={`w-4 h-4 ${active ? "text-[#FF3700]" : "text-gray-600"}`} />
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wide ${active ? "text-white" : done ? "text-[#FF3700]" : "text-gray-600"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 mb-4 transition-colors duration-200 ${step > s.id ? "bg-[#FF3700]" : "bg-gray-800"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          {step === 1 && (
            <div className="p-6 md:p-8">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700] mb-1">Step 1 of 3</p>
              <h2 className="text-xl font-black text-gray-900 mb-5">Your Musician Profile</h2>

              <div className="flex flex-col gap-5">
                <Field label="Musician / Stage Name *" id="artist_name">
                  <input
                    id="artist_name"
                    value={form.artist_name}
                    onChange={(e) => set("artist_name", e.target.value)}
                    placeholder=" "
                    className={inputBase("artist_name")}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck="false"
                  />
                </Field>

                <Field label="Location" id="location">
                  <input
                    id="location"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder=" "
                    className={inputBase("location")}
                  />
                </Field>

                <Field label="Gospel Genre" id="christian_genre" animated={false}>
                  <select
                    id="christian_genre"
                    value={form.christian_genre}
                    onChange={(e) => set("christian_genre", e.target.value)}
                    className={`${inputBase("christian_genre")} cursor-pointer`}
                  >
                    <option value="">Select your primary gospel genre…</option>
                    {CHRISTIAN_GENRE_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Spotify / Boomplay Link" id="spotify_url" hint="Optional">
                  <input
                    id="spotify_url"
                    type="url"
                    value={form.spotify_url}
                    onChange={(e) => set("spotify_url", e.target.value)}
                    placeholder=" "
                    className={inputBase("spotify_url")}
                  />
                </Field>

                <Field label="Tell Us About Yourself" id="bio" hint="Optional" animated={false}>
                  <textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder="Your musical journey, who you make music for, what you're working on…"
                    className={`${inputBase("bio")} min-h-[90px] resize-none`}
                  />
                </Field>
              </div>

              <button
                type="button"
                onClick={next}
                className="mt-8 w-full flex items-center justify-center gap-2 bg-[#FF3700] hover:bg-[#CC2E00] text-white font-bold text-sm tracking-wide rounded-xl py-3.5 transition-colors duration-150 cursor-pointer"
              >
                Next — Contact Details <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="p-6 md:p-8">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700] mb-1">Step 2 of 3</p>
              <h2 className="text-xl font-black text-gray-900 mb-5">Contact Details</h2>

              <div className="flex flex-col gap-5">
                <Field label="Email Address *" id="email">
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder=" "
                    className={inputBase("email")}
                  />
                </Field>

                <Field label="WhatsApp Number *" id="phone_number" hint="Include country code">
                  <input
                    id="phone_number"
                    type="tel"
                    value={form.phone_number}
                    onChange={(e) => set("phone_number", e.target.value)}
                    placeholder=" "
                    className={inputBase("phone_number")}
                  />
                </Field>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#FF3700] hover:bg-[#CC2E00] text-white font-bold text-sm tracking-wide rounded-xl py-3.5 transition-colors duration-150 cursor-pointer"
                >
                  Next — Membership <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="p-6 md:p-8">
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700] mb-1">Step 3 of 3</p>
                <h2 className="text-xl font-black text-gray-900 mb-5">Almost There!</h2>

                <div className="bg-[#FFF5F2] border border-[#FF3700]/20 rounded-xl p-5 mb-5">
                  <p className="text-4xl font-black text-gray-900 leading-none mb-1">
                    R200<span className="text-base font-normal text-gray-400">/month</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Prepay 5 months (R1,000) to become a Founding Musician and own a share of the platform.
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {[
                      "Own 40% of the platform collectively with 499 other founding musicians",
                      "3 of 7 board seats elected by founding musicians — you govern what gets built",
                      "Revenue in your account within 30 days of your first sale",
                      "10–15% commission tiers — pay upfront for better rates",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-xs text-gray-600 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-[#FF3700] shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4 mb-5">
                  <Clock className="w-4 h-4 text-[#FF3700] shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 leading-relaxed">
                    <strong className="text-gray-900 font-semibold">Application Review:</strong> Typically{" "}
                    <span className="text-[#FF3700] font-semibold">7 to 21 working days</span>.
                  </p>
                </div>

                <Field label="Referral / Affiliate Code" id="discount_code" hint="Optional">
                  <input
                    id="discount_code"
                    value={form.discount_code}
                    onChange={(e) => set("discount_code", e.target.value)}
                    placeholder=" "
                    className={inputBase("discount_code")}
                  />
                </Field>

                {submitError && <p className="text-xs text-[#FF3700] mt-4">{submitError}</p>}

                <div className="flex gap-3 mt-7">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#FF3700] hover:bg-[#CC2E00] disabled:opacity-60 text-white font-bold text-sm tracking-wide rounded-xl py-3.5 transition-colors duration-150 cursor-pointer"
                  >
                    {isSubmitting ? (
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

                <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                  By registering you agree to our{" "}
                  <Link href="/privacy-policy" className="text-[#FF3700] hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and Terms of Service. Your information is POPIA compliant.
                </p>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
