"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MIN_PAYOUT_ZAR = 500;
const METHODS = [
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "PAYFAST", label: "PayFast" },
  { value: "MOBILE_MONEY", label: "Mobile money" },
] as const;

export default function PayoutRequestForm({ pendingEarnings, hasPendingRequest }: { pendingEarnings: number; hasPendingRequest: boolean }) {
  const router = useRouter();
  const [method, setMethod] = useState<(typeof METHODS)[number]["value"]>("BANK_TRANSFER");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const fieldClass = "min-h-[44px] w-full border-2 bg-[var(--m-ground)] px-3 text-[13px] outline-none focus:border-[var(--m-accent)]";
  const eligible = pendingEarnings >= MIN_PAYOUT_ZAR;

  if (hasPendingRequest) {
    return <p className="border-2 p-4 text-[13px]" style={{ borderColor: "var(--m-line)", color: "var(--m-text-muted)" }}>You already have a payout request being processed.</p>;
  }

  if (!eligible) {
    return <p className="border-2 p-4 text-[13px]" style={{ borderColor: "var(--m-line)", color: "var(--m-text-muted)" }}>Reach R{MIN_PAYOUT_ZAR} in pending earnings to request a payout.</p>;
  }

  if (status === "done") {
    return <p className="border-2 p-4 text-[13px] font-bold" style={{ borderColor: "var(--m-line)", color: "var(--m-accent)" }}>Payout requested — we&apos;ll process it and update the status below.</p>;
  }

  const submit = async () => {
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/partners/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, bankName: bankName || undefined, accountNumber: accountNumber || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't submit request.");
      setStatus("done");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't submit request.");
    }
  };

  return (
    <div className="border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Request R{pendingEarnings.toLocaleString()}</p>
      <div className="flex flex-col gap-2">
        <select className={fieldClass} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        {method === "BANK_TRANSFER" && (
          <>
            <input className={fieldClass} placeholder="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            <input className={fieldClass} placeholder="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </>
        )}
      </div>
      {error && <p className="mt-2 text-[11px] font-semibold" style={{ color: "var(--m-accent)" }}>{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={status === "submitting"}
        className="mt-3 flex min-h-11 w-full items-center justify-center text-[12px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        Request payout
      </button>
      <p className="mt-2 text-[10px]" style={{ color: "var(--m-text-faint)" }}>Commissions are subject to a 60-day clawback period from the musician&apos;s first payment.</p>
    </div>
  );
}
