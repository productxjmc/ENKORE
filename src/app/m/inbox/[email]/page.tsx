import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import ReplyForm from "@/components/mobile/ReplyForm";

export default async function MobileThreadPage({ params }: { params: Promise<{ email: string }> }) {
  const { email: encodedEmail } = await params;
  const email = decodeURIComponent(encodedEmail);

  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;

    const messages = await tx.message.findMany({ where: { musicianId: musician.id, fanEmail: email }, orderBy: { createdAt: "asc" } });
    if (messages.length === 0) return { musician, messages };

    await tx.message.updateMany({ where: { musicianId: musician.id, fanEmail: email, senderType: "FAN", isRead: false }, data: { isRead: true } });

    return { musician, messages };
  });

  if (!data) redirect("/musician-pre-register");
  if (data.messages.length === 0) notFound();
  const { musician, messages } = data;
  const fanName = messages[0].fanName || email;

  return (
    <div className="flex min-h-full flex-col">
      <div className="p-4">
        <Link href="/m/inbox" className="mb-3 flex min-h-11 items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--m-text-muted)" }}>
          <ArrowLeft className="h-4 w-4" /> Inbox
        </Link>
        <h1 className="text-[20px] font-extrabold tracking-[-0.02em]">{fanName}</h1>
        <p className="text-[12px]" style={{ color: "var(--m-text-muted)" }}>{email}</p>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        {toPlain<{ id: string; subject: string; messageBody: string; senderType: "MUSICIAN" | "FAN"; createdAt: string }[]>(messages).map((m) => (
          <div
            key={m.id}
            className="max-w-[85%] border-2 p-3"
            style={{
              alignSelf: m.senderType === "MUSICIAN" ? "flex-end" : "flex-start",
              borderColor: m.senderType === "MUSICIAN" ? "var(--m-accent)" : "var(--m-line)",
              background: m.senderType === "MUSICIAN" ? "var(--m-ink)" : "var(--m-ground)",
              color: m.senderType === "MUSICIAN" ? "#fff" : "var(--m-ink)",
            }}
          >
            <p className="text-[13px] leading-[1.4]">{m.messageBody}</p>
            <p className="mt-1 text-[10px] opacity-70">{new Date(m.createdAt).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        ))}
      </div>

      <ReplyForm musicianId={musician.id} fanEmail={email} />
    </div>
  );
}
