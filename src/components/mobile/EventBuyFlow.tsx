"use client";

import { useState } from "react";
import { CreditCard, Smartphone, Landmark } from "lucide-react";
import { formatFromZar } from "@/lib/pricingConfig";
import type { KyshiChannel } from "@/lib/validation/kyshiInitialize";

type PlainEvent = { id: string; title: string; ticketPrice: number; remaining: number };
type Musician = { id: string; musicianName: string; country: string | null };

// Tickets are fixed-price (Event.ticketPrice), unlike tracks — no
// name-your-price step, just quantity then the same real payment-rail
// choice TrackBuyFlow offers (Kyshi's 3 genuine channels vs. Payfast's
// single option).
export default function EventBuyFlow({
  event,
  musician,
  fanEmail: initialFanEmail,
  fanName: initialFanName,
}: {
  event: PlainEvent;
  musician: Musician;
  fanEmail: string;
  fanName: string;
}) {
  const gateway: "kyshi" | "payfast" = musician.country === "NIGERIA" ? "kyshi" : "payfast";

  const [step, setStep] = useState<"details" | "pay">("details");
  const [quantity, setQuantity] = useState(1);
  const [fanEmail, setFanEmail] = useState(initialFanEmail);
  const [fanName, setFanName] = useState(initialFanName);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const total = event.ticketPrice * quantity;
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
        const res = await fetch("/api/payments/kyshi/initialize-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: event.id, musicianId: musician.id, fanEmail, fanName: fanName || undefined, quantity, channel }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Something went wrong. Please try again.");
        window.location.href = body.authorizationUrl;
        return;
      }

      const res = await fetch("/api/payments/payfast/initialize-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, musicianId: musician.id, fanEmail, fanName: fanName || undefined, quantity }),
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
      <div>
        <button type="button" onClick={() => setStep("details")} className="mb-4 min-h-[44px] text-[12px] font-semibold" style={{ color: "var(--m-text-muted)" }}>
          ← Back
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Choose how to pay</p>
        <h2 className="mt-2 text-[22px] font-extrabold">{formatFromZar(total, "ZAR")}</h2>

        {error && <p className="mt-4 border-l-4 px-3 py-2 text-[12px] font-semibold" style={{ borderColor: "var(--m-accent)", background: "#fff2ef", color: "#5c1b0c" }}>{error}</p>}

        <div className="mt-5 flex flex-col gap-2">
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
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Tickets</p>
      <div className="flex items-center justify-between border-2 px-4 py-2" style={{ borderColor: "var(--m-line)" }}>
        <span className="text-[13px] font-bold">{formatFromZar(event.ticketPrice, "ZAR")} each</span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center text-[18px] font-extrabold" style={{ background: "var(--m-ground)" }}>−</button>
          <span className="w-4 text-center text-[15px] font-extrabold">{quantity}</span>
          <button type="button" onClick={() => setQuantity((q) => Math.min(event.remaining, q + 1))} className="flex h-9 w-9 items-center justify-center text-[18px] font-extrabold" style={{ background: "var(--m-ground)" }}>+</button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <input className={fieldClass} type="email" required placeholder="Your email" value={fanEmail} onChange={(e) => setFanEmail(e.target.value)} />
        <input className={fieldClass} placeholder="Your name (optional)" value={fanName} onChange={(e) => setFanName(e.target.value)} />
      </div>

      <button
        type="button"
        onClick={() => setStep("pay")}
        disabled={!fanEmail}
        className="mt-4 flex min-h-[52px] w-full items-center justify-between px-4 text-[13px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        {formatFromZar(total, "ZAR")} — choose how to pay
      </button>
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
