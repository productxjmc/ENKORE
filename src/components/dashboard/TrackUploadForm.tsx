"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Music, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { uploadFile } from "@/lib/blob";

const GENRES = ["Hip Hop", "Amapiano", "Gqom", "Afrobeats", "House", "Kwaito", "Gospel", "Jazz", "R&B", "Pop", "Rock", "Other"];
const MUSICAL_KEYS = [
  "C Major", "C Minor", "D Major", "D Minor", "E Major", "E Minor",
  "F Major", "F Minor", "G Major", "G Minor", "A Major", "A Minor",
  "B Major", "B Minor",
];

type FormState = {
  title: string;
  description: string;
  genre: string;
  coverArt: string;
  audioFileUrl: string;
  basePrice: string;
  payWhatYouWant: boolean;
  minimumPrice: string;
  releaseDate: string;
  duration: string;
  lyrics: string;
  songwriters: string;
  producers: string;
  bpm: string;
  key: string;
  mood: string;
};

const INITIAL: FormState = {
  title: "",
  description: "",
  genre: "",
  coverArt: "",
  audioFileUrl: "",
  basePrice: "50",
  payWhatYouWant: true,
  minimumPrice: "20",
  releaseDate: new Date().toISOString().split("T")[0],
  duration: "",
  lyrics: "",
  songwriters: "",
  producers: "",
  bpm: "",
  key: "",
  mood: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

// Ported from the Base44 app's src/pages/UploadTrack.jsx and
// src/components/dashboard/InlineUploadPanel.jsx — one form, the full
// field union of both (the source had two near-duplicate upload flows
// with different field sets), rendered inline on the dashboard and at
// the dedicated /dashboard/upload-track page.
export default function TrackUploadForm({
  musicianId,
  onSuccess,
  compact = false,
}: {
  musicianId: string;
  onSuccess: () => void;
  compact?: boolean;
}) {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCoverUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setErrors((p) => ({ ...p, coverArt: "Image must be under 5MB" }));
    setUploadingCover(true);
    try {
      const url = await uploadFile(file, "track_cover", musicianId);
      set("coverArt", url);
    } catch {
      setErrors((p) => ({ ...p, coverArt: "Upload failed, please try again" }));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAudioUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return setErrors((p) => ({ ...p, audioFileUrl: "Audio file must be under 50MB" }));
    setUploadingAudio(true);
    try {
      const url = await uploadFile(file, "track_audio", musicianId);
      set("audioFileUrl", url);
    } catch {
      setErrors((p) => ({ ...p, audioFileUrl: "Upload failed, please try again" }));
    } finally {
      setUploadingAudio(false);
    }
  };

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!form.title.trim()) e.title = "Track title is required";
    if (!form.genre) e.genre = "Genre is required";
    if (!form.audioFileUrl) e.audioFileUrl = "Audio file is required";
    if (!form.coverArt) e.coverArt = "Cover art is required";
    if (Number(form.basePrice) < 0) e.basePrice = "Price must be 0 or greater";
    if (form.payWhatYouWant && Number(form.minimumPrice) < 0) e.minimumPrice = "Minimum price must be 0 or greater";
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setGeneralError(null);
    try {
      const res = await fetch("/api/musician/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          genre: form.genre,
          coverArt: form.coverArt,
          audioFileUrl: form.audioFileUrl,
          basePrice: Number(form.basePrice),
          payWhatYouWant: form.payWhatYouWant,
          minimumPrice: Number(form.minimumPrice),
          releaseDate: form.releaseDate,
          duration: form.duration || undefined,
          lyrics: form.lyrics || undefined,
          songwriters: form.songwriters ? form.songwriters.split(",").map((s) => s.trim()).filter(Boolean) : [],
          producers: form.producers ? form.producers.split(",").map((p) => p.trim()).filter(Boolean) : [],
          bpm: form.bpm ? Number(form.bpm) : undefined,
          key: form.key || undefined,
          mood: form.mood || undefined,
        }),
      });
      if (!res.ok) {
        const out = await res.json().catch(() => null);
        setGeneralError(out?.error || "Failed to upload track. Please try again.");
        return;
      }
      setForm(INITIAL);
      onSuccess();
    } catch {
      setGeneralError("Failed to upload track. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: keyof FormState) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 ${
      errors[field] ? "border-red-400" : "border-gray-200"
    }`;

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-4" : "space-y-6 max-w-2xl"}>
      {generalError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{generalError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Cover Art *</label>
          <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-orange-400 transition-colors">
            {form.coverArt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.coverArt} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">
              {uploadingCover ? "Uploading..." : form.coverArt ? "Change cover art" : "Upload cover art"}
            </span>
            {uploadingCover && <Loader2 className="w-4 h-4 animate-spin text-orange-500 ml-auto" />}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
          </label>
          {errors.coverArt && <p className="text-xs text-red-600 mt-1">{errors.coverArt}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Audio File *</label>
          <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-orange-400 transition-colors">
            {form.audioFileUrl ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Music className="w-5 h-5 text-gray-400" />}
            <span className="text-sm text-gray-600">
              {uploadingAudio ? "Uploading..." : form.audioFileUrl ? "Audio uploaded" : "Upload audio (MP3/WAV)"}
            </span>
            {uploadingAudio && <Loader2 className="w-4 h-4 animate-spin text-orange-500 ml-auto" />}
            <input type="file" accept="audio/mpeg,audio/mp3,audio/wav" className="hidden" onChange={handleAudioUpload} disabled={uploadingAudio} />
          </label>
          {errors.audioFileUrl && <p className="text-xs text-red-600 mt-1">{errors.audioFileUrl}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Track Title *</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass("title")} placeholder="Track title" />
        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className={`${inputClass("description")} min-h-[70px] resize-none`}
          placeholder="What's this track about?"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Genre *</label>
          <select value={form.genre} onChange={(e) => set("genre", e.target.value)} className={`${inputClass("genre")} cursor-pointer`}>
            <option value="">Select a genre</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {errors.genre && <p className="text-xs text-red-600 mt-1">{errors.genre}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Release Date</label>
          <input type="date" value={form.releaseDate} onChange={(e) => set("releaseDate", e.target.value)} className={inputClass("releaseDate")} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Base Price (R)</label>
          <input type="number" min={0} step="0.01" value={form.basePrice} onChange={(e) => set("basePrice", e.target.value)} className={inputClass("basePrice")} />
          {errors.basePrice && <p className="text-xs text-red-600 mt-1">{errors.basePrice}</p>}
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.payWhatYouWant} onChange={(e) => set("payWhatYouWant", e.target.checked)} className="w-4 h-4 accent-orange-500" />
            Pay what you want
          </label>
        </div>
        {form.payWhatYouWant && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Minimum Price (R)</label>
            <input type="number" min={0} step="0.01" value={form.minimumPrice} onChange={(e) => set("minimumPrice", e.target.value)} className={inputClass("minimumPrice")} />
            {errors.minimumPrice && <p className="text-xs text-red-600 mt-1">{errors.minimumPrice}</p>}
          </div>
        )}
      </div>

      {!compact && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
              <input value={form.duration} onChange={(e) => set("duration", e.target.value)} className={inputClass("duration")} placeholder="3:45" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">BPM</label>
              <input type="number" value={form.bpm} onChange={(e) => set("bpm", e.target.value)} className={inputClass("bpm")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Key</label>
              <select value={form.key} onChange={(e) => set("key", e.target.value)} className={`${inputClass("key")} cursor-pointer`}>
                <option value="">Select a key</option>
                {MUSICAL_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mood</label>
            <input value={form.mood} onChange={(e) => set("mood", e.target.value)} className={inputClass("mood")} placeholder="Uplifting, reflective, joyful..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Songwriters (comma-separated)</label>
              <input value={form.songwriters} onChange={(e) => set("songwriters", e.target.value)} className={inputClass("songwriters")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Producers (comma-separated)</label>
              <input value={form.producers} onChange={(e) => set("producers", e.target.value)} className={inputClass("producers")} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Lyrics</label>
            <textarea value={form.lyrics} onChange={(e) => set("lyrics", e.target.value)} className={`${inputClass("lyrics")} min-h-[120px] resize-none`} />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={submitting || uploadingCover || uploadingAudio}
        className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold text-sm rounded-lg px-5 py-2.5 transition-colors"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload Track"}
      </button>
    </form>
  );
}
