"use client";

import { useState } from "react";
import { Crown, AlertTriangle, Clock, Loader2 } from "lucide-react";

const TIERS: Record<string, { name: string; months: number; commission: number; payouts: string }> = {
  Soundcheck: { name: "Soundcheck", months: 1, commission: 15, payouts: "Monthly" },
  Mainstage: { name: "Mainstage", months: 6, commission: 12, payouts: "Bi-weekly" },
  Headliner: { name: "Headliner", months: 12, commission: 10, payouts: "Weekly" },
};

const KYSHI_COUNTRIES = ["NIGERIA", "KENYA", "GHANA"];
const GRACE_DAYS = 7;

// Musician.selectedPlan is the uppercase SubscriptionTier enum
// (SOUNDCHECK/MAINSTAGE/HEADLINER); TIERS above is keyed by the Title
// Case FeePlan name subscription.subscriptionType already uses (set by
// prepareSubscriptionInstallment) — this bridges the one place both
// meet.
const SELECTED_PLAN_TO_TIER_NAME: Record<string, string> = { SOUNDCHECK: "Soundcheck", MAINSTAGE: "Mainstage", HEADLINER: "Headliner" };

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000));
}

function formatDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export type PlainSubscription = {
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";
  subscriptionType: string;
  nextBillingDate: string | Date | null;
} | null;

// Ported from the Base44 app's src/components/subscription/SubscriptionCard.jsx.
// Adapted to the dashboard's light card theme (the source's internal
// tokens were dark, inconsistent with the rest of MusicianDashboard.jsx —
// not a deliberate design choice worth preserving). "Past due" isn't a
// stored SubStatus value in this schema (ACTIVE/CANCELLED/EXPIRED/PENDING
// only) — derived here the same way the plan called for: ACTIVE with
// nextBillingDate in the past.
export default function SubscriptionCard({ musicianId, country, selectedPlan, subscription }: { musicianId: string; country: string | null; selectedPlan: string | null; subscription: PlainSubscription }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlanName = selectedPlan ? SELECTED_PLAN_TO_TIER_NAME[selectedPlan] : undefined;
  const tierId = subscription?.subscriptionType && TIERS[subscription.subscriptionType] ? subscription.subscriptionType : selectedPlanName && TIERS[selectedPlanName] ? selectedPlanName : "Soundcheck";
  const tier = TIERS[tierId];

  const usesKyshi = country ? KYSHI_COUNTRIES.includes(country) : false;

  const status = subscription?.status ?? "NONE";
  const dueDate = subscription?.nextBillingDate ? new Date(subscription.nextBillingDate) : null;
  const daysUntilDue = dueDate ? daysBetween(dueDate, new Date()) : null;

  const isActive = status === "ACTIVE";
  const isPastDue = isActive && daysUntilDue !== null && daysUntilDue < 0;
  const isExpired = status === "EXPIRED";
  const needsPayment = !isActive || (daysUntilDue !== null && daysUntilDue <= 7);

  const handlePay = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const endpoint = usesKyshi ? "/api/payments/kyshi/initialize-subscription" : "/api/payments/payfast/initialize-subscription";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicianId, tier: tierId }),
      });
      const out = await res.json();

      if (!res.ok || out?.error) {
        setError(out?.error || "Could not start payment. Please try again.");
        setIsProcessing(false);
        return;
      }

      if (out.authorizationUrl) {
        window.location.href = out.authorizationUrl;
        return;
      }

      if (out.paymentUrl && out.paymentData) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = out.paymentUrl;
        Object.entries(out.paymentData as Record<string, string>).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      setError("The payment provider did not return a checkout link. Please try again.");
      setIsProcessing(false);
    } catch {
      setError("Could not start payment. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm ${isPastDue || isExpired ? "border-amber-400 border-2" : isActive ? "border-orange-400 border-2" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-gray-900 text-sm">{tier.name} Subscription</h3>
        </div>
        {isActive && !isPastDue && <span className="bg-green-100 text-green-800 text-[10px] font-semibold rounded-full px-2 py-0.5">Active</span>}
        {isPastDue && <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold rounded-full px-2 py-0.5">Payment due</span>}
        {isExpired && <span className="bg-red-100 text-red-800 text-[10px] font-semibold rounded-full px-2 py-0.5">Paused</span>}
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {tier.commission}% commission on sales · {tier.payouts} payouts · Billed every {tier.months} month{tier.months === 1 ? "" : "s"}
      </p>

      {isExpired && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-red-800">Your storefront is paused</p>
            <p className="text-red-700 mt-1">Nothing has been deleted — your tracks, fans and earnings are all intact. Paying the outstanding installment restores your storefront right away.</p>
          </div>
        </div>
      )}

      {isPastDue && dueDate && (
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-semibold text-amber-800">Payment overdue</p>
            <p className="text-amber-700 mt-1">
              Due {formatDate(dueDate)}. Your storefront stays live for {GRACE_DAYS} days from then, so pay before {formatDate(new Date(dueDate.getTime() + GRACE_DAYS * 86400000))} to avoid interruption.
            </p>
          </div>
        </div>
      )}

      {isActive && !isPastDue && dueDate && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 mb-4">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Next installment</p>
            <p className="font-semibold text-sm text-gray-900">{formatDate(dueDate)}</p>
          </div>
          {daysUntilDue !== null && daysUntilDue >= 0 && (
            <p className="text-xs text-gray-500">
              in {daysUntilDue} day{daysUntilDue === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 mb-4 text-xs text-red-700">{error}</div>}

      {needsPayment ? (
        <button
          type="button"
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Opening checkout…
            </>
          ) : isExpired || isPastDue ? (
            "Pay now and restore storefront"
          ) : isActive ? (
            "Pay next installment"
          ) : (
            "Pay now"
          )}
        </button>
      ) : (
        <p className="text-xs text-gray-400 text-center">We&apos;ll email you 7 days before your next installment is due. Nothing is charged automatically.</p>
      )}
    </div>
  );
}
