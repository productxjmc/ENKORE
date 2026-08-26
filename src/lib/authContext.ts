import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export type AppUserContext = {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
};

/**
 * Runs `fn` inside a transaction with the Postgres session variables that
 * prisma/rls.sql's policies read (app.user_id / app.user_email /
 * app.user_role). This is the ONLY way row-level security recognizes who
 * is asking — a query run outside this wrapper has no identity and every
 * RLS policy in prisma/rls.sql denies it by default.
 */
export async function withUserContext<T>(
  ctx: AppUserContext,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${ctx.userId ?? ""}, true)`;
    await tx.$executeRaw`SELECT set_config('app.user_email', ${ctx.email ?? ""}, true)`;
    await tx.$executeRaw`SELECT set_config('app.user_role', ${ctx.role ?? ""}, true)`;
    return fn(tx);
  });
}

/**
 * Full-bypass context for genuinely trusted server-only code paths:
 * signature-verified payment webhooks, the Clerk user-sync webhook,
 * scheduled jobs. Never call this from a request handler that only has
 * "the caller says they're an admin" — it must be gated by something
 * cryptographically or platform-verified (a verified webhook signature,
 * a cron trigger), not a client-supplied header or role claim.
 */
export async function withServiceRole<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return withUserContext({ role: "ADMIN" }, fn);
}
