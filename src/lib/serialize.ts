import { Prisma } from "@prisma/client";

// Next.js's Server -> Client Component boundary only accepts plain
// JSON-serializable values. Prisma's Decimal (used on every money field in
// this schema — Musician.totalRevenue, Track.basePrice, Purchase.amountPaid,
// etc.) is a class instance, not a plain object, so passing a Prisma query
// result straight into a "use client" component fails there — confirmed via
// a real "Only plain objects can be passed to Client Components" console
// error while testing the storefront port, not assumed. This walks a value
// and converts every Decimal to a number so it's actually safe to pass.
//
// The explicit type parameter is deliberate, not laziness: a proper
// "replace every Decimal field with number" mapped type is possible but
// heavy for what's a straightforward boundary conversion. Callers name the
// plain shape they've already defined (e.g. PlainMusician) and get that
// type back; the recursive walk underneath still does the real work.
export function toPlain<T>(value: unknown): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (Array.isArray(value)) return value.map(walk);
  if (value instanceof Date) return value;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]));
  }
  return value;
}
