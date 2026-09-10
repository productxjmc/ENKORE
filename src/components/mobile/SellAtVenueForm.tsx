"use client";

import { useState } from "react";
import { formatFromZar } from "@/lib/pricingConfig";

type Item = { id: string; name: string; priceZar: number | null; sizes: string[] };

export default function SellAtVenueForm({ items }: { items: Item[] }) {
  const [merchandiseId, setMerchandiseId] = useState(items[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("");
  const [fanName, setFanName] = useState("");
  const [fanEmail, setFanEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const selected = items.find((i) => i.id === merchandiseId);
  const total = (selected?.priceZar ?? 0) * quantity;
  const fieldClass = "min-h-[48px] w-full border-2 bg-[var(--m-ground)] px-3 text-[14px] outline-none focus:border-[var(--m-accent)]";

  if (items.length === 0) {
    return <p className="text-[13px]" style={{ color: "var(--m-text-muted)" }}>List an item first before recording a sale.</p>;
  }

  if (status === "done") {
    return (
      <div className="border-2 p-4 text-center" style={{ borderColor: "var(--m-line)" }}>
        <p className="text-[15px] font-extrabold">Sale recorded</p>
        <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>{formatFromZar(total, "ZAR")} added to your earnings.</p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-3 text-[12px] font-bold" style={{ color: "var(--m-accent)" }}>Record another</button>
      </div>
    );
  }

  const submit = async () => {
    if (!fanName.trim() || !fanEmail.trim()) {
      setError("Fan name and email are required.");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/m/merch/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchandiseId, quantity, size: size || undefined, fanName: fanName.trim(), fanEmail: fanEmail.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't record sale.");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't record sale.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <select className={fieldClass} value={merchandiseId} onChange={(e) => setMerchandiseId(e.target.value)}>
        {items.map((i) => (
          <option key={i.id} value={i.id}>{i.name} — {formatFromZar(i.priceZar ?? 0, "ZAR")}</option>
        ))}
      </select>

      {selected && selected.sizes.length > 0 && (
        <select className={fieldClass} value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="">No size</option>
          {selected.sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      <div className="flex items-center gap-4">
        <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center text-[18px] font-extrabold" style={{ background: "var(--m-ground)" }}>−</button>
        <span className="text-[16px] font-extrabold">{quantity}</span>
        <button type="button" onClick={() => setQuantity((q) => q + 1)} className="flex h-11 w-11 items-center justify-center text-[18px] font-extrabold" style={{ background: "var(--m-ground)" }}>+</button>
      </div>

      <input className={fieldClass} placeholder="Fan's name *" value={fanName} onChange={(e) => setFanName(e.target.value)} />
      <input className={fieldClass} type="email" placeholder="Fan's email *" value={fanEmail} onChange={(e) => setFanEmail(e.target.value)} />

      <p className="text-[13px] font-bold">Total: {formatFromZar(total, "ZAR")}</p>

      {error && <p className="text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={status === "submitting"}
        className="mt-1 flex min-h-[52px] w-full items-center justify-center px-4 text-[13px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        Record sale
      </button>
    </div>
  );
}
