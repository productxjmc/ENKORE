"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CreditCard, Smartphone, Landmark } from "lucide-react";
import { convertFromZar, formatAmount, formatFromZar, type CurrencyCode } from "@/lib/pricingConfig";
import type { KyshiChannel } from "@/lib/validation/kyshiInitialize";

type PlainTrack = {
  id: string;
  title: string;
  genre: string | null;
  coverArt: string | null;
  basePrice: number | null;
  minimumPrice: number;
  payWhatYouWant: boolean;
};

type Musician = { id: string; musicianName: string; country: string | null };

// Same gateway split the web storefront's TrackCheckout already uses —
// Nigeria-country musicians route through Kyshi, everyone else through
// Payfast. What's new here (native rail picker) only applies on the
// Kyshi side: its channels array can genuinely be narrowed to one value
// (confirmed against Kyshi's own docs), so Card/Mobile Money/Bank
// Transfer are three real, distinct choices — Payfast has no such
// concept in this integration, so it's a single option, not a fake
// multi-way picker.
export default function TrackBuyFlow({
  track,
  musician,
  fanEmail: initialFanEmail,
  fanName: initialFanName,
}: {
  track: PlainTrack;
  musician: Musician;
  fanEmail: string;
  fanName: string;
}) {
  const gateway: "kyshi" | "payfast" = musician.country === "NIGERIA" ? "kyshi" : "payfast";
  const currency: CurrencyCode = gateway === "kyshi" ? "NGN" : "ZAR";
  const zarBase = track.payWhatYouWant ? track.minimumPrice : track.basePrice ?? track.minimumPrice;
  const minAmount = convertFromZar(track.minimumPrice, currency);
  const priceStep = Math.max(1, Math.round(minAmount * 0.1));

  const [step, setStep] = useState<"amount" | "pay">("amount");
  const [fanEmail, setFanEmail] = useState(initialFanEmail);
  const [fanName, setFanName] = useState(initialFanName);
  const [amount, setAmount] = useState(convertFromZar(zarBase, currency));
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const startPay = async (channel?: KyshiChannel) => {
    if (!fanEmail) {
      setError("Enter your email first.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      if (gateway === "kyshi") {
        const res = await fetch("/api/payments/kyshi/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackId: track.id, musicianId: musician.id, fanEmail, fanName: fanName || undefined, amount, localCurrency: "NGN", channel }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Something went wrong. Please try again.");
        window.location.href = body.authorizationUrl;
        return;
      }

      const res = await fetch("/api/payments/payfast/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id, musicianId: musician.id, fanEmail, fanName: fanName || undefined, amount }),
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

  const fieldClass = "min-h-[48px] w-full border-2 bg-[var(--m-ground)] px-3 text-[14px] outline-none focus:border-[var(--m-accent)]";

  if (step === "pay") {
    return (
      <div className="p-4">
        <button type="button" onClick={() => setStep("amount")} className="mb-4 flex min-h-[44px] items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--m-text-muted)" }}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>
          Choose how to pay
        </p>
        <h1 className="mt-2 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">{formatAmount(amount, currency)}</h1>

        {error && <p className="mt-4 border-l-4 px-3 py-2 text-[12px] font-semibold" style={{ borderColor: "var(--m-accent)", background: "#fff2ef", color: "#5c1b0c" }}>{error}</p>}

        <div className="mt-5 flex flex-col gap-2">
          {gateway === "kyshi" ? (
            <>
              <PayRailButton icon={Smartphone} label="Mobile Money" hint="MTN, Airtel and more, via Kyshi" onClick={() => startPay("mobileMoney")} disabled={status === "submitting"} />
              <PayRailButton icon={CreditCard} label="Card" hint="Visa or Mastercard, via Kyshi" onClick={() => startPay("card")} disabled={status === "submitting"} />
              <PayRailButton icon={Landmark} label="Bank Transfer" hint="Pay from your bank app, via Kyshi" onClick={() => startPay("bankTransfer")} disabled={status === "submitting"} />
            </>
          ) : (
            <PayRailButton icon={CreditCard} label="Card / EFT" hint="Via Payfast" onClick={() => startPay()} disabled={status === "submitting"} />
          )}
        </div>
        {status === "submitting" && <p className="mt-4 text-center text-[12px]" style={{ color: "var(--m-text-faint)" }}>Redirecting…</p>}
      </div>
    );
  }

  return (
    <div className="p-4">
      <Link href={`/m/u/${musician.id}`} className="mb-4 flex min-h-[44px] items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--m-text-muted)" }}>
        <ArrowLeft className="h-4 w-4" /> Back to {musician.musicianName}
      </Link>

      <div className="flex items-center gap-3 border-b-2 pb-4" style={{ borderColor: "var(--m-line)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URLs */}
        <img src={track.coverArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop"} alt="" className="h-20 w-20 grayscale" style={{ objectFit: "cover" }} />
        <div>
          <h1 className="text-[20px] font-extrabold leading-[1.05] tracking-[-0.02em]">{track.title}</h1>
          <p className="mt-1.5 text-[12px]" style={{ color: "var(--m-text-muted)" }}>{musician.musicianName} · {track.genre ?? "Gospel"}</p>
        </div>
      </div>

      {error && <p className="mt-4 border-l-4 px-3 py-2 text-[12px] font-semibold" style={{ borderColor: "var(--m-accent)", background: "#fff2ef", color: "#5c1b0c" }}>{error}</p>}

      <div className="mt-5 flex flex-col gap-3">
        <input className={fieldClass} type="email" required placeholder="Your email" value={fanEmail} onChange={(e) => setFanEmail(e.target.value)} />
        <input className={fieldClass} placeholder="Your name (optional)" value={fanName} onChange={(e) => setFanName(e.target.value)} />
      </div>

      {track.payWhatYouWant && (
        <>
          <p className="mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>
            Name your price
          </p>
          <p className="mb-3 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
            Minimum {formatFromZar(track.minimumPrice, currency)}. Everything above it goes to {musician.musicianName}.
          </p>
          <div className="flex border-2" style={{ borderColor: "var(--m-line)" }}>
            <button type="button" onClick={() => setAmount((a) => Math.max(minAmount, a - priceStep))} className="min-h-16 w-14 border-r-2 text-[22px] font-extrabold" style={{ borderColor: "var(--m-line)" }}>
              −
            </button>
            <div className="flex flex-1 flex-col justify-center px-4">
              <span className="text-[26px] font-extrabold">{formatAmount(amount, currency)}</span>
            </div>
            <button type="button" onClick={() => setAmount((a) => a + priceStep)} className="min-h-16 w-14 border-l-2 text-[22px] font-extrabold" style={{ borderColor: "var(--m-line)" }}>
              +
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setStep("pay")}
        disabled={!fanEmail}
        className="mt-6 flex min-h-[52px] w-full items-center justify-between px-4 text-[13px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        Choose how to pay <ArrowRight className="h-[18px] w-[18px]" />
      </button>
      <p className="mt-3 text-center text-[11px]" style={{ color: "var(--m-text-faint)" }}>
        Instant MP3 + WAV download once payment clears.
      </p>
    </div>
  );
}

function PayRailButton({
  icon: Icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: typeof CreditCard;
  label: string;
  hint: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-16 items-center gap-3 border-2 px-4 text-left disabled:opacity-60"
      style={{ borderColor: "var(--m-line)" }}
    >
      <Icon className="h-5 w-5 flex-none" style={{ color: "var(--m-accent)" }} />
      <span>
        <span className="block text-[14px] font-bold">{label}</span>
        <span className="block text-[11px]" style={{ color: "var(--m-text-muted)" }}>{hint}</span>
      </span>
    </button>
  );
}
