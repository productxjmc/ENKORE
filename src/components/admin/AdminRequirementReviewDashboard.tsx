"use client";

import { useState } from "react";
import Link from "next/link";
import type { Musician } from "@prisma/client";
import { ArrowLeft, CheckCircle2, XCircle, Clock, ExternalLink, FileText, User, Banknote, Camera, Share2, Music, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import SlaBadge from "@/components/admin/SlaBadge";

// Decimal fields become plain numbers after page.tsx's toPlain().
export type PlainReviewMusician = Omit<Musician, "totalRevenue"> & { totalRevenue: number };

type OnboardingDocs = {
  idDocumentUrl?: string;
  bankConfirmationUrl?: string;
  pressPhotoUrl?: string;
  artistBio?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  streamingSpotify?: string;
  streamingApple?: string;
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING_REVIEW: { label: "Pending Review", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
  CHANGES_REQUESTED: { label: "Changes Requested", className: "bg-red-100 text-red-800" },
  NONE: { label: "Not Submitted", className: "bg-gray-100 text-gray-600" },
};

function DocLink({ label, url, icon: Icon }: { label: string; url?: string; icon: typeof User }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm py-1">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
        <span className="ml-auto text-xs text-gray-400">Not provided</span>
      </div>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm py-1 text-blue-700 hover:text-blue-900 hover:underline">
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 ml-auto shrink-0" />
    </a>
  );
}

function MusicianCard({
  musician,
  onApprove,
  onRequestChanges,
  busyId,
}: {
  musician: PlainReviewMusician;
  onApprove: (m: PlainReviewMusician) => void;
  onRequestChanges: (m: PlainReviewMusician) => void;
  busyId: string | null;
}) {
  const docs = (musician.onboardingDocs as OnboardingDocs | null) ?? {};
  const status = musician.requirementsStatus || "NONE";
  const badge = STATUS_BADGE[status] || STATUS_BADGE.NONE;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {musician.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={musician.profileImage} alt={musician.musicianName} className="w-12 h-12 rounded-full object-cover border" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="w-6 h-6 text-orange-500" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900">{musician.musicianName}</h3>
              <p className="text-sm text-gray-500">{musician.email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge className={badge.className}>{badge.label}</Badge>
            {status === "PENDING_REVIEW" && musician.requirementsSubmittedAt && <SlaBadge date={musician.requirementsSubmittedAt} />}
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 space-y-3">
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Documents</p>
          <DocLink label="Identity Document" url={docs.idDocumentUrl} icon={User} />
          <DocLink label="Bank Confirmation Letter" url={docs.bankConfirmationUrl} icon={Banknote} />
          <DocLink label="Press Photo" url={docs.pressPhotoUrl} icon={Camera} />
        </div>

        {docs.artistBio && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Musician Bio</p>
            <p className="text-sm text-gray-700 line-clamp-3">{docs.artistBio}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Links</p>
          <DocLink label={`Instagram: ${docs.socialInstagram || "—"}`} url={docs.socialInstagram} icon={Share2} />
          <DocLink label={`Spotify: ${docs.streamingSpotify || "—"}`} url={docs.streamingSpotify} icon={Music} />
        </div>

        {musician.requirementsNotes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-yellow-700 mb-1">Previous Feedback</p>
            <p className="text-sm text-yellow-800">{musician.requirementsNotes}</p>
          </div>
        )}

        {status === "PENDING_REVIEW" && (
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onApprove(musician)}
              disabled={busyId === musician.id}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
            >
              {busyId === musician.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onRequestChanges(musician)}
              disabled={busyId === musician.id}
              className="flex-1 inline-flex items-center justify-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60 text-sm font-semibold rounded-lg py-2 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Request Changes
            </button>
          </div>
        )}
        {status === "APPROVED" && (
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium pt-1">
            <CheckCircle2 className="w-4 h-4" /> Requirements approved
          </div>
        )}
      </div>
    </div>
  );
}

// Ported from the Base44 app's src/pages/AdminRequirementReview.jsx.
// Plain useState+fetch, not react-query — same reasoning as
// AdminPartnersDashboard.tsx (no QueryClientProvider wired up anywhere
// in this rebuild).
export default function AdminRequirementReviewDashboard({ initialMusicians }: { initialMusicians: PlainReviewMusician[] }) {
  const [musicians, setMusicians] = useState<PlainReviewMusician[]>(initialMusicians);
  const [tab, setTab] = useState("PENDING_REVIEW");
  const [requestChangesMusician, setRequestChangesMusician] = useState<PlainReviewMusician | null>(null);
  const [changesNotes, setChangesNotes] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const flash = (kind: "success" | "error", text: string) => {
    setMessage({ kind, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const filtered = {
    PENDING_REVIEW: musicians.filter((m) => m.requirementsStatus === "PENDING_REVIEW"),
    APPROVED: musicians.filter((m) => m.requirementsStatus === "APPROVED"),
    CHANGES_REQUESTED: musicians.filter((m) => m.requirementsStatus === "CHANGES_REQUESTED"),
  };

  const handleApprove = async (musician: PlainReviewMusician) => {
    setBusyId(musician.id);
    try {
      const res = await fetch(`/api/admin/musicians/${musician.id}/approve-requirements`, { method: "POST" });
      if (!res.ok) {
        const out = await res.json().catch(() => null);
        flash("error", out?.error || "Failed to approve");
        return;
      }
      setMusicians((prev) => prev.map((m) => (m.id === musician.id ? { ...m, requirementsStatus: "APPROVED", onboardingStep: "LAUNCHED", requirementsNotes: null } : m)));
      flash("success", `${musician.musicianName} approved and notified.`);
    } catch {
      flash("error", "Failed to approve");
    } finally {
      setBusyId(null);
    }
  };

  const handleRequestChanges = async () => {
    if (!requestChangesMusician) return;
    if (!changesNotes.trim()) {
      flash("error", "Please enter feedback notes for the musician.");
      return;
    }
    setBusyId(requestChangesMusician.id);
    try {
      const res = await fetch(`/api/admin/musicians/${requestChangesMusician.id}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: changesNotes.trim() }),
      });
      if (!res.ok) {
        const out = await res.json().catch(() => null);
        flash("error", out?.error || "Failed to send feedback");
        return;
      }
      const notes = changesNotes.trim();
      setMusicians((prev) => prev.map((m) => (m.id === requestChangesMusician.id ? { ...m, requirementsStatus: "CHANGES_REQUESTED", requirementsNotes: notes } : m)));
      flash("success", `Feedback sent to ${requestChangesMusician.musicianName}.`);
      setRequestChangesMusician(null);
      setChangesNotes("");
    } catch {
      flash("error", "Failed to send feedback");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-5">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-xs font-semibold tracking-widest uppercase transition-colors py-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-5 pb-24 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Requirements Review</h1>
          <p className="text-gray-500 text-sm mt-1">Review musician onboarding submissions</p>
        </div>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
              message.kind === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="PENDING_REVIEW" className="gap-1.5">
              <Clock className="w-4 h-4" /> Pending ({filtered.PENDING_REVIEW.length})
            </TabsTrigger>
            <TabsTrigger value="APPROVED" className="gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Approved ({filtered.APPROVED.length})
            </TabsTrigger>
            <TabsTrigger value="CHANGES_REQUESTED" className="gap-1.5">
              <XCircle className="w-4 h-4" /> Changes Requested ({filtered.CHANGES_REQUESTED.length})
            </TabsTrigger>
          </TabsList>

          {(["PENDING_REVIEW", "APPROVED", "CHANGES_REQUESTED"] as const).map((status) => (
            <TabsContent key={status} value={status}>
              {filtered[status].length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No submissions in this category.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filtered[status].map((m) => (
                    <MusicianCard key={m.id} musician={m} onApprove={handleApprove} onRequestChanges={(mu) => { setRequestChangesMusician(mu); setChangesNotes(""); }} busyId={busyId} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={Boolean(requestChangesMusician)} onOpenChange={(open) => !open && setRequestChangesMusician(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes from {requestChangesMusician?.musicianName}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-gray-600 mb-3">Describe what needs to be updated. This message will be emailed to the musician.</p>
            <Textarea
              className="h-32 resize-none"
              placeholder="e.g. Your ID document is unclear, please re-upload a higher quality scan. Your bank confirmation letter is missing your account number..."
              value={changesNotes}
              onChange={(e) => setChangesNotes(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <button type="button" onClick={() => setRequestChangesMusician(null)} className="border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRequestChanges}
              disabled={busyId === requestChangesMusician?.id}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              {busyId === requestChangesMusician?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Feedback"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
