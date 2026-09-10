"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { uploadFile } from "@/lib/blob";

type Docs = { artistBio: string; idDocumentUrl: string; bankConfirmationUrl: string; pressPhotoUrl: string };

const STEPS: { key: keyof Docs; label: string; kind: "id_document" | "bank_confirmation" | "press_photo" | null }[] = [
  { key: "artistBio", label: "Artist bio", kind: null },
  { key: "idDocumentUrl", label: "ID document", kind: "id_document" },
  { key: "bankConfirmationUrl", label: "Bank confirmation letter", kind: "bank_confirmation" },
  { key: "pressPhotoUrl", label: "Press photo", kind: "press_photo" },
];

// Reuses /api/musician/onboarding/submit as-is — it already merges over
// whatever was previously saved and re-validates all four items
// server-side, so this wizard doesn't need its own draft-save round trip
// before the final submit.
export default function OnboardingWizard({ musicianId, initial }: { musicianId: string; initial: Docs }) {
  const router = useRouter();
  const [docs, setDocs] = useState<Docs>(initial);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  const fieldClass = "w-full resize-none border-2 bg-[var(--m-ground)] p-3 text-[14px] outline-none focus:border-[var(--m-accent)]";

  const handleUpload = async (kind: NonNullable<(typeof STEPS)[number]["kind"]>, key: keyof Docs, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKey(key);
    setError(null);
    try {
      const url = await uploadFile(file, kind, musicianId);
      setDocs((prev) => ({ ...prev, [key]: url }));
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploadingKey(null);
    }
  };

  const complete = STEPS.filter((s) => docs[s.key]).length;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    setMissing([]);
    try {
      const res = await fetch("/api/musician/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingDocs: docs }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body?.missing) setMissing(body.missing);
        throw new Error(body?.error || "Couldn't submit.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--m-accent)" }}>{complete}/{STEPS.length} complete</p>
      </div>
      <div className="mb-5 h-1.5 w-full" style={{ background: "var(--m-line)" }}>
        <div className="h-full" style={{ width: `${(complete / STEPS.length) * 100}%`, background: "var(--m-accent)" }} />
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-2 flex items-center gap-2">
            {docs.artistBio ? <CheckCircle2 className="h-4 w-4" style={{ color: "var(--m-accent)" }} /> : <Circle className="h-4 w-4" style={{ color: "var(--m-text-faint)" }} />}
            <p className="text-[13px] font-bold">Artist bio</p>
          </div>
          <textarea
            className={fieldClass}
            rows={4}
            maxLength={1000}
            value={docs.artistBio}
            onChange={(e) => setDocs((prev) => ({ ...prev, artistBio: e.target.value }))}
            placeholder="Tell your story — who you are, what you make music for..."
          />
        </div>

        {STEPS.filter((s) => s.kind).map((s) => (
          <div key={s.key}>
            <div className="mb-2 flex items-center gap-2">
              {docs[s.key] ? <CheckCircle2 className="h-4 w-4" style={{ color: "var(--m-accent)" }} /> : <Circle className="h-4 w-4" style={{ color: "var(--m-text-faint)" }} />}
              <p className="text-[13px] font-bold">{s.label}</p>
            </div>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => handleUpload(s.kind!, s.key, e)} className="text-[12px]" />
            {uploadingKey === s.key && <p className="mt-1 text-[11px]" style={{ color: "var(--m-text-muted)" }}>Uploading…</p>}
            {docs[s.key] && uploadingKey !== s.key && <p className="mt-1 text-[11px]" style={{ color: "var(--m-accent)" }}>Uploaded</p>}
          </div>
        ))}
      </div>

      {missing.length > 0 && (
        <p className="mt-4 text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>Still missing: {missing.join(", ")}</p>
      )}
      {error && <p className="mt-2 text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={submitting || complete < STEPS.length}
        className="mt-5 flex min-h-[52px] w-full items-center justify-center px-4 text-[13px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        {submitting ? "Submitting…" : "Submit for review"}
      </button>
    </div>
  );
}
