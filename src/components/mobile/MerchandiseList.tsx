"use client";

import { useState, type ChangeEvent } from "react";
import { ShoppingBag } from "lucide-react";
import { uploadFile } from "@/lib/blob";
import { formatFromZar } from "@/lib/pricingConfig";

const TYPES = ["T_SHIRT", "HOODIE", "CAP", "POSTER", "VINYL"] as const;

type Item = {
  id: string;
  name: string;
  type: (typeof TYPES)[number];
  priceZar: number | null;
  imageUrl: string | null;
  status: "ACTIVE" | "INACTIVE";
  unitsSold: number;
};

// Reuses the existing /api/musician/merchandise (GET/POST) and
// /api/musician/merchandise/[id] (PATCH/DELETE) routes as-is — already
// scoped correctly, no mobile-specific changes needed.
export default function MerchandiseList({ initialItems, musicianId }: { initialItems: Item[]; musicianId: string }) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("T_SHIRT");
  const [priceZar, setPriceZar] = useState("150");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const fieldClass = "min-h-[44px] w-full border-2 bg-[var(--m-ground)] px-3 text-[13px] outline-none focus:border-[var(--m-accent)]";

  const handleImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      setImageUrl(await uploadFile(file, "track_cover", musicianId));
    } catch {
      setError("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const create = async () => {
    if (!name.trim() || !priceZar) return;
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/musician/merchandise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type, priceZar: Number(priceZar), imageUrl: imageUrl || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't add item.");
      setItems((prev) => [body.item, ...prev]);
      setName(""); setPriceZar("150"); setImageUrl("");
      setShowForm(false);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't add item.");
    }
  };

  const toggleStatus = async (item: Item) => {
    const next = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
    await fetch(`/api/musician/merchandise/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => {});
  };

  const remove = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/musician/merchandise/${id}`, { method: "DELETE" }).catch(() => {});
  };

  return (
    <div>
      {!showForm ? (
        <button type="button" onClick={() => setShowForm(true)} disabled={items.length >= 5} className="flex min-h-11 w-full items-center justify-center px-4 text-[12px] font-bold text-white disabled:opacity-60" style={{ background: "var(--m-accent)" }}>
          {items.length >= 5 ? "Maximum 5 items" : "List a new item"}
        </button>
      ) : (
        <div className="flex flex-col gap-2 border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
          <input className={fieldClass} placeholder="Item name *" value={name} onChange={(e) => setName(e.target.value)} />
          <select className={fieldClass} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
          <input className={fieldClass} type="number" min="1" placeholder="Price (R) *" value={priceZar} onChange={(e) => setPriceZar(e.target.value)} />
          <input type="file" accept="image/*" onChange={handleImage} className="text-[12px]" />
          {uploading && <p className="text-[11px]" style={{ color: "var(--m-text-muted)" }}>Uploading…</p>}
          {error && <p className="text-[11px] font-semibold" style={{ color: "var(--m-accent)" }}>{error}</p>}
          <div className="mt-1 flex gap-2">
            <button type="button" onClick={create} disabled={status === "submitting" || uploading} className="min-h-11 flex-1 px-4 text-[12px] font-bold text-white disabled:opacity-60" style={{ background: "var(--m-accent)" }}>
              Add item
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="min-h-11 px-4 text-[12px] font-bold" style={{ color: "var(--m-text-muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- uploaded blob image */}
            <img src={item.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop"} alt="" className="h-14 w-14 flex-none grayscale" style={{ objectFit: "cover" }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold">{item.name}</p>
              <p className="text-[11px]" style={{ color: "var(--m-text-muted)" }}>{formatFromZar(item.priceZar ?? 0, "ZAR")} · {item.unitsSold} sold</p>
            </div>
            <button type="button" onClick={() => toggleStatus(item)} className="flex-none px-2 py-1 text-[10px] font-bold uppercase" style={{ color: item.status === "ACTIVE" ? "#1a7f37" : "var(--m-text-faint)" }}>
              {item.status === "ACTIVE" ? "Active" : "Hidden"}
            </button>
            <button type="button" onClick={() => remove(item.id)} className="flex-none text-[11px] font-bold" style={{ color: "var(--m-accent)" }}>
              Delete
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <ShoppingBag className="h-8 w-8" style={{ color: "var(--m-text-faint)" }} />
            <p className="mt-3 text-[13px]" style={{ color: "var(--m-text-muted)" }}>No items listed yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
