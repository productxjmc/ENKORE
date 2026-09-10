"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BecomePartnerButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const activate = async () => {
    setStatus("submitting");
    try {
      const res = await fetch("/api/partners/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      if (!res.ok) throw new Error();
      router.push("/m/partner");
      router.refresh();
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      {status === "error" && <p className="mb-2 text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>Couldn&apos;t activate. Try again.</p>}
      <button
        type="button"
        onClick={activate}
        disabled={status === "submitting"}
        className="flex min-h-[52px] w-full items-center justify-center text-[13px] font-bold text-white disabled:opacity-60"
        style={{ background: "var(--m-accent)" }}
      >
        {status === "submitting" ? "Activating…" : "Become a partner"}
      </button>
    </div>
  );
}
