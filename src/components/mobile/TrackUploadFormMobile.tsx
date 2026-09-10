"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/blob";

const GENRES = ["Gospel", "Hip Hop", "Amapiano", "Gqom", "Afrobeats", "House", "Kwaito", "Jazz", "R&B", "Pop", "Rock", "Other"];

// Mobile-styled sibling of src/components/dashboard/TrackUploadForm.tsx —
// same upload/submit mechanics (uploadFile() -> /api/musician/tracks),
// trimmed to the fields that matter for a mobile-first upload (the
// desktop form's deeper metadata — lyrics, songwriters, BPM, key, mood —
// stays a desktop-only path rather than cramming it into this screen).
export default function TrackUploadFormMobile({ musicianId }: { musicianId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Gospel");
  const [coverArt, setCoverArt] = useState("");
  const [audioFileUrl, setAudioFileUrl] = useState("");
  const [basePrice, setBasePrice] = useState("50");
  const [payWhatYouWant, setPayWhatYouWant] = useState(true);
  const [minimumPrice, setMinimumPrice] = useState("20");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const fieldClass = "min-h-[48px] w-full border-2 bg-[var(--m-ground)] px-3 text-[14px] outline-none focus:border-[var(--m-accent)]";

  const handleCover = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setError("Cover image must be under 5MB");
    setUploadingCover(true);
    setError(null);
    try {
      setCoverArt(await uploadFile(file, "track_cover", musicianId));
    } catch {
      setError("Cover upload failed. Try again.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAudio = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return setError("Audio file must be under 50MB");
    setUploadingAudio(true);
    setError(null);
    try {
      setAudioFileUrl(await uploadFile(file, "track_audio", musicianId));
    } catch {
      setError("Audio upload failed. Try again.");
    } finally {
      setUploadingAudio(false);
    }
  };

  const submit = async () => {
    if (!title.trim() || !coverArt || !audioFileUrl) {
      setError("Title, cover art, and an audio file are all required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/musician/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          genre,
          coverArt,
          audioFileUrl,
          basePrice: Number(basePrice) || 0,
          payWhatYouWant,
          minimumPrice: Number(minimumPrice) || 0,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't upload. Try again.");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="border-2 p-4 text-center" style={{ borderColor: "var(--m-line)" }}>
        <p className="text-[15px] font-extrabold">Track uploaded</p>
        <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>{title} is live on your storefront.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input className={fieldClass} placeholder="Track title *" value={title} onChange={(e) => setTitle(e.target.value)} />
      <select className={fieldClass} value={genre} onChange={(e) => setGenre(e.target.value)}>
        {GENRES.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--m-accent)" }}>Cover art *</p>
        <input type="file" accept="image/*" onChange={handleCover} className="text-[12px]" />
        {uploadingCover && <p className="mt-1 text-[11px]" style={{ color: "var(--m-text-muted)" }}>Uploading…</p>}
        {coverArt && !uploadingCover && (
          /* eslint-disable-next-line @next/next/no-img-element -- uploaded blob preview */
          <img src={coverArt} alt="" className="mt-2 h-20 w-20 grayscale" style={{ objectFit: "cover" }} />
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--m-accent)" }}>Audio file *</p>
        <input type="file" accept="audio/*" onChange={handleAudio} className="text-[12px]" />
        {uploadingAudio && <p className="mt-1 text-[11px]" style={{ color: "var(--m-text-muted)" }}>Uploading…</p>}
        {audioFileUrl && !uploadingAudio && <p className="mt-1 text-[11px]" style={{ color: "var(--m-accent)" }}>Uploaded</p>}
      </div>

      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={payWhatYouWant} onChange={(e) => setPayWhatYouWant(e.target.checked)} />
        Let fans pay what they want
      </label>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>{payWhatYouWant ? "Suggested price (R)" : "Price (R)"}</p>
          <input className={fieldClass} type="number" min="0" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
        </div>
        {payWhatYouWant && (
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>Minimum price (R)</p>
            <input className={fieldClass} type="number" min="0" value={minimumPrice} onChange={(e) => setMinimumPrice(e.target.value)} />
          </div>
        )}
      </div>

      {error && <p className="text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={submitting || uploadingCover || uploadingAudio}
        className="mt-1 flex min-h-[52px] w-full items-center justify-center px-4 text-[13px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        {submitting ? "Uploading…" : "Publish track"}
      </button>
    </div>
  );
}
