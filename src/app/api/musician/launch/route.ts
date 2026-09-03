import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

const VALID_PLANS = ["Soundcheck", "Mainstage", "Headliner"] as const;
const PLAN_TO_ENUM: Record<string, "SOUNDCHECK" | "MAINSTAGE" | "HEADLINER"> = { Soundcheck: "SOUNDCHECK", Mainstage: "MAINSTAGE", Headliner: "HEADLINER" };

// Ported from base44/functions/activateLaunch/entry.ts. isLive/selectedPlan
// are effectively admin-write in intent (the source's own comment: a
// musician could otherwise self-declare live having paid nothing) — this
// route is what actually enforces that, re-checking every precondition
// server-side rather than trusting the client's checklist. Runs under
// withCurrentUser: it only ever writes to Musician (musician_write RLS
// already covers owner), and only reads MusicianSubscription/
// MusicianPayoutInfo/Track, all of which the owner can already SELECT —
// no service-role escalation needed anywhere in this route.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const goLive = body?.goLive;
  const plan = body?.plan;

  type Result =
    | { status: 404 | 400; error: string }
    | { status: 422; error: string; blockers: string[] }
    | { status: 402; error: string; requiresPayment: true }
    | { status: 200; isLive: boolean };

  const result = await withCurrentUser<Result>(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404, error: "Musician not found" };

    // Pausing is always allowed.
    if (goLive === false) {
      await tx.musician.update({ where: { id: musician.id }, data: { isLive: false } });
      return { status: 200, isLive: false };
    }

    if (!VALID_PLANS.includes(plan)) {
      return { status: 400, error: "Choose a valid subscription tier." };
    }

    const blockers: string[] = [];
    if (musician.requirementsStatus !== "APPROVED") blockers.push("Your onboarding requirements have not been approved yet.");
    if (!musician.profileImage) blockers.push("Upload a profile image.");
    if (!musician.bio || musician.bio.trim().length <= 20) blockers.push("Add a bio of at least 20 characters.");

    const trackCount = await tx.track.count({ where: { musicianId: musician.id } });
    if (trackCount === 0) blockers.push("Upload at least one track.");

    // Bank details live on MusicianPayoutInfo, never Musician — see the
    // Payouts phase's own comment on this same recurring mix-up.
    const payoutInfo = await tx.musicianPayoutInfo.findUnique({ where: { musicianId: musician.id } });
    if (!payoutInfo?.bankName || !payoutInfo?.accountNumber) blockers.push("Add your bank details on the Payouts page.");

    if (blockers.length > 0) {
      return { status: 422, error: "Launch checklist incomplete", blockers };
    }

    // A subscription only counts as proof of payment if a gateway (or an
    // admin-granted free term, e.g. Season of Singing) actually referenced
    // it and it hasn't lapsed — status=ACTIVE alone proves nothing, since
    // the owner's own RLS write access to some fields could otherwise let
    // them forge it.
    const activeSubs = await tx.musicianSubscription.findMany({ where: { musicianId: musician.id, status: "ACTIVE" } });
    const now = Date.now();
    const paid = activeSubs.find((s) => s.paymentReference && (!s.nextBillingDate || s.nextBillingDate.getTime() > now));
    if (!paid) {
      return { status: 402, error: "An active subscription is required before going live.", requiresPayment: true };
    }

    await tx.musician.update({
      where: { id: musician.id },
      data: { isLive: true, selectedPlan: PLAN_TO_ENUM[plan], onboardingStep: "LAUNCHED" },
    });

    return { status: 200, isLive: true };
  });

  if (result.status !== 200) {
    return NextResponse.json(
      { error: result.error, ...("blockers" in result ? { blockers: result.blockers } : {}), ...("requiresPayment" in result ? { requiresPayment: true } : {}) },
      { status: result.status },
    );
  }
  return NextResponse.json({ success: true, isLive: result.isLive });
}
