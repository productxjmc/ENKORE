import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { withServiceRole } from "@/lib/authContext";

// Keeps our `User` table (which RLS and every other table's ownership
// checks key off) in sync with Clerk, which owns the actual credentials.
// getCurrentAppUser() also lazily creates a User row on first request as a
// fallback, but the webhook is the source of truth — it's what keeps role
// changes, email updates, and account deletions in sync without requiring
// the user to hit the app again.
export async function POST(req: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(req);
  } catch (err) {
    console.error("[clerk webhook] signature verification failed:", err);
    return new Response("invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id: clerkId, email_addresses, first_name, last_name } = event.data;
      const email = email_addresses?.find((e) => e.id === event.data.primary_email_address_id)?.email_address;
      if (!email) break;

      await withServiceRole((tx) =>
        tx.user.upsert({
          where: { clerkId },
          create: {
            clerkId,
            email,
            fullName: [first_name, last_name].filter(Boolean).join(" ") || null,
          },
          update: {
            email,
            fullName: [first_name, last_name].filter(Boolean).join(" ") || null,
          },
        }),
      );
      break;
    }
    case "user.deleted": {
      const clerkId = event.data.id;
      if (!clerkId) break;
      // Soft-fail if already gone; deletion order across dependent rows
      // (Musician/Fan/Affiliate) is a product decision, not a schema one —
      // for now this only removes the identity row, never cascades into
      // financial/content records.
      await withServiceRole((tx) => tx.user.deleteMany({ where: { clerkId } }));
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
