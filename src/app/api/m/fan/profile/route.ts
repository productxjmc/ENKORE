import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

// Completes the Fan row Clerk sign-up alone can't fill in: mobile number,
// city, and per-channel consent. Runs under withCurrentUser, not
// withServiceRole — fan_write's WITH CHECK (userId = app.uid() OR email =
// app.email() OR is_admin()) is satisfied by the caller's own identity
// once a Fan row with that userId exists, and getCurrentFan() (called by
// the page before this route is ever hit) guarantees one does.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim().slice(0, 120) : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim().slice(0, 30) : "";
  const city = typeof body?.city === "string" ? body.city.trim().slice(0, 80) : "";
  const consentRaw = body?.consent;

  if (!fullName) return NextResponse.json({ error: "Your name is required" }, { status: 400 });
  if (!city) return NextResponse.json({ error: "Your city is required" }, { status: 400 });

  const consent = {
    app: Boolean(consentRaw?.app),
    email: Boolean(consentRaw?.email),
    sms: Boolean(consentRaw?.sms),
    whatsapp: Boolean(consentRaw?.whatsapp),
  };

  const result = await withCurrentUser(async (tx) => {
    const fan = await tx.fan.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!fan) return { status: 404 as const, error: "Fan profile not found" };

    await tx.fan.update({
      where: { id: fan.id },
      data: { fullName, phone: phone || undefined, location: city, consent },
    });
    return { status: 200 as const };
  });

  if (result.status !== 200) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
