import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { withServiceRole, withUserContext, type AppUserContext } from "./authContext";

export type AppUser = {
  id: string;
  clerkId: string;
  email: string;
  role: "ADMIN" | "MODERATOR" | "USER";
};

/**
 * Resolves the signed-in Clerk user to our app-level User row. The lookup
 * itself has to run with service-role DB access — RLS on User only allows
 * `id = app.uid()`, but we don't know our internal id until this query
 * returns it, so there's no other identity to authorize the lookup with.
 * Every query AFTER this should go through `contextFor(user)` below, not
 * another bare service-role call.
 */
export async function getCurrentAppUser(): Promise<AppUser | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  return withServiceRole(async (tx) => {
    const user = await tx.user.findUnique({ where: { clerkId } });
    if (user) return user as AppUser;

    // First request after Clerk sign-up, before the webhook has landed —
    // fall back to creating the row inline so the user isn't blocked.
    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress;
    if (!email) return null;

    const created = await tx.user.create({
      data: {
        clerkId,
        email,
        fullName: [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || null,
      },
    });
    return created as AppUser;
  });
}

/** Convenience: the RLS session context for the current signed-in user, or anonymous. */
export function contextFor(user: AppUser | null): AppUserContext {
  return { userId: user?.id ?? null, email: user?.email ?? null, role: user?.role ?? null };
}

/** Run `fn` with the current signed-in user's RLS context (anonymous if signed out). */
export async function withCurrentUser<T>(fn: Parameters<typeof withUserContext<T>>[1]): Promise<T> {
  const user = await getCurrentAppUser();
  return withUserContext(contextFor(user), fn);
}
