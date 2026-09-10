import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import PayoutRequestForm from "@/components/mobile/PayoutRequestForm";

export default async function MobilePartnerPayoutPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const affiliate = await tx.affiliate.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!affiliate) return null;
    const requests = await tx.affiliatePayoutRequest.findMany({ where: { affiliateId: affiliate.id }, orderBy: { createdAt: "desc" } });
    return { affiliate, requests };
  });

  if (!data) redirect("/m/partner/why");

  const pendingEarnings = Number(data.affiliate.pendingEarnings);
  const hasPendingRequest = data.requests.some((r) => r.status === "PENDING");

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Partner</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Payout</h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>R{pendingEarnings.toLocaleString()} pending.</p>

      <div className="mt-5">
        <PayoutRequestForm pendingEarnings={pendingEarnings} hasPendingRequest={hasPendingRequest} />
      </div>

      <div className="mt-5 border-t-2 pt-4" style={{ borderColor: "var(--m-line)" }}>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>History</p>
        <div className="flex flex-col">
          {toPlain<{ id: string; amount: number; method: string | null; status: string; createdAt: string }[]>(data.requests).map((r) => (
            <div key={r.id} className="flex items-center justify-between border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
              <div>
                <p className="text-[13px] font-bold">R{r.amount.toLocaleString()}</p>
                <p className="text-[11px]" style={{ color: "var(--m-text-muted)" }}>{new Date(r.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · {r.method?.replace("_", " ") ?? "—"}</p>
              </div>
              <span className="text-[11px] font-bold uppercase" style={{ color: r.status === "PAID" ? "#1a7f37" : r.status === "REJECTED" ? "var(--m-accent)" : "var(--m-text-muted)" }}>
                {r.status}
              </span>
            </div>
          ))}
          {data.requests.length === 0 && (
            <p className="py-8 text-center text-[13px]" style={{ color: "var(--m-text-muted)" }}>No payout requests yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
