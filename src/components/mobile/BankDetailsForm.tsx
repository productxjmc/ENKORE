"use client";

import { useState } from "react";

// Posts to /api/musician/payout-info — the exact same route the desktop
// dashboard uses, not a mobile-specific copy: it's already
// getCurrentAppUser()/withCurrentUser()-driven with no desktop-specific
// assumptions baked in.
export default function BankDetailsForm({ initialBankName, initialAccountNumber }: { initialBankName: string; initialAccountNumber: string }) {
  const [bankName, setBankName] = useState(initialBankName);
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
  const [status, setStatus] = useState<"idle" | "submitting" | "saved" | "error">("idle");

  const fieldClass = "min-h-[48px] w-full border-2 bg-[var(--m-ground)] px-3 text-[14px] outline-none focus:border-[var(--m-accent)]";

  const save = async () => {
    setStatus("submitting");
    try {
      const res = await fetch("/api/musician/payout-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName, accountNumber }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Bank &amp; payout details</p>
      <div className="mt-3 flex flex-col gap-3">
        <input className={fieldClass} placeholder="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
        <input className={fieldClass} placeholder="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
      </div>
      {status === "error" && <p className="mt-2 text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>Couldn&apos;t save. Try again.</p>}
      {status === "saved" && <p className="mt-2 text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>Saved.</p>}
      <button
        type="button"
        onClick={save}
        disabled={status === "submitting"}
        className="mt-3 flex min-h-11 w-full items-center justify-center px-4 text-[12px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        Save details
      </button>
    </div>
  );
}
