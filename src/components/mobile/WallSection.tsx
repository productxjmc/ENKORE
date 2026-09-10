"use client";

import { useState } from "react";
import Link from "next/link";

type WallPost = { id: string; fanName: string; message: string; createdAt: string };

export default function WallSection({ musicianId, posts, signedIn }: { musicianId: string; posts: WallPost[]; signedIn: boolean }) {
  const [items, setItems] = useState(posts);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!message.trim()) return;
    setStatus("submitting");
    setError(null);
    try {
      const res = await fetch("/api/m/wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicianId, message: message.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Couldn't post. Try again.");
      setItems((prev) => [{ id: body.post.id, fanName: body.post.fanName, message: body.post.message, createdAt: body.post.createdAt }, ...prev]);
      setMessage("");
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't post. Try again.");
    }
  };

  return (
    <div>
      {signedIn ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a message for the community..."
            maxLength={500}
            rows={3}
            className="w-full resize-none border-2 bg-[var(--m-ground)] p-3 text-[13px] outline-none focus:border-[var(--m-accent)]"
            style={{ borderColor: "var(--m-line)" }}
          />
          {error && <p className="text-[12px] font-semibold" style={{ color: "var(--m-accent)" }}>{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={!message.trim() || status === "submitting"}
            className="min-h-11 self-end px-4 text-[12px] font-bold text-white disabled:opacity-60"
            style={{ background: "var(--m-accent)" }}
          >
            Post
          </button>
        </div>
      ) : (
        <Link href="/m/signin" className="block text-[12px] font-bold" style={{ color: "var(--m-accent)" }}>
          Sign in to post
        </Link>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {items.map((p) => (
          <div key={p.id} className="border-t pt-3" style={{ borderColor: "var(--m-hairline)" }}>
            <p className="text-[13px] font-bold">{p.fanName}</p>
            <p className="mt-1 text-[13px] leading-[1.4]" style={{ color: "var(--m-text-muted)" }}>{p.message}</p>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-6 text-center text-[13px]" style={{ color: "var(--m-text-muted)" }}>Be the first to post.</p>
        )}
      </div>
    </div>
  );
}
