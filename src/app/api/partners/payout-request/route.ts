import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

const MIN_PAYOUT_ZAR = 500;
const METHODS = ["BANK_TRANSFER", "PAYFAST", "MOBILE_MONEY"] as const;

const requestSchema = z.object({
  method: z.enum(METHODS),
  bankName: z.string().trim().max(120).optional(),
  accountNumber: z.string().trim().max(50).optional(),
});

// affiliatepayoutrequest_insert RLS is owns_affiliate-gated — withCurrentUser
// is enough. Requests the affiliate's full pendingEarnings each time (an
// admin marks it PAID once actually processed, matching how Payout works
// for musicians) — not a partial-amount picker, since there's no
// concept of "some of" pending earnings being requestable separately.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { method, bankName, accountNumber } = parsed.data;

  const result = await withCurrentUser(async (tx) => {
    const affiliate = await tx.affiliate.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!affiliate) return { status: 404 as const, error: "You're not a partner yet" };

    const pending = Number(affiliate.pendingEarnings);
    if (pending < MIN_PAYOUT_ZAR) return { status: 409 as const, error: `You need at least R${MIN_PAYOUT_ZAR} in pending earnings to request a payout` };

    const existingPending = await tx.affiliatePayoutRequest.findFirst({ where: { affiliateId: affiliate.id, status: "PENDING" } });
    if (existingPending) return { status: 409 as const, error: "You already have a payout request pending" };

    if (method === "BANK_TRANSFER" && (bankName || accountNumber)) {
      await tx.affiliate.update({ where: { id: affiliate.id }, data: { payoutMethod: method, bankName, accountNumber } });
    } else {
      await tx.affiliate.update({ where: { id: affiliate.id }, data: { payoutMethod: method } });
    }

    const request = await tx.affiliatePayoutRequest.create({
      data: { affiliateId: affiliate.id, amount: pending, method },
    });
    return { status: 200 as const, request };
  });

  if (result.status !== 200) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, id: result.request.id });
}
