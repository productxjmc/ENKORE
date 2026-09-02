"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import type { PlainAffiliate } from "@/components/partners/PartnerDashboard";

export type MinistryFormData = { ministryName: string; ministryRole: string; message: string };

// Ported from the Base44 app's src/components/partner/MinistryApplicationForm.jsx.
export default function MinistryApplicationForm({
  existing,
  onSubmit,
  onCancel,
}: {
  existing?: PlainAffiliate | null;
  onSubmit: (data: MinistryFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<MinistryFormData>({
    ministryName: existing?.ministryName ?? "",
    ministryRole: existing?.ministryRole ?? "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ministryName || !formData.ministryRole) return;
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  return (
    <div className="bg-[#141414] border border-[#FF3700]/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700]/70">Ministry Partner Application</p>
        <button type="button" onClick={onCancel} className="text-white/30 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-white/50 mb-1.5 block">Ministry / Church Name</label>
          <input
            type="text"
            value={formData.ministryName}
            onChange={(e) => setFormData((prev) => ({ ...prev, ministryName: e.target.value }))}
            placeholder="e.g., Grace Community Church"
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:border-[#FF3700]/50 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold text-white/50 mb-1.5 block">Your Role</label>
          <input
            type="text"
            value={formData.ministryRole}
            onChange={(e) => setFormData((prev) => ({ ...prev, ministryRole: e.target.value }))}
            placeholder="e.g., Worship Pastor, Music Director"
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:border-[#FF3700]/50 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold text-white/50 mb-1.5 block">
            Why do you want to be a Ministry Partner? (optional)
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Tell us about your ministry and the musicians in your community…"
            rows={3}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:border-[#FF3700]/50 focus:outline-none resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-[#FF3700] hover:bg-[#CC2E00] disabled:opacity-60 text-white font-bold text-sm rounded-full py-3 transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
            </>
          ) : (
            "Submit Application →"
          )}
        </button>
        <p className="text-white/30 text-xs text-center">
          You&apos;ll keep your Community Partner link while we review your application.
        </p>
      </form>
    </div>
  );
}
