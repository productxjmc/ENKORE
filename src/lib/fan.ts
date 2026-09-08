import "server-only";
import { getCurrentAppUser, withCurrentUser } from "./auth";

export type ConsentChannels = { app: boolean; email: boolean; sms: boolean; whatsapp: boolean };

export type CurrentFan = {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  consent: ConsentChannels | null;
};

/**
 * Resolves the signed-in Clerk user to their Fan (member) row, creating it
 * inline on first access — mirrors getCurrentAppUser()'s own inline-create
 * fallback for User. Unlike that fallback, this one runs under
 * withCurrentUser (the caller's own RLS context), not withServiceRole:
 * fan_write's WITH CHECK is `userId = app.uid() OR email = app.email() OR
 * is_admin()`, and since the new row's own userId is being set to the
 * caller's own app.uid(), the check is satisfied by the caller's own
 * identity — no service-role bypass needed, unlike User (which had no
 * insert policy at all until the RLS fix earlier this build).
 */
export async function getCurrentFan(): Promise<CurrentFan | null> {
  const user = await getCurrentAppUser();
  if (!user) return null;

  return withCurrentUser(async (tx) => {
    const existing = await tx.fan.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (existing) {
      // A fan created earlier via checkout/import (email-matched, no
      // userId yet) should get linked to this Clerk account now that one
      // exists, the same "link on first real login" pattern the rest of
      // this app already uses for Musician.
      const fan = existing.userId ? existing : await tx.fan.update({ where: { id: existing.id }, data: { userId: user.id } });
      return {
        id: fan.id, fullName: fan.fullName, email: fan.email, phone: fan.phone, location: fan.location,
        consent: (fan.consent as ConsentChannels | null) ?? null,
      };
    }

    // fullName/phone/location/consent are left unset here — the join/profile
    // screen (Phase 1) collects them explicitly right after this row is
    // created, rather than guessing at a name from Clerk.
    const created = await tx.fan.create({ data: { userId: user.id, email: user.email } });
    return { id: created.id, fullName: created.fullName, email: created.email, phone: created.phone, location: created.location, consent: null };
  });
}
