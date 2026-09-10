"use client";

import { useState } from "react";
import { CreditCard, Smartphone, Landmark } from "lucide-react";
import { convertFromZar, formatAmount, type CurrencyCode } from "@/lib/pricingConfig";
import { FAN_SUBSCRIPTION_MIN_ZAR } from "@/lib/payments/fanSubscriptionPricing";
import type { KyshiChannel } from "@/lib/validation/kyshiInitialize";

type Musician = { id: string; musicianName: string; country: string | null };

// Fan -> musician monthly support. Same gateway split and real-vs-single
// payment-rail choice as TrackBuyFlow/EventBuyFlow — see those for why.
// Every payment here is a single month's installment: ENKORE doesn't
// auto-debit (same "not a real recurring subscription" constraint the
// existing MusicianSubscription flow documents), so this always reads as
// "support this month," not "set up autopay."
export default function SupportFlow({
  musician,
  fanEmail: initialFanEmail,
  fanName: initialFanName,
  onClose,
}: {
  musician: Musician;
  fanEmail: string;
  fanName: string;
  onClose: () => void;
}) {
  const gateway: "kyshi" | "payfast" = musician.country === "NIGERIA" ? "kyshi" : "payfast";
  const currency: CurrencyCode = gateway === "kyshi" ? "NGN" : "ZAR";
  const minAmount = convertFromZar(FAN_SUBSCRIPTION_MIN_ZAR, currency);
  const presets = [minAmount, minAmount * 2, minAmount * 4];

  const [step, setStep] = useState<"amount" | "pay">("amount");
  const [amount, setAmount] = useState(presets[0]);
  const [fanEmail, setFanEmail] = useState(initialFanEmail);
  const [fanName, setFanName] = useState(initialFanName);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const fieldClass = "min-h-[48px] w-full border-2 bg-[var(--m-ground)] px-3 text-[14px] outline-none focus:border-[var(--m-accent)]";

  const startPay = async (channel?: KyshiChannel) => {
    if (!fanEmail) {
      setError("Enter your email first.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      if (gateway === "kyshi") {
        const res = await fetch("/api/payments/kyshi/initialize-fan-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ musicianId: musician.id, fanEmail, fanName: fanName || undefined, amount, channel }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Something went wrong. Please try again.");
        window.location.href = body.authorizationUrl;
        return;
      }

      const res = await fetch("/api/payments/payfast/initialize-fan-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicianId: musician.id, fanEmail, fanName: fanName || undefined, amount }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Something went wrong. Please try again.");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = body.paymentUrl;
      for (const [key, value] of Object.entries(body.paymentData as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Please try again.");
    }
  };

  if (step === "pay") {
    return (
      <div className="border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
        <button type="button" onClick={() => setStep("amount")} className="mb-3 min-h-11 text-[12px] font-semibold" style={{ color: "var(--m-text-muted)" }}>
          ← Back
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Choose how to pay</p>
        <h2 className="mt-2 text-[20px] font-extrabold">{formatAmount(amount, currency)} / month</h2>

        {error && <p className="mt-4 border-l-4 px-3 py-2 text-[12px] font-semibold" style={{ borderColor: "var(--m-accent)", background: "#fff2ef", color: "#5c1b0c" }}>{error}</p>}

        <div className="mt-4 flex flex-col gap-2">
          {gateway === "kyshi" ? (
            <>
              <PayRailButton icon={Smartphone} label="Mobile Money" onClick={() => startPay("mobileMoney")} disabled={status === "submitting"} />
              <PayRailButton icon={CreditCard} label="Card" onClick={() => startPay("card")} disabled={status === "submitting"} />
              <PayRailButton icon={Landmark} label="Bank Transfer" onClick={() => startPay("bankTransfer")} disabled={status === "submitting"} />
            </>
          ) : (
            <PayRailButton icon={CreditCard} label="Card / EFT" onClick={() => startPay()} disabled={status === "submitting"} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Support monthly</p>
        <button type="button" onClick={onClose} className="min-h-8 text-[12px] font-semibold" style={{ color: "var(--m-text-muted)" }}>Close</button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className="flex min-h-12 items-center justify-center px-2 text-[13px] font-bold"
            style={{ background: amount === p ? "var(--m-accent)" : "var(--m-ground)", color: amount === p ? "#fff" : "var(--m-ink)" }}
          >
            {formatAmount(p, currency)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <input className={fieldClass} type="email" required placeholder="Your email" value={fanEmail} onChange={(e) => setFanEmail(e.target.value)} />
        <input className={fieldClass} placeholder="Your name (optional)" value={fanName} onChange={(e) => setFanName(e.target.value)} />
      </div>

      <button
        type="button"
        onClick={() => setStep("pay")}
        disabled={!fanEmail}
        className="mt-4 flex min-h-[52px] w-full items-center justify-center px-4 text-[13px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        {formatAmount(amount, currency)} / month — choose how to pay
      </button>
      <p className="mt-2 text-center text-[11px]" style={{ color: "var(--m-text-faint)" }}>
        One month at a time — no auto-billing.
      </p>
    </div>
  );
}

function PayRailButton({ icon: Icon, label, onClick, disabled }: { icon: typeof CreditCard; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex min-h-14 items-center gap-3 border-2 px-4 text-left disabled:opacity-60" style={{ borderColor: "var(--m-line)" }}>
      <Icon className="h-5 w-5 flex-none" style={{ color: "var(--m-accent)" }} />
      <span className="text-[14px] font-bold">{label}</span>
    </button>
  );
}
