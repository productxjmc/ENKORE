import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

// Lightweight sibling of /api/m/fan/profile — just the consent toggles,
// called from the Profile screen after the fan already exists (unlike the
// join flow, this never needs to create a Fan row).
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const consentRaw = body?.consent;
  const consent = {
    app: Boolean(consentRaw?.app),
    email: Boolean(consentRaw?.email),
    sms: Boolean(consentRaw?.sms),
    whatsapp: Boolean(consentRaw?.whatsapp),
  };

  const result = await withCurrentUser(async (tx) => {
    const fan = await tx.fan.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!fan) return { status: 404 as const };
    await tx.fan.update({ where: { id: fan.id }, data: { consent } });
    return { status: 200 as const };
  });

  if (result.status !== 200) return NextResponse.json({ error: "Fan profile not found" }, { status: result.status });
  return NextResponse.json({ ok: true });
}
