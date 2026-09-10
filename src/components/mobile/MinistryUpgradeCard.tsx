"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MinistryUpgradeCard() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ministryName, setMinistryName] = useState("");
  const [ministryRole, setMinistryRole] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const fieldClass = "min-h-[44px] w-full border-2 bg-[var(--m-ground)] px-3 text-[13px] outline-none focus:border-[var(--m-accent)]";

  const submit = async () => {
    if (!ministryName.trim() || !ministryRole.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/partners/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ministry_upgrade", ministry: { ministryName: ministryName.trim(), ministryRole: ministryRole.trim() } }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
      setOpen(false);
    } catch {
      setStatus("error");
    } finally {
      setStatus("idle");
    }
  };

  if (!open) {
    return (
      <div className="border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Upgrade your tier</p>
        <p className="mt-2 text-[13px] leading-[1.4]" style={{ color: "var(--m-text-muted)" }}>
          Lead a ministry? Upgrade to <strong>Ministry Partner</strong> and earn a <strong>R1,000 Church Multiplier</strong> for every musician you onboard from your congregation.
        </p>
        <button type="button" onClick={() => setOpen(true)} className="mt-3 text-[12px] font-bold" style={{ color: "var(--m-accent)" }}>
          Apply for Ministry Tier →
        </button>
      </div>
    );
  }

  return (
    <div className="border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Ministry application</p>
      <div className="mt-3 flex flex-col gap-2">
        <input className={fieldClass} placeholder="Ministry / church name *" value={ministryName} onChange={(e) => setMinistryName(e.target.value)} />
        <input className={fieldClass} placeholder="Your role *" value={ministryRole} onChange={(e) => setMinistryRole(e.target.value)} />
      </div>
      {status === "error" && <p className="mt-2 text-[11px] font-semibold" style={{ color: "var(--m-accent)" }}>Couldn&apos;t submit. Try again.</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={submit} disabled={status === "submitting"} className="min-h-10 flex-1 text-[12px] font-bold text-white disabled:opacity-60" style={{ background: "var(--m-accent)" }}>
          Submit
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-10 px-3 text-[12px] font-bold" style={{ color: "var(--m-text-muted)" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
