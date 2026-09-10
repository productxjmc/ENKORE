import { NextResponse, type NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { creditReferral } from "@/lib/partners/creditReferral";

// Ported from the Base44 app's base44/functions/approveMusician/entry.ts.
// Runs under the caller's own (admin) RLS context via withCurrentUser, not
// withServiceRole — musician_write and musicianprereg_modify's RLS
// policies both already allow an admin to write rows that aren't their
// own, so there's no need to escalate past what the real, verified caller
// role already grants. See prisma/rls.sql.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: registrationId } = await ctx.params;

  const user = await getCurrentAppUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  let notes: string | undefined;
  try {
    const body = await req.json();
    notes = typeof body?.notes === "string" ? body.notes : undefined;
  } catch {
    // no body is fine — notes is optional
  }

  type ApproveResult =
    | { status: 404; error: string }
    | { status: 400; error: string }
    | { status: 200; musicianId: string; email: string; storefrontUrl: string | null; alreadyExisted: boolean };

  const result = await withCurrentUser<ApproveResult>(async (tx) => {
    const reg = await tx.musicianPreRegistration.findUnique({ where: { id: registrationId } });
    if (!reg) return { status: 404, error: "Registration not found" };
    if (reg.status === "APPROVED") return { status: 400, error: "Application already approved" };

    const existingMusician = await tx.musician.findUnique({ where: { email: reg.email } });

    if (existingMusician) {
      if (reg.referralCode && !existingMusician.referralCode) {
        await tx.musician.update({
          where: { id: existingMusician.id },
          data: { referralCode: reg.referralCode },
        });
        await creditReferral(tx, reg.referralCode, { id: existingMusician.id, musicianName: existingMusician.musicianName, email: existingMusician.email });
      }
      await tx.musicianPreRegistration.update({
        where: { id: registrationId },
        data: { status: "APPROVED", notes: notes ?? reg.notes },
      });
      return {
        status: 200,
        musicianId: existingMusician.id,
        email: existingMusician.email,
        storefrontUrl: existingMusician.storefrontUrl,
        alreadyExisted: true,
      };
    }

    const baseSlug = slugify(reg.artistName) || "artist";
    let slug = baseSlug;
    for (let attempt = 1; attempt <= 10; attempt++) {
      const clash = await tx.musician.findUnique({ where: { storefrontUrl: slug } });
      if (!clash) break;
      slug = `${baseSlug}-${attempt}`;
    }

    const musician = await tx.musician.create({
      data: {
        musicianName: reg.artistName,
        email: reg.email,
        bio: reg.bio,
        location: reg.location,
        storefrontUrl: slug,
        streamingLinks: reg.spotifyUrl ? { spotify: reg.spotifyUrl } : undefined,
        onboardingStep: "DOCS_PENDING",
        referralCode: reg.referralCode,
      },
    });

    await tx.musicianPreRegistration.update({
      where: { id: registrationId },
      data: { status: "APPROVED", notes: notes ?? reg.notes },
    });

    if (reg.referralCode) {
      await creditReferral(tx, reg.referralCode, { id: musician.id, musicianName: musician.musicianName, email: musician.email });
    }

    return {
      status: 200,
      musicianId: musician.id,
      email: musician.email,
      storefrontUrl: musician.storefrontUrl,
      alreadyExisted: false,
    };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Invite the musician to actually sign in — Clerk's own invitation email
  // replaces Base44's `base44.users.inviteUser`. Soft-fail like the
  // original: an existing account (e.g. approving a second application for
  // the same email) isn't an error worth failing the whole approval over.
  try {
    const client = await clerkClient();
    const origin = new URL(req.url).origin;
    await client.invitations.createInvitation({
      emailAddress: result.email,
      redirectUrl: `${origin}/musician-pre-register`,
    });
  } catch (err) {
    console.error("[approveMusician] Clerk invitation failed (likely already invited/registered):", err);
  }

  // TODO(email provider): the original app also sent a custom "welcome to
  // ENKORE, here's your onboarding checklist" email via Base44's SendEmail
  // integration. No transactional email provider is wired up yet in this
  // rebuild (Resend/SendGrid/etc. — needs a decision) — Clerk's invitation
  // above only covers account setup, not this custom content. Revisit once
  // a provider is chosen.

  return NextResponse.json({
    ok: true,
    musicianId: result.musicianId,
    storefrontUrl: result.storefrontUrl,
    alreadyExisted: result.alreadyExisted,
  });
}
