import { NextResponse, type NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

const SEASON_OF_SINGING_TERM_MONTHS = 3;

// Mirrors the musician-pre-register approve route's shape, with the two
// things that make Season of Singing what it is: the musician gets the
// Soundcheck FeePlan (full platform access) and a zero-amount ACTIVE
// MusicianSubscription running for the 3-month term — computeCommission
// (src/lib/payments/commission.ts) already treats any ACTIVE subscription
// as "platform fee already covered," so this alone makes their sales 0%
// commission with no new billing logic needed. The subscription's term
// starts at approval time, matching the term sheet: each musician's
// 3-month clock starts at their own launch, not a shared date.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: applicationId } = await ctx.params;

  const user = await getCurrentAppUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  type ApproveResult =
    | { status: 404; error: string }
    | { status: 400; error: string }
    | { status: 200; musicianId: string; email: string; storefrontUrl: string | null; alreadyExisted: boolean };

  const result = await withCurrentUser<ApproveResult>(async (tx) => {
    const application = await tx.seasonOfSingingApplication.findUnique({ where: { id: applicationId } });
    if (!application) return { status: 404, error: "Application not found" };
    if (application.status === "ACCEPTED") return { status: 400, error: "Application already accepted" };

    const soundcheckPlan = await tx.feePlan.findFirst({ where: { name: "Soundcheck" } });
    if (!soundcheckPlan) {
      return { status: 400, error: "Soundcheck FeePlan not found — run scripts/seed-fee-plans.mjs first" };
    }

    const now = new Date();
    const termEnd = new Date(now);
    termEnd.setMonth(termEnd.getMonth() + SEASON_OF_SINGING_TERM_MONTHS);

    let musician = await tx.musician.findUnique({ where: { email: application.email } });
    const alreadyExisted = Boolean(musician);

    if (!musician) {
      const baseSlug = slugify(application.artistName) || "artist";
      let slug = baseSlug;
      for (let attempt = 1; attempt <= 10; attempt++) {
        const clash = await tx.musician.findUnique({ where: { storefrontUrl: slug } });
        if (!clash) break;
        slug = `${baseSlug}-${attempt}`;
      }

      musician = await tx.musician.create({
        data: {
          musicianName: application.artistName,
          email: application.email,
          bio: application.bio,
          location: application.location,
          storefrontUrl: slug,
          onboardingStep: "DOCS_PENDING",
        },
      });
    }

    await tx.musician.update({
      where: { id: musician.id },
      data: { feePlanId: soundcheckPlan.id },
    });

    await tx.musicianSubscription.create({
      data: {
        musicianId: musician.id,
        status: "ACTIVE",
        subscriptionType: "season_of_singing",
        amount: 0,
        startDate: now,
        endDate: termEnd,
        nextBillingDate: termEnd,
        // The launch-toggle gate (src/app/api/musician/launch/route.ts) only
        // counts a subscription as "paid" if paymentReference is set — real
        // proof a gateway actually processed something, not just a
        // self-consistent ACTIVE status. A free grant has no gateway
        // transaction to reference, so it needs an explicit marker here or
        // Season of Singing musicians would be permanently blocked from
        // ever going live despite the program's entire premise being a
        // free launch. Caught while building the launch-toggle phase,
        // fixed here rather than weakening that gate's actual security
        // intent (which is real: it exists because a musician's own RLS
        // write access to MusicianSubscription means status=ACTIVE alone
        // proves nothing).
        paymentReference: "SEASON-OF-SINGING-GRANT",
        description: "Season of Singing — 3-month free term, 0% ENKORE commission",
      },
    });

    await tx.seasonOfSingingApplication.update({
      where: { id: applicationId },
      data: { status: "ACCEPTED", acceptedAt: now },
    });

    return {
      status: 200,
      musicianId: musician.id,
      email: musician.email,
      storefrontUrl: musician.storefrontUrl,
      alreadyExisted,
    };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Invite the musician to actually sign in — same soft-fail pattern as
  // the musician-pre-register approve route: an existing account isn't
  // an error worth failing the whole approval over.
  try {
    const client = await clerkClient();
    const origin = new URL(req.url).origin;
    await client.invitations.createInvitation({
      emailAddress: result.email,
      redirectUrl: origin,
    });
  } catch (err) {
    console.error("[approveSeasonOfSinging] Clerk invitation failed (likely already invited/registered):", err);
  }

  // TODO(email provider): same gap as approveMusician — no transactional
  // email provider is wired up yet, so there's no custom "you're in,
  // here's your onboarding checklist" email beyond Clerk's bare invite.

  return NextResponse.json({
    ok: true,
    musicianId: result.musicianId,
    storefrontUrl: result.storefrontUrl,
    alreadyExisted: result.alreadyExisted,
  });
}
