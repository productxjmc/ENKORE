import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageSquare, MapPin, Bell } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { formatFromZar } from "@/lib/pricingConfig";

// Keyed by email, not fanId — several of the tables this rolls up
// (Purchase, TicketPurchase) only ever guarantee a fanEmail, since
// anonymous checkout never requires a Fan account. Email is the one
// identity key every source table actually carries.
export default async function MobileMemberDetailPage({ params }: { params: Promise<{ email: string }> }) {
  const { email: encodedEmail } = await params;
  const email = decodeURIComponent(encodedEmail);

  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;

    const [follow, purchases, tickets, subs, signal, fan] = await Promise.all([
      tx.follow.findFirst({ where: { musicianId: musician.id, fanEmail: email } }),
      tx.purchase.findMany({ where: { musicianId: musician.id, fanEmail: email, status: "COMPLETED" }, include: { track: { select: { title: true } } }, orderBy: { createdAt: "desc" } }),
      tx.ticketPurchase.findMany({ where: { musicianId: musician.id, fanEmail: email, status: "CONFIRMED" }, include: { event: { select: { title: true } } }, orderBy: { createdAt: "desc" } }),
      tx.fanSubscription.findMany({ where: { musicianId: musician.id, fanEmail: email }, orderBy: { createdAt: "desc" } }),
      tx.interestSignal.findFirst({ where: { musicianId: musician.id, fanEmail: email } }),
      tx.fan.findUnique({ where: { email } }),
    ]);

    return { musician, follow, purchases, tickets, subs, signal, fan };
  });

  if (!data) redirect("/musician-pre-register");
  const { follow, purchases, tickets, subs, signal, fan } = data;
  if (!follow && purchases.length === 0 && tickets.length === 0 && subs.length === 0 && !signal) notFound();

  const name = follow?.fanName || purchases[0]?.fanName || tickets[0]?.fanName || fan?.fullName || email;
  const location = follow?.location || fan?.location || null;
  const totalSpend =
    purchases.reduce((s, p) => s + Number(p.musicianEarnings ?? p.amountPaid), 0) +
    tickets.reduce((s, t) => s + Number(t.totalAmount), 0) +
    subs.reduce((s, sub) => s + Number(sub.totalPaid), 0);

  return (
    <div className="p-4">
      <Link href="/m/community" className="mb-4 flex min-h-[44px] items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--m-text-muted)" }}>
        <ArrowLeft className="h-4 w-4" /> Community
      </Link>

      <h1 className="text-[22px] font-extrabold tracking-[-0.02em]">{name}</h1>
      <p className="mt-1 text-[12px]" style={{ color: "var(--m-text-muted)" }}>{email}</p>
      {location && (
        <p className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: "var(--m-text-muted)" }}>
          <MapPin className="h-3 w-3" /> {location}
        </p>
      )}
      {signal && (
        <p className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: "var(--m-accent)" }}>
          <Bell className="h-3 w-3" /> Wants to be notified about new music/shows
        </p>
      )}

      <Link
        href={`/m/inbox/${encodeURIComponent(email)}`}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 px-4 text-[12px] font-bold text-white"
        style={{ background: "var(--m-accent)" }}
      >
        <MessageSquare className="h-4 w-4" /> Message {name}
      </Link>

      <div className="mt-5 grid grid-cols-3 gap-[2px]" style={{ background: "var(--m-line)" }}>
        <div className="flex flex-col gap-1 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="text-[16px] font-extrabold">{formatFromZar(totalSpend, "ZAR")}</span>
          <span className="text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--m-text-muted)" }}>Total spend</span>
        </div>
        <div className="flex flex-col gap-1 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="text-[16px] font-extrabold">{purchases.length}</span>
          <span className="text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--m-text-muted)" }}>Tracks bought</span>
        </div>
        <div className="flex flex-col gap-1 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="text-[16px] font-extrabold">{tickets.length}</span>
          <span className="text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--m-text-muted)" }}>Tickets</span>
        </div>
      </div>

      {subs.length > 0 && (
        <div className="mt-4 border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Support subscription</p>
          <p className="mt-1 text-[13px] font-bold">{subs[0].status === "ACTIVE" ? "Active" : subs[0].status} · {formatFromZar(Number(subs[0].amount), "ZAR")}/mo</p>
        </div>
      )}

      {purchases.length > 0 && (
        <div className="mt-4 border-t-2 pt-4" style={{ borderColor: "var(--m-line)" }}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Tracks purchased</p>
          {purchases.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-t py-2.5" style={{ borderColor: "var(--m-hairline)" }}>
              <span className="text-[13px]">{p.track.title}</span>
              <span className="text-[12px] font-bold">{formatFromZar(Number(p.musicianEarnings ?? p.amountPaid), "ZAR")}</span>
            </div>
          ))}
        </div>
      )}

      {tickets.length > 0 && (
        <div className="mt-4 border-t-2 pt-4" style={{ borderColor: "var(--m-line)" }}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Tickets</p>
          {tickets.map((t) => (
            <div key={t.id} className="flex items-center justify-between border-t py-2.5" style={{ borderColor: "var(--m-hairline)" }}>
              <span className="text-[13px]">{t.event.title}</span>
              <span className="text-[12px] font-bold">{formatFromZar(Number(t.totalAmount), "ZAR")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
