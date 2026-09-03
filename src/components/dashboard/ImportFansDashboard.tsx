"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Loader2, X, CheckCircle2, FileText, Users } from "lucide-react";
import { uploadFile } from "@/lib/blob";

type ExtractedFan = { email: string; name: string | null };
type Step = "upload" | "preview" | "done";

// New feature (not in the original 14-phase plan): musicians upload a
// CSV/PDF/DOCX of fan emails and, after reviewing the extracted list,
// confirm to add them as followers (Fan + Follow rows, source: IMPORT).
// Preview-before-write matters here specifically because PDF/DOCX text
// extraction can misfire (scanned pages, unusual layout) in ways a CSV
// with a real header row mostly won't.
export default function ImportFansDashboard({ musicianId }: { musicianId: string }) {
  const [step, setStep] = useState<Step>("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fans, setFans] = useState<ExtractedFan[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [truncated, setTruncated] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ imported: number; alreadyFollowing: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadFile(file, "fan_import", musicianId);
      const res = await fetch("/api/musician/fans/import/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, fileName: file.name }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Could not parse this file.");
      if (body.fans.length === 0) throw new Error("No email addresses were found in this file.");

      setFans(body.fans);
      setExcluded(new Set());
      setTruncated(body.truncated);
      setStep("preview");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const toggleExcluded = (index: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const includedFans = fans.filter((_, i) => !excluded.has(i));

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await fetch("/api/musician/fans/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fans: includedFans }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Import failed. Please try again.");
      setSummary(body);
      setStep("done");
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Import failed. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const startOver = () => {
    setStep("upload");
    setFans([]);
    setExcluded(new Set());
    setSummary(null);
    setUploadError(null);
    setConfirmError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-semibold uppercase tracking-wide transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Import Fans</h1>
          <p className="text-sm text-gray-500 mt-1">Upload a CSV, PDF, or Word document containing fan email addresses.</p>
        </div>

        {step === "upload" && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-10 cursor-pointer hover:border-orange-400 transition-colors">
              {uploading ? <Loader2 className="w-8 h-8 text-orange-500 animate-spin" /> : <Upload className="w-8 h-8 text-gray-400" />}
              <span className="text-sm font-semibold text-gray-700">{uploading ? "Reading file…" : "Click to choose a file"}</span>
              <span className="text-xs text-gray-400">CSV, PDF, or DOCX &middot; up to 10MB</span>
              <input ref={fileInputRef} type="file" accept=".csv,.pdf,.docx" className="hidden" onChange={handleFileSelect} disabled={uploading} />
            </label>
            {uploadError && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>}
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-800">
                For best results with a CSV, include a column header named &quot;email&quot; (and optionally &quot;name&quot;). PDFs and Word documents are scanned for
                any email addresses they contain.
              </p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-gray-900 text-sm">
                  {includedFans.length} of {fans.length} email{fans.length === 1 ? "" : "s"} selected
                </h3>
              </div>
              <button type="button" onClick={startOver} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                Start over
              </button>
            </div>
            {truncated && (
              <div className="px-5 pt-4">
                <p className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  This file contained more than 2,000 email addresses — only the first 2,000 are shown.
                </p>
              </div>
            )}
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
              {fans.map((fan, i) => (
                <label key={`${fan.email}-${i}`} className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-gray-50 ${excluded.has(i) ? "opacity-40" : ""}`}>
                  <input type="checkbox" checked={!excluded.has(i)} onChange={() => toggleExcluded(i)} className="w-4 h-4 accent-orange-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate">{fan.email}</p>
                    {fan.name && <p className="text-xs text-gray-500 truncate">{fan.name}</p>}
                  </div>
                </label>
              ))}
            </div>
            <div className="p-5 border-t border-gray-100">
              {confirmError && <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{confirmError}</p>}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming || includedFans.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
              >
                {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {confirming ? "Importing…" : `Import ${includedFans.length} Fan${includedFans.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        )}

        {step === "done" && summary && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 text-lg mb-1">Import complete</h3>
            <p className="text-sm text-gray-600 mb-6">
              {summary.imported} new follower{summary.imported === 1 ? "" : "s"} added
              {summary.alreadyFollowing > 0 && ` — ${summary.alreadyFollowing} were already following you`}.
            </p>
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={startOver} className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-lg px-4 py-2">
                <X className="w-3.5 h-3.5" /> Import Another File
              </button>
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg px-4 py-2">
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
