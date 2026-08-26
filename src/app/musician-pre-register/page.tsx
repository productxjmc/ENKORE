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
const STEPS = [
  { id: 1, label: "Your Profile", icon: Music2 },
  { id: 2, label: "Contact", icon: Phone },
  { id: 3, label: "Submit", icon: Users },
] as const;

type FormState = {
  artist_name: string;
  confirm_artist_name: string;
  location: string;
  spotify_url: string;
  christian_genre: string;
  email: string;
  confirm_email: string;
  phone_number: string;
  confirm_phone_number: string;
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
    confirm_artist_name: "",
    location: "",
    spotify_url: "",
    christian_genre: "",
    email: "",
    confirm_email: "",
    phone_number: "",
    confirm_phone_number: "",
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
      if (!form.confirm_artist_name) e.confirm_artist_name = "Required";
      if (form.artist_name && form.confirm_artist_name && form.artist_name !== form.confirm_artist_name)
        e.confirm_artist_name = "Names do not match";
    }
    if (s === 2) {
      if (!form.email) e.email = "Required";
      if (!form.confirm_email) e.confirm_email = "Required";
      if (form.email && form.confirm_email && form.email !== form.confirm_email) e.confirm_email = "Emails do not match";
      if (!form.phone_number) e.phone_number = "Required";
      if (!form.confirm_phone_number) e.confirm_phone_number = "Required";
      if (form.phone_number && form.confirm_phone_number && form.phone_number !== form.confirm_phone_number)
        e.confirm_phone_number = "Numbers do not match";
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

  const inputBase = (field: keyof FormState) =>
    `w-full bg-white border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors duration-150 focus:ring-2 focus:ring-[#FF3700]/30 focus:border-[#FF3700] ${
      errors[field] ? "border-[#FF3700] ring-2 ring-[#FF3700]/20" : "border-gray-200 hover:border-gray-300"
    }`;

  function Field({ label, id, children, hint }: { label: string; id: keyof FormState; children: ReactNode; hint?: string }) {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </label>
        {children}
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
        <div className="flex items-center justify-center pt-8 pb-2">
          <span className="text-white font-black text-2xl tracking-tight">ENKORE</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-semibold tracking-widest uppercase transition-colors duration-150 py-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      <motion.div
        className="max-w-2xl mx-auto px-5 pb-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <rect x="7.5" y="1" width="3" height="16" rx="1" fill="#FF3700" />
              <rect x="1" y="6.5" width="16" height="3" rx="1" fill="#FF3700" />
            </svg>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF3700]">Founding Musician Registration</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black leading-tight tracking-tight text-white mb-2">
            Join <span className="text-[#FF3700]">ENKORE</span>
          </h1>

          <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
            Build your career. Connect with your community. Sell music, merchandise, tickets and more, directly to your audience
            across the world.
          </p>
        </div>

        <div className="flex items-center gap-0 mb-8">
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
            <div className="p-7 md:p-9">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700] mb-1">Step 1 of 3</p>
              <h2 className="text-xl font-black text-gray-900 mb-1">Your Musician Profile</h2>
              <p className="text-sm text-gray-500 mb-6">Tell us who you are and what you sound like.</p>

              <div className="flex flex-col gap-5">
                <Field label="Musician / Stage Name *" id="artist_name">
                  <input
                    id="artist_name"
                    value={form.artist_name}
                    onChange={(e) => set("artist_name", e.target.value)}
                    placeholder="e.g. Joyous Celebration, Moses Bliss"
                    className={inputBase("artist_name")}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="words"
                    spellCheck="false"
                  />
                </Field>

                <Field label="Confirm Musician / Stage Name *" id="confirm_artist_name">
                  <input
                    id="confirm_artist_name"
                    value={form.confirm_artist_name}
                    onChange={(e) => set("confirm_artist_name", e.target.value)}
                    placeholder="Re-enter your name"
                    className={inputBase("confirm_artist_name")}
                  />
                </Field>

                <Field label="Location" id="location">
                  <input
                    id="location"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="Johannesburg, South Africa"
                    className={inputBase("location")}
                  />
                </Field>

                <Field label="Gospel Genre" id="christian_genre" hint="Helps us connect you with the right community">
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

                <Field label="Spotify / Boomplay Link" id="spotify_url" hint="Optional — helps us learn more about your music">
                  <input
                    id="spotify_url"
                    type="url"
                    value={form.spotify_url}
                    onChange={(e) => set("spotify_url", e.target.value)}
                    placeholder="open.spotify.com/artist/… or boomplay.com/…"
                    className={inputBase("spotify_url")}
                  />
                </Field>

                <Field label="Tell Us About Yourself" id="bio" hint="Optional — share your story and what drives your music">
                  <textarea
                    id="bio"
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    placeholder="Your musical journey, who you make music for, what you're working on…"
                    className={`${inputBase("bio")} min-h-[100px] resize-none`}
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
            <div className="p-7 md:p-9">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700] mb-1">Step 2 of 3</p>
              <h2 className="text-xl font-black text-gray-900 mb-1">Contact Details</h2>
              <p className="text-sm text-gray-500 mb-6">We&apos;ll send your membership confirmation to these details.</p>

              <div className="flex flex-col gap-5">
                <Field label="Email Address *" id="email" hint="Your membership confirmation will be sent here">
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="musician@example.com"
                    className={inputBase("email")}
                  />
                </Field>

                <Field label="Confirm Email *" id="confirm_email">
                  <input
                    id="confirm_email"
                    type="email"
                    value={form.confirm_email}
                    onChange={(e) => set("confirm_email", e.target.value)}
                    placeholder="Re-enter your email"
                    className={inputBase("confirm_email")}
                  />
                </Field>

                <div className="border-t border-gray-100 pt-5">
                  <Field label="WhatsApp Number *" id="phone_number" hint="Include country code — e.g. +27 82 123 4567">
                    <input
                      id="phone_number"
                      type="tel"
                      value={form.phone_number}
                      onChange={(e) => set("phone_number", e.target.value)}
                      placeholder="+27 82 123 4567"
                      className={inputBase("phone_number")}
                    />
                  </Field>
                </div>

                <Field label="Confirm WhatsApp Number *" id="confirm_phone_number">
                  <input
                    id="confirm_phone_number"
                    type="tel"
                    value={form.confirm_phone_number}
                    onChange={(e) => set("confirm_phone_number", e.target.value)}
                    placeholder="Re-enter phone number"
                    className={inputBase("confirm_phone_number")}
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
              <div className="p-7 md:p-9">
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700] mb-1">Step 3 of 3</p>
                <h2 className="text-xl font-black text-gray-900 mb-1">Almost There!</h2>
                <p className="text-sm text-gray-500 mb-6">Review what you&apos;re signing up for and submit your application.</p>

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
                    <strong className="text-gray-900 font-semibold">Application Review:</strong> We personally review every
                    application. This typically takes <span className="text-[#FF3700] font-semibold">7 to 21 working days</span>.
                  </p>
                </div>

                <Field label="Referral / Affiliate Code" id="discount_code" hint="Optional — if another musician referred you">
                  <input
                    id="discount_code"
                    value={form.discount_code}
                    onChange={(e) => set("discount_code", e.target.value)}
                    placeholder="Enter referral code if you have one"
                    className={inputBase("discount_code")}
                  />
                </Field>

                <div className="flex flex-wrap gap-4 mt-5 pt-5 border-t border-gray-100">
                  {[
                    { icon: "🇿🇦", text: "African-first" },
                    { icon: "✅", text: "B-BBEE Level 1" },
                    { icon: "🔒", text: "POPIA Compliant" },
                    { icon: "🌍", text: "Global Reach" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <span>{icon}</span>
                      {text}
                    </div>
                  ))}
                </div>

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
                  and Terms of Service.
                  <br />
                  Your information is secure and POPIA compliant.
                </p>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 flex items-start gap-3 px-1">
          <svg className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="none">
            <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" />
            <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-gray-500 text-xs leading-relaxed">
              &quot;Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of
              the Holy Spirit.&quot;
            </p>
            <cite className="not-italic text-[10px] font-bold tracking-widest text-[#FF3700] mt-1 block">Matthew 28:19</cite>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
