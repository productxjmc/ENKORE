import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, MapPin, Bell, Send, ArrowRight } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { formatFromZar } from "@/lib/pricingConfig";

type Member = {
  fanId: string | null;
  email: string;
  name: string;
  location: string | null;
  spend: number;
  trackPurchases: number;
  tickets: number;
  isSubscriber: boolean;
  wantsNotify: boolean;
  lastActivity: Date;
};

// Aggregates Follow + Purchase + TicketPurchase + FanSubscription +
// InterestSignal into one per-fan row, keyed by email (the one identity
// key every one of those tables actually carries — fanId is optional on
// several of them for anonymous-checkout fans). MerchandiseOrder is
// deliberately left out: it isn't wired to any checkout flow yet (no
// route ever creates one), so including it would just be zeros for
// every musician, not a meaningful signal.
export default async function MobileCommunityPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;

    const [follows, purchases, tickets, subs, signals] = await Promise.all([
      tx.follow.findMany({ where: { musicianId: musician.id } }),
      tx.purchase.findMany({ where: { musicianId: musician.id, status: "COMPLETED" } }),
      tx.ticketPurchase.findMany({ where: { musicianId: musician.id, status: "CONFIRMED" } }),
      tx.fanSubscription.findMany({ where: { musicianId: musician.id, status: "ACTIVE" } }),
      tx.interestSignal.findMany({ where: { musicianId: musician.id } }),
    ]);

    return { musician, follows, purchases, tickets, subs, signals };
  });

  if (!data) redirect("/musician-pre-register");
  const { musician, follows, purchases, tickets, subs, signals } = data;

  const members = new Map<string, Member>();
  const touch = (email: string | null | undefined, name: string | null | undefined, fanId: string | null | undefined, location: string | null | undefined, at: Date) => {
    if (!email) return null;
    let m = members.get(email);
    if (!m) {
      m = { fanId: fanId ?? null, email, name: name || email, location: location ?? null, spend: 0, trackPurchases: 0, tickets: 0, isSubscriber: false, wantsNotify: false, lastActivity: at };
      members.set(email, m);
    }
    if (!m.fanId && fanId) m.fanId = fanId;
    if (!m.location && location) m.location = location;
    if (name && m.name === m.email) m.name = name;
    if (at > m.lastActivity) m.lastActivity = at;
    return m;
  };

  for (const f of follows) touch(f.fanEmail, f.fanName, f.fanId, f.location, f.createdAt);
  for (const p of purchases) {
    const m = touch(p.fanEmail, p.fanName, null, null, p.createdAt);
    if (m) { m.spend += Number(p.musicianEarnings ?? p.amountPaid); m.trackPurchases += 1; }
  }
  for (const t of tickets) {
    const m = touch(t.fanEmail, t.fanName, t.fanId, null, t.createdAt);
    if (m) { m.spend += Number(t.totalAmount); m.tickets += 1; }
  }
  for (const s of subs) {
    const m = touch(s.fanEmail, s.fanName, s.fanId, null, s.createdAt);
    if (m) { m.spend += Number(s.totalPaid); m.isSubscriber = true; }
  }
  for (const sig of signals) {
    const m = touch(sig.fanEmail, sig.fanName, sig.fanId, null, sig.createdAt);
    if (m) m.wantsNotify = true;
  }

  const list = [...members.values()].sort((a, b) => b.spend - a.spend || b.lastActivity.getTime() - a.lastActivity.getTime());

  const locationGroups = list
    .filter((m) => m.location)
    .reduce<Record<string, number>>((acc, m) => {
      acc[m.location!] = (acc[m.location!] ?? 0) + 1;
      return acc;
    }, {});
  const topLocations = Object.entries(locationGroups).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxLocationCount = topLocations[0]?.[1] ?? 0;

  const notifyList = list.filter((m) => m.wantsNotify);

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Community</h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>{list.length} people in {musician.musicianName}&apos;s community</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/m/inbox" className="flex min-h-14 items-center gap-2 border-2 px-3 text-[12px] font-bold" style={{ borderColor: "var(--m-line)" }}>
          <Send className="h-4 w-4 flex-none" style={{ color: "var(--m-accent)" }} />
          Inbox
        </Link>
        <Link href="/m/community/broadcast" className="flex min-h-14 items-center gap-2 border-2 px-3 text-[12px] font-bold" style={{ borderColor: "var(--m-line)" }}>
          <Bell className="h-4 w-4 flex-none" style={{ color: "var(--m-accent)" }} />
          Broadcast
        </Link>
      </div>

      {topLocations.length > 0 && (
        <div className="mt-4 border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>
            <MapPin className="h-3 w-3" /> Where your community is
          </p>
          <div className="flex flex-col gap-2.5">
            {topLocations.map(([loc, count]) => (
              <div key={loc}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-bold">{loc}</span>
                  <span style={{ color: "var(--m-text-muted)" }}>{count}</span>
                </div>
                <div className="mt-1 h-1.5 w-full" style={{ background: "var(--m-line)" }}>
                  <div className="h-full" style={{ width: `${(count / maxLocationCount) * 100}%`, background: "var(--m-accent)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notifyList.length > 0 && (
        <div className="mt-4 border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>
            <Bell className="h-3 w-3" /> Waiting to hear from you
          </p>
          <p className="text-[12px]" style={{ color: "var(--m-text-muted)" }}>{notifyList.length} {notifyList.length === 1 ? "person has" : "people have"} asked to be notified about new music or shows.</p>
        </div>
      )}

      <div className="mt-4 border-t-2 pt-4" style={{ borderColor: "var(--m-line)" }}>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Members</p>
        <div className="flex flex-col">
          {list.map((m) => (
            <Link key={m.email} href={`/m/community/${encodeURIComponent(m.email)}`} className="flex items-center justify-between border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold">{m.name}</p>
                <p className="truncate text-[11px]" style={{ color: "var(--m-text-muted)" }}>
                  {m.location ?? "Location unknown"} {m.isSubscriber ? "· Subscriber" : ""}
                </p>
              </div>
              <div className="flex flex-none items-center gap-2">
                <span className="text-[13px] font-extrabold">{formatFromZar(m.spend, "ZAR")}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
          {list.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <Users className="h-8 w-8" style={{ color: "var(--m-text-faint)" }} />
              <p className="mt-3 text-[13px]" style={{ color: "var(--m-text-muted)" }}>No community activity yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
