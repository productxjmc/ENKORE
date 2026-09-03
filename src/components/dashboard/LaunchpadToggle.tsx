"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, CheckCircle, Circle, Sparkles, Loader2 } from "lucide-react";

const PLANS = [
  { id: "Soundcheck", priceZar: 200, billingLabel: "/month", commission: 15, payoutFrequency: "Monthly", accent: "text-gray-300", ring: "border-gray-700", badge: undefined },
  { id: "Mainstage", priceZar: 1200, billingLabel: "/6 months", commission: 12, payoutFrequency: "Bi-weekly", accent: "text-orange-400", ring: "border-orange-500", badge: "Most Popular" },
  { id: "Headliner", priceZar: 2400, billingLabel: "/year", commission: 10, payoutFrequency: "Weekly", accent: "text-gray-300", ring: "border-gray-700", badge: "Best Value" },
] as const;

export type LaunchpadMusician = {
  isLive: boolean;
  selectedPlan: "SOUNDCHECK" | "MAINSTAGE" | "HEADLINER" | null;
  profileImage: string | null;
  bio: string | null;
  requirementsStatus: string;
};

const ENUM_TO_PLAN_NAME: Record<string, string> = { SOUNDCHECK: "Soundcheck", MAINSTAGE: "Mainstage", HEADLINER: "Headliner" };

// Ported from the Base44 app's src/components/dashboard/LaunchpadToggle.jsx.
// The checklist here is purely informational — the actual gate lives
// server-side in /api/musician/launch, which re-checks everything
// (including whether a subscription is genuinely paid) rather than
// trusting this component's view of the world.
export default function LaunchpadToggle({
  musician,
  tracksCount,
  payoutComplete,
}: {
  musician: LaunchpadMusician;
  tracksCount: number;
  payoutComplete: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(musician.selectedPlan ? ENUM_TO_PLAN_NAME[musician.selectedPlan] : null);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const checklist = [
    { label: "Profile image uploaded", done: Boolean(musician.profileImage) },
    { label: "Bio completed", done: Boolean(musician.bio && musician.bio.trim().length > 20) },
    { label: "At least one track uploaded", done: tracksCount > 0 },
    { label: "Bank details added", done: payoutComplete },
    { label: "Requirements approved", done: musician.requirementsStatus === "APPROVED" },
  ];
  const completedCount = checklist.filter((c) => c.done).length;
  const allComplete = checklist.every((c) => c.done);

  const persistLive = async (live: boolean, plan?: string) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/musician/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goLive: live, plan: live ? plan : undefined }),
      });
      const out = await res.json();

      if (out?.requiresPayment) {
        setShowPlans(false);
        setMessage({ kind: "error", text: "Activate your subscription in the Subscription panel below, then flip this switch again." });
        return;
      }
      if (!res.ok) {
        setMessage({ kind: "error", text: out?.blockers?.length ? out.blockers.join(" ") : out?.error || "Could not update launch status." });
        return;
      }

      setShowPlans(false);
      setMessage({ kind: "success", text: live ? "You are LIVE! Your storefront is now public and ready to accept sales." : "Storefront paused — now hidden from the public." });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Could not update launch status. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = () => {
    if (musician.isLive) {
      persistLive(false);
      return;
    }
    if (!allComplete) {
      setMessage({ kind: "error", text: `Complete ${checklist.length - completedCount} remaining item${checklist.length - completedCount === 1 ? "" : "s"} before going live.` });
      return;
    }
    setShowPlans(true);
  };

  return (
    <div className="bg-black text-white rounded-2xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${musician.isLive ? "bg-green-500/20" : "bg-orange-500/20"}`}>
            <Rocket className={`w-5 h-5 ${musician.isLive ? "text-green-400" : "text-orange-400"}`} />
          </div>
          <div>
            <h3 className="font-black text-lg">Storefront Launchpad</h3>
            <p className="text-gray-400 text-xs">{musician.isLive ? "Live & accepting sales" : "Draft mode — not yet public"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${musician.isLive ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-400"}`}>
            {musician.isLive ? "LIVE" : "DRAFT"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={musician.isLive}
            onClick={handleToggle}
            disabled={saving}
            className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-60 ${musician.isLive ? "bg-green-500" : "bg-gray-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${musician.isLive ? "translate-x-5" : ""}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className={`mx-6 mt-4 rounded-lg px-3 py-2 text-xs ${message.kind === "success" ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>{message.text}</div>
      )}

      {!musician.isLive && (
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-300">Launch checklist</p>
            <p className="text-xs text-gray-500">
              {completedCount}/{checklist.length} complete
            </p>
          </div>
          <div className="space-y-2.5">
            {checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                {item.done ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> : <Circle className="w-4 h-4 text-gray-600 shrink-0" />}
                <span className={`text-sm ${item.done ? "text-gray-300" : "text-gray-500"}`}>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${(completedCount / checklist.length) * 100}%` }} />
          </div>
        </div>
      )}

      {showPlans && !musician.isLive && (
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <p className="text-sm font-bold text-gray-300">Choose your subscription tier</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative text-left rounded-xl border-2 bg-gray-950 p-4 transition-all duration-200 ${plan.ring} ${isSelected ? "ring-2 ring-orange-500" : "opacity-80 hover:opacity-100"}`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white whitespace-nowrap">{plan.badge}</span>
                  )}
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${plan.accent}`}>{plan.id}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-2xl font-black text-white">R{plan.priceZar.toLocaleString("en-ZA")}</span>
                    <span className="text-gray-500 text-xs mb-1">{plan.billingLabel}</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>
                      Commission: <span className="font-bold text-white">{plan.commission}%</span>
                    </p>
                    <p>
                      Payouts: <span className="font-bold text-white">{plan.payoutFrequency}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => selectedPlan && persistLive(true, selectedPlan)}
              disabled={saving || !selectedPlan}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Go Live"}
            </button>
            <button type="button" onClick={() => setShowPlans(false)} className="text-gray-400 hover:text-white text-sm font-semibold px-4 py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {musician.isLive && musician.selectedPlan && (
        <div className="px-6 py-5">
          <div className="flex items-center justify-between bg-gray-950 border border-gray-800 rounded-xl px-4 py-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Active tier</p>
              <p className="font-black text-white">{ENUM_TO_PLAN_NAME[musician.selectedPlan]}</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-3">Turning this off pauses your public storefront — fans will no longer be able to view or purchase. You can reactivate anytime.</p>
        </div>
      )}
    </div>
  );
}
