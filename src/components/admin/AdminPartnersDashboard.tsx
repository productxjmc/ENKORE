"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Copy, Check, Trash2, Crown, CheckCircle, XCircle, ArrowUpCircle } from "lucide-react";
import SlaBadge from "@/components/admin/SlaBadge";
import type { PlainAffiliate } from "@/components/partners/PartnerDashboard";

const TIER_LABELS: Record<string, string> = { COMMUNITY: "Community", MINISTRY: "Ministry", AMBASSADOR: "Ambassador" };
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://enkore.co.za";

// Ported from the Base44 app's src/pages/AdminAffiliates.jsx. The source
// used @tanstack/react-query + sonner toasts, neither of which is wired up
// anywhere else in this rebuild (no QueryClientProvider, sonner isn't even
// a dependency) — this follows the plain useState+fetch convention every
// other admin/form component in this app already uses instead.
export default function AdminPartnersDashboard({ initialAffiliates }: { initialAffiliates: PlainAffiliate[] }) {
  const [affiliates, setAffiliates] = useState<PlainAffiliate[]>(initialAffiliates);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: "", name: "" });
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const flash = (kind: "success" | "error", text: string) => {
    setMessage({ kind, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const patchAffiliate = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const out = await res.json();
      if (!res.ok) {
        flash("error", out?.error || "Update failed");
        return;
      }
      setAffiliates((prev) => prev.map((a) => (a.id === id ? out.affiliate : a)));
      flash("success", "Partner updated");
    } catch {
      flash("error", "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const approveMinistry = (id: string) => patchAffiliate(id, { action: "approve_ministry" });
  const reject = (id: string) => patchAffiliate(id, { action: "reject" });
  const promote = (id: string) => patchAffiliate(id, { action: "promote" });

  const deleteAffiliate = async (id: string) => {
    if (!confirm("Delete this partner?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const out = await res.json().catch(() => null);
        flash("error", out?.error || "Delete failed");
        return;
      }
      setAffiliates((prev) => prev.filter((a) => a.id !== id));
      flash("success", "Partner deleted");
    } catch {
      flash("error", "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name) {
      flash("error", "Please fill in all fields");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const out = await res.json();
      if (!res.ok) {
        flash("error", out?.error || "Failed to create partner");
        return;
      }
      setAffiliates((prev) => [out.affiliate, ...prev]);
      setShowForm(false);
      setFormData({ email: "", name: "" });
      flash("success", "Partner created");
    } catch {
      flash("error", "Failed to create partner");
    } finally {
      setCreating(false);
    }
  };

  const copyReferralLink = (code: string) => {
    const link = `${APP_URL}/musician-pre-register?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const pendingVerifications = affiliates.filter((a) => a.verificationStatus === "PENDING");

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white text-xs font-semibold tracking-widest uppercase transition-colors py-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-5 pb-24 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black">Partner Management</h1>
            <p className="text-white/50 text-sm mt-1">Manage ENKORE Partner Program members</p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-[#FF3700] hover:bg-[#CC2E00] text-white font-bold text-sm rounded-full px-5 py-3 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Partner
          </button>
        </div>

        {message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              message.kind === "success" ? "bg-green-500/10 border-green-500/25 text-green-400" : "bg-red-500/10 border-red-500/25 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {pendingVerifications.length > 0 && (
          <div className="bg-[#141414] border border-[#FF3700]/25 rounded-2xl p-5">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700] mb-4">
              Pending Tier Verifications ({pendingVerifications.length})
            </p>
            <div className="space-y-3">
              {pendingVerifications.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 bg-black/40 border border-white/10 rounded-xl p-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {a.name} — <span className="text-white/50">{a.email}</span>
                    </p>
                    <p className="text-xs text-white/40 flex items-center gap-2 flex-wrap mt-1">
                      <span>
                        Ministry: {a.ministryName || "—"} · Role: {a.ministryRole || "—"}
                      </span>
                      <SlaBadge date={a.joinedAt || a.createdAt} />
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => approveMinistry(a.id)}
                      className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-bold rounded-full px-4 py-2 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve Ministry
                    </button>
                    <button
                      type="button"
                      disabled={busyId === a.id}
                      onClick={() => reject(a.id)}
                      className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-60 text-white text-xs font-bold rounded-full px-4 py-2 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-[#141414] border border-white/7 rounded-2xl p-5">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700]/70 mb-4">Create New Partner</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/50 mb-1.5 block">Partner Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:border-[#FF3700]/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/50 mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="partner@example.com"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:border-[#FF3700]/50 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-[#FF3700] hover:bg-[#CC2E00] disabled:opacity-60 text-white font-bold text-sm rounded-full px-5 py-2.5 transition-colors"
                >
                  {creating ? "Creating…" : "Create Partner"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-full px-5 py-2.5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-[#141414] border border-white/7 rounded-2xl p-5">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/40 mb-4">Partners ({affiliates.length})</p>
          {affiliates.length === 0 ? (
            <p className="text-white/40 text-sm">No partners yet. Create one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-bold tracking-[0.15em] uppercase text-white/30 border-b border-white/10">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Tier</th>
                    <th className="py-2 pr-4">Conv.</th>
                    <th className="py-2 pr-4">Earnings</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((a) => (
                    <tr key={a.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-4 font-medium">
                        {a.name}
                        {a.foundingMember && <Crown className="w-3.5 h-3.5 text-[#FF3700] inline ml-1" />}
                      </td>
                      <td className="py-3 pr-4 text-white/60">{a.email}</td>
                      <td className="py-3 pr-4">
                        <code className="bg-black/60 border border-white/10 px-2 py-1 rounded text-xs">{a.referralCode}</code>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-[10px] font-bold tracking-widest uppercase rounded-full px-2.5 py-1 ${
                            a.tier === "COMMUNITY" ? "bg-white/10 text-white/60" : "bg-[#FF3700]/15 text-[#FF3700]"
                          }`}
                        >
                          {TIER_LABELS[a.tier] || "Community"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{a.conversions || 0}</td>
                      <td className="py-3 pr-4">R{(a.pendingEarnings || 0).toLocaleString()}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-[10px] font-bold tracking-widest uppercase rounded-full px-2.5 py-1 ${
                            a.status === "ACTIVE" ? "bg-green-500/15 text-green-400" : "bg-white/10 text-white/50"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyReferralLink(a.referralCode)}
                            title="Copy referral link"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                          >
                            {copiedCode === a.referralCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          {a.tier !== "AMBASSADOR" && (
                            <button
                              type="button"
                              disabled={busyId === a.id}
                              onClick={() => promote(a.id)}
                              title={`Promote to ${a.tier === "COMMUNITY" ? "Ministry" : "Ambassador"}`}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-60 transition-colors"
                            >
                              <ArrowUpCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busyId === a.id}
                            onClick={() => deleteAffiliate(a.id)}
                            title="Delete partner"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-60 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
