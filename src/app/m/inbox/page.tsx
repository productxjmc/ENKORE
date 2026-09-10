import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

export default async function MobileInboxPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;

    const messages = await tx.message.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } });
    return { messages };
  });

  if (!data) redirect("/musician-pre-register");

  const threads = new Map<string, { email: string; name: string; lastMessage: string; lastAt: Date; unread: boolean }>();
  for (const m of data.messages) {
    const key = m.fanEmail || m.fanId || "unknown";
    if (!threads.has(key)) {
      threads.set(key, { email: m.fanEmail || "", name: m.fanName || m.fanEmail || "Unknown", lastMessage: m.messageBody, lastAt: m.createdAt, unread: m.senderType === "FAN" && !m.isRead });
    }
  }
  const threadList = [...threads.values()].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Inbox</h1>

      <div className="mt-4 flex flex-col">
        {threadList.map((t) => (
          <Link key={t.email} href={`/m/inbox/${encodeURIComponent(t.email)}`} className="flex items-center justify-between border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate text-[13px] font-bold">
                {t.name}
                {t.unread && <span className="h-2 w-2 flex-none rounded-full" style={{ background: "var(--m-accent)" }} />}
              </p>
              <p className="truncate text-[12px]" style={{ color: "var(--m-text-muted)" }}>{t.lastMessage}</p>
            </div>
          </Link>
        ))}
        {threadList.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <MessageSquare className="h-8 w-8" style={{ color: "var(--m-text-faint)" }} />
            <p className="mt-3 text-[13px]" style={{ color: "var(--m-text-muted)" }}>No messages yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
