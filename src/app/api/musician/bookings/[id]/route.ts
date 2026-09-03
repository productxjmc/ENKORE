import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

const VALID_STATUSES = ["PENDING", "CONTACTED", "CONFIRMED", "DECLINED"];

// Ported from the Base44 app's src/components/bookings/BookingEnquiriesList.jsx's
// handleStatusChange. bookingenquiry_modify RLS already covers owner
// update, so withCurrentUser is enough.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await withCurrentUser((tx) => tx.bookingEnquiry.updateMany({ where: { id }, data: { status } }));

  if (result.count === 0) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
