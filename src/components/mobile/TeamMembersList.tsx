"use client";

import { useState } from "react";
import { Trash2, Users } from "lucide-react";

type Member = { id: string; name: string; email: string | null; role: string | null };

export default function TeamMembersList({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const fieldClass = "min-h-[44px] w-full border-2 bg-[var(--m-ground)] px-3 text-[13px] outline-none focus:border-[var(--m-accent)]";

  const add = async () => {
    if (!name.trim()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/m/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined, role: role.trim() || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error();
      setMembers((prev) => [...prev, body.member]);
      setName(""); setEmail(""); setRole("");
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const remove = async (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/m/team/${id}`, { method: "DELETE" }).catch(() => {});
  };

  return (
    <div>
      <div className="flex flex-col gap-2 border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
        <input className={fieldClass} placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={fieldClass} placeholder="Role (e.g. Drummer, Manager)" value={role} onChange={(e) => setRole(e.target.value)} />
        <input className={fieldClass} type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
        {status === "error" && <p className="text-[11px] font-semibold" style={{ color: "var(--m-accent)" }}>Couldn&apos;t add. Try again.</p>}
        <button
          type="button"
          onClick={add}
          disabled={!name.trim() || status === "submitting"}
          className="mt-1 min-h-11 px-4 text-[12px] font-bold text-white disabled:opacity-60"
          style={{ background: "var(--m-accent)" }}
        >
          Add member
        </button>
      </div>

      <div className="mt-4 flex flex-col">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold">{m.name}</p>
              <p className="truncate text-[11px]" style={{ color: "var(--m-text-muted)" }}>{[m.role, m.email].filter(Boolean).join(" · ") || "No details"}</p>
            </div>
            <button type="button" onClick={() => remove(m.id)} className="flex-none p-2" aria-label={`Remove ${m.name}`}>
              <Trash2 className="h-4 w-4" style={{ color: "var(--m-text-faint)" }} />
            </button>
          </div>
        ))}
        {members.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <Users className="h-8 w-8" style={{ color: "var(--m-text-faint)" }} />
            <p className="mt-3 text-[13px]" style={{ color: "var(--m-text-muted)" }}>No team members yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
