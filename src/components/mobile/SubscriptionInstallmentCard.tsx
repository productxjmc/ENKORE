"use client";

import { useState } from "react";

const TIERS: Record<string, { name: string; months: number; commission: number; payouts: string }> = {
  Soundcheck: { name: "Soundcheck", months: 1, commission: 15, payouts: "Monthly" },
  Mainstage: { name: "Mainstage", months: 6, commission: 12, payouts: "Bi-weekly" },
  Headliner: { name: "Headliner", months: 12, commission: 10, payouts: "Weekly" },
};

const KYSHI_COUNTRIES = ["NIGERIA", "KENYA", "GHANA"];
const GRACE_DAYS = 7;
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

// Mobile-styled sibling of src/components/subscription/SubscriptionCard.tsx
// — same logic (status derivation, gateway routing, payment kick-off
// against the existing initialize-subscription routes), rebuilt against
// the .enkore-m design tokens rather than reused directly, per this
// app's standing rule that the mobile design system stays genuinely
// separate from the dashboard's light functional-admin style.
export default function SubscriptionInstallmentCard({
  musicianId,
  country,
  selectedPlan,
  subscription,
}: {
  musicianId: string;
  country: string | null;
  selectedPlan: string | null;
  subscription: PlainSubscription;
}) {
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
        for (const [key, value] of Object.entries(out.paymentData as Record<string, string>)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }
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
    <div className="border-2 p-4" style={{ borderColor: isPastDue || isExpired ? "var(--m-accent)" : "var(--m-line)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-extrabold">{tier.name} Subscription</p>
        {isActive && !isPastDue && <span className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: "#1a7f37" }}>Active</span>}
        {isPastDue && <span className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--m-accent)" }}>Payment due</span>}
        {isExpired && <span className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--m-accent)" }}>Paused</span>}
      </div>
      <p className="mt-1 text-[12px]" style={{ color: "var(--m-text-muted)" }}>
        {tier.commission}% commission · {tier.payouts} payouts · billed every {tier.months} month{tier.months === 1 ? "" : "s"}
      </p>

      {isExpired && (
        <p className="mt-3 border-l-4 px-3 py-2 text-[12px]" style={{ borderColor: "var(--m-accent)", background: "#fff2ef", color: "#5c1b0c" }}>
          Your storefront is paused. Nothing has been deleted — paying the outstanding installment restores it right away.
        </p>
      )}
      {isPastDue && dueDate && (
        <p className="mt-3 border-l-4 px-3 py-2 text-[12px]" style={{ borderColor: "var(--m-accent)", background: "#fff2ef", color: "#5c1b0c" }}>
          Overdue since {formatDate(dueDate)}. Stays live {GRACE_DAYS} days from then.
        </p>
      )}
      {isActive && !isPastDue && dueDate && (
        <div className="mt-3 flex items-center justify-between px-3 py-2" style={{ background: "var(--m-ground)" }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>Next installment</p>
            <p className="text-[13px] font-bold">{formatDate(dueDate)}</p>
          </div>
          {daysUntilDue !== null && daysUntilDue >= 0 && <p className="text-[12px]" style={{ color: "var(--m-text-muted)" }}>in {daysUntilDue}d</p>}
        </div>
      )}

      {error && <p className="mt-3 text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>{error}</p>}

      {needsPayment ? (
        <button
          type="button"
          onClick={handlePay}
          disabled={isProcessing}
          className="mt-3 flex min-h-11 w-full items-center justify-center px-4 text-[12px] font-bold text-white disabled:opacity-60"
          style={{ background: "var(--m-accent)" }}
        >
          {isProcessing ? "Opening checkout…" : isExpired || isPastDue ? "Pay now and restore storefront" : isActive ? "Pay next installment" : "Pay now"}
        </button>
      ) : (
        <p className="mt-3 text-center text-[11px]" style={{ color: "var(--m-text-faint)" }}>
          We&apos;ll remind you 7 days before your next installment. Nothing is charged automatically.
        </p>
      )}
    </div>
  );
}
