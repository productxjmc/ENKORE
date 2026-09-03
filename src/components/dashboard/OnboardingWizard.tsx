"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Upload,
  Music,
  FileText,
  User,
  Banknote,
  Share2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Star,
  Camera,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadFile } from "@/lib/blob";

export type OnboardingDocs = {
  idDocumentUrl?: string;
  bankConfirmationUrl?: string;
  pressPhotoUrl?: string;
  artistBio?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialFacebook?: string;
  streamingSpotify?: string;
  streamingApple?: string;
  streamingYoutube?: string;
};

type StepDef = {
  id: string;
  label: string;
  icon: typeof Star;
  title: string;
  subtitle: string;
  hint?: string;
  isIntro?: boolean;
  isReview?: boolean;
  field?: keyof OnboardingDocs;
  type?: "file" | "image" | "textarea" | "socials" | "streaming";
  accept?: string;
};

const STEPS: StepDef[] = [
  { id: "welcome", label: "Welcome", icon: Star, title: "Welcome to ENKORE!", subtitle: "Let's get your musician profile ready for launch.", isIntro: true },
  {
    id: "identity",
    label: "Identity",
    icon: User,
    title: "Verify Your Identity",
    subtitle: "Upload a copy of your ID, passport, or driver's licence.",
    hint: "Accepted: JPG, PNG, PDF · Max 10MB",
    field: "idDocumentUrl",
    type: "file",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    id: "banking",
    label: "Banking",
    icon: Banknote,
    title: "Bank Account Details",
    subtitle: "Upload your bank confirmation letter so we can pay you.",
    hint: "A stamped letter from your bank confirming your account details.",
    field: "bankConfirmationUrl",
    type: "file",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    id: "press",
    label: "Press Photo",
    icon: Camera,
    title: "Musician Press Photo",
    subtitle: "Upload a high-resolution photo that fans will see on your storefront.",
    hint: "Minimum 800x800px · JPG or PNG",
    field: "pressPhotoUrl",
    type: "image",
    accept: ".jpg,.jpeg,.png",
  },
  {
    id: "bio",
    label: "Musician Bio",
    icon: FileText,
    title: "Your Musician Bio",
    subtitle: "Tell your story — who you are, your music and your faith journey.",
    hint: "This will appear on your public storefront.",
    field: "artistBio",
    type: "textarea",
  },
  {
    id: "socials",
    label: "Social Media",
    icon: Share2,
    title: "Social Media Links",
    subtitle: "Connect your social profiles so fans can follow you everywhere.",
    hint: "All fields are optional — add what you have.",
    type: "socials",
  },
  {
    id: "streaming",
    label: "Streaming",
    icon: Music,
    title: "Streaming Profiles",
    subtitle: "Link your music on streaming platforms.",
    hint: "Add any platforms where your music is already available.",
    type: "streaming",
  },
  { id: "review", label: "Review", icon: Rocket, title: "Review & Submit", subtitle: "Everything looks good? Submit your materials for review.", isReview: true },
];

const CONTENT_STEPS = STEPS.filter((s) => !s.isIntro && !s.isReview);

function UploadZone({
  uploading,
  uploaded,
  onUpload,
  onRemove,
  accept,
  isImage,
  previewUrl,
}: {
  uploading: boolean;
  uploaded: boolean;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  accept?: string;
  isImage: boolean;
  previewUrl?: string;
}) {
  if (uploaded) {
    return (
      <div className="w-full">
        {isImage && previewUrl ? (
          <div className="relative w-full flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="w-48 h-48 object-cover rounded-2xl border-2 border-orange-500 shadow-lg shadow-orange-500/20" />
            <button type="button" onClick={onRemove} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
              Remove &amp; re-upload
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-700/50 rounded-xl">
            <div className="w-10 h-10 bg-green-900/40 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-green-400 font-medium text-sm">Document uploaded successfully</p>
              <p className="text-gray-500 text-xs mt-0.5">Ready for review</p>
            </div>
            <button type="button" onClick={onRemove} className="ml-auto text-gray-600 hover:text-red-400 text-xs transition-colors">
              Replace
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <label className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-2xl py-12 px-6 cursor-pointer hover:border-orange-500 hover:bg-orange-500/5 transition-all group">
      {uploading ? (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
          <p className="text-gray-400 text-sm">Uploading...</p>
        </>
      ) : (
        <>
          <div className="w-14 h-14 bg-gray-800 group-hover:bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 transition-colors">
            <Upload className="w-7 h-7 text-gray-500 group-hover:text-orange-500 transition-colors" />
          </div>
          <p className="text-white font-medium mb-1">Click to upload</p>
          <p className="text-gray-500 text-xs">or drag and drop here</p>
        </>
      )}
      <input type="file" accept={accept} className="hidden" onChange={onUpload} disabled={uploading} />
    </label>
  );
}

function ReviewItem({ label, value, icon: Icon }: { label: string; value?: string; icon: typeof Star }) {
  const isDone = Boolean(value);
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDone ? "border-green-700/40 bg-green-900/10" : "border-gray-800 bg-gray-900/50"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone ? "bg-green-900/40" : "bg-gray-800"}`}>
        {isDone ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Icon className="w-4 h-4 text-gray-600" />}
      </div>
      <span className={`text-sm font-medium ${isDone ? "text-white" : "text-gray-500"}`}>{label}</span>
      <span className={`ml-auto text-xs ${isDone ? "text-green-400" : "text-gray-600"}`}>{isDone ? "Complete" : "Skipped"}</span>
    </div>
  );
}

const SOCIAL_FIELDS: { key: keyof OnboardingDocs; label: string; placeholder: string }[] = [
  { key: "socialInstagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "socialTwitter", label: "Twitter / X", placeholder: "https://twitter.com/yourhandle" },
  { key: "socialFacebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
];
const STREAMING_FIELDS: { key: keyof OnboardingDocs; label: string; placeholder: string }[] = [
  { key: "streamingSpotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/..." },
  { key: "streamingApple", label: "Apple Music", placeholder: "https://music.apple.com/..." },
  { key: "streamingYoutube", label: "YouTube Music", placeholder: "https://music.youtube.com/..." },
];

// Ported from the Base44 app's src/pages/PrepareForLaunch.jsx. Kept in the
// dark brand style (matching musician-pre-register/season-of-singing, and
// the source itself) rather than the dashboard's light admin theme — this
// is a one-time linear flow, not the ongoing-use data tool the light theme
// is for.
export default function OnboardingWizard({
  musicianId,
  initialDocs,
}: {
  musicianId: string;
  initialDocs: OnboardingDocs;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingDocs>(initialDocs);

  const saveProgress = async (docs: OnboardingDocs) => {
    try {
      await fetch("/api/musician/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingDocs: docs }),
      });
    } catch {
      // swallow — this is a draft save, the final submit route is what matters
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, field: keyof OnboardingDocs, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const kind = field === "idDocumentUrl" ? "id_document" : field === "bankConfirmationUrl" ? "bank_confirmation" : "press_photo";
      const url = await uploadFile(file, kind, musicianId);
      const next = { ...formData, [field]: url };
      setFormData(next);
      if (isImage) {
        await fetch("/api/musician/onboarding/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileImage: url }),
        });
      }
    } catch {
      setSubmitError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const goNext = async () => {
    setDirection(1);
    setSaving(true);
    await saveProgress(formData);
    setSaving(false);
    setCurrentStep((s) => s + 1);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentStep((s) => s - 1);
  };

  const skipStep = () => {
    setDirection(1);
    setCurrentStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/musician/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingDocs: formData }),
      });
      const out = await res.json();
      if (!res.ok) {
        setSubmitError(out?.missing?.length ? `Still missing: ${out.missing.join(", ")}` : out?.error || "Could not submit. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError("Could not submit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const step = STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;
  const progress = currentStep === 0 ? 0 : Math.round((currentStep / (STEPS.length - 1)) * 100);

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-orange-500/40"
        >
          <Rocket className="w-12 h-12 text-white" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-3xl font-bold mb-3">You&apos;re on the launchpad!</h1>
          <p className="text-gray-400 mb-2 max-w-md text-lg">Your materials have been submitted to the ENKORE team.</p>
          <p className="text-gray-500 mb-10 max-w-md text-sm">
            We&apos;ll review everything and activate your storefront within 1-2 business days. You&apos;ll receive an email once you&apos;re live.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-3 text-base rounded-xl font-semibold transition-colors"
          >
            Go to My Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="px-5 py-4 flex items-center justify-between border-b border-gray-900">
        <span className="font-black text-xl tracking-tight">ENKORE</span>
        {!isFirstStep && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{isLastStep ? "Review" : `Step ${currentStep} of ${STEPS.length - 2}`}</span>
            <span className="text-xs font-semibold text-orange-400">{progress}%</span>
          </div>
        )}
      </header>

      {!isFirstStep && (
        <div className="w-full h-0.5 bg-gray-900">
          <motion.div className="h-0.5 bg-orange-500" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
      )}

      {!isFirstStep && !isLastStep && (
        <div className="flex justify-center gap-1.5 pt-5 px-4 flex-wrap">
          {CONTENT_STEPS.map((s, i) => {
            const idx = i + 1;
            const done = currentStep > idx;
            const active = currentStep === idx;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                  active
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : done
                      ? "border-green-700/50 bg-green-900/10 text-green-400"
                      : "border-gray-800 text-gray-600"
                }`}
              >
                {done && <CheckCircle2 className="w-3 h-3" />}
                {s.label}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 overflow-hidden">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              {step.isIntro && (
                <div className="text-center w-full">
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/30">
                      <Star className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold mb-3">{step.title}</h1>
                  <p className="text-gray-400 mb-6 text-base max-w-sm mx-auto">{step.subtitle}</p>
                  <p className="text-gray-500 text-sm mb-10 max-w-sm mx-auto">
                    We&apos;ll walk you through <strong className="text-gray-300">6 quick steps</strong> to get your storefront ready. It takes about 5 minutes.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-10 text-left max-w-sm mx-auto">
                    {CONTENT_STEPS.map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.id} className="flex items-center gap-2 p-3 bg-gray-900 rounded-xl border border-gray-800">
                          <Icon className="w-4 h-4 text-orange-500 shrink-0" />
                          <span className="text-sm text-gray-300">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="w-full max-w-sm bg-orange-500 hover:bg-orange-600 text-white py-4 text-base rounded-xl font-semibold inline-flex items-center justify-center gap-1 transition-colors"
                    onClick={() => {
                      setDirection(1);
                      setCurrentStep(1);
                    }}
                  >
                    Let&apos;s Get Started <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {step.isReview && (
                <div className="w-full">
                  <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                    <Rocket className="w-8 h-8 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2">{step.title}</h2>
                  <p className="text-gray-400 text-center text-sm mb-8">{step.subtitle}</p>
                  <div className="space-y-2 mb-8">
                    <ReviewItem label="Identity Document" value={formData.idDocumentUrl} icon={User} />
                    <ReviewItem label="Bank Confirmation" value={formData.bankConfirmationUrl} icon={Banknote} />
                    <ReviewItem label="Press Photo" value={formData.pressPhotoUrl} icon={Camera} />
                    <ReviewItem label="Musician Bio" value={formData.artistBio} icon={FileText} />
                    <ReviewItem
                      label="Social Media Links"
                      value={formData.socialInstagram || formData.socialTwitter || formData.socialFacebook}
                      icon={Share2}
                    />
                    <ReviewItem
                      label="Streaming Links"
                      value={formData.streamingSpotify || formData.streamingApple || formData.streamingYoutube}
                      icon={Music}
                    />
                  </div>
                  <p className="text-xs text-gray-600 text-center mb-6">
                    Your ID document, bank confirmation letter, press photo, and bio are all required to submit for review.
                  </p>
                  {submitError && (
                    <div className="mb-4 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-3">
                      <p className="text-sm text-red-300">{submitError}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-xl px-4 py-3 inline-flex items-center justify-center gap-1 transition-colors"
                      onClick={goPrev}
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      type="button"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-semibold inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-60"
                      onClick={handleSubmit}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Submit for Review <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(step.type === "file" || step.type === "image") && step.field && (
                <div className="w-full">
                  <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                    <step.icon className="w-7 h-7 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2">{step.title}</h2>
                  <p className="text-gray-400 text-center text-sm mb-2">{step.subtitle}</p>
                  {step.hint && <p className="text-gray-600 text-center text-xs mb-7">{step.hint}</p>}
                  <UploadZone
                    uploading={uploading}
                    uploaded={Boolean(formData[step.field])}
                    onUpload={(e) => handleFileUpload(e, step.field!, step.type === "image")}
                    onRemove={() => setFormData((p) => ({ ...p, [step.field!]: "" }))}
                    accept={step.accept}
                    isImage={step.type === "image"}
                    previewUrl={formData[step.field]}
                  />
                </div>
              )}

              {step.type === "textarea" && (
                <div className="w-full">
                  <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                    <step.icon className="w-7 h-7 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2">{step.title}</h2>
                  <p className="text-gray-400 text-center text-sm mb-2">{step.subtitle}</p>
                  {step.hint && <p className="text-gray-600 text-center text-xs mb-7">{step.hint}</p>}
                  <textarea
                    className="w-full bg-gray-900 border border-gray-800 focus:border-orange-500 rounded-2xl px-4 py-4 text-white placeholder-gray-600 h-44 resize-none focus:outline-none transition-colors text-sm leading-relaxed"
                    placeholder="Tell fans about yourself, your music journey and your faith..."
                    value={formData.artistBio ?? ""}
                    onChange={(e) => setFormData((p) => ({ ...p, artistBio: e.target.value }))}
                  />
                  <p className="text-xs text-gray-700 mt-2 text-right">{(formData.artistBio ?? "").length} characters</p>
                </div>
              )}

              {step.type === "socials" && (
                <div className="w-full">
                  <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                    <step.icon className="w-7 h-7 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2">{step.title}</h2>
                  <p className="text-gray-400 text-center text-sm mb-2">{step.subtitle}</p>
                  {step.hint && <p className="text-gray-600 text-center text-xs mb-7">{step.hint}</p>}
                  <div className="space-y-3">
                    {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
                        <input
                          className="w-full bg-gray-900 border border-gray-800 focus:border-orange-500 text-white placeholder-gray-700 rounded-xl h-12 px-4 focus:outline-none transition-colors"
                          placeholder={placeholder}
                          value={formData[key] ?? ""}
                          onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step.type === "streaming" && (
                <div className="w-full">
                  <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-5 mx-auto">
                    <step.icon className="w-7 h-7 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2">{step.title}</h2>
                  <p className="text-gray-400 text-center text-sm mb-2">{step.subtitle}</p>
                  {step.hint && <p className="text-gray-600 text-center text-xs mb-7">{step.hint}</p>}
                  <div className="space-y-3">
                    {STREAMING_FIELDS.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
                        <input
                          className="w-full bg-gray-900 border border-gray-800 focus:border-orange-500 text-white placeholder-gray-700 rounded-xl h-12 px-4 focus:outline-none transition-colors"
                          placeholder={placeholder}
                          value={formData[key] ?? ""}
                          onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!step.isIntro && !step.isReview && (
                <div className="flex gap-3 mt-8 w-full">
                  <button type="button" className="border border-gray-800 text-gray-400 hover:bg-gray-900 rounded-xl px-4 transition-colors" onClick={goPrev}>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-semibold inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-60"
                    onClick={goNext}
                    disabled={saving || uploading}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Save &amp; Continue <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {!step.isIntro && !step.isReview && (
                <button type="button" className="mt-3 text-xs text-gray-700 hover:text-gray-500 transition-colors" onClick={skipStep}>
                  Skip for now
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
