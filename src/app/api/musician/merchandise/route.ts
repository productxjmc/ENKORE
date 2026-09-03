import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";

const MAX_ITEMS = 5;
const VALID_TYPES = ["T_SHIRT", "HOODIE", "CAP", "POSTER", "VINYL"];

// Ported from the Base44 app's src/components/merch/CreateMerchandiseForm.jsx
// + MerchandiseManagement.jsx. merchandise_write RLS already covers full
// owner CRUD. The source's 5-item cap was client-only (existingItemsCount
// prop, trivially bypassable) — enforced server-side here too. Source also
// had a real multi-tenant leak (Musician.list() unfiltered, Merchandise
// unfiltered by musician_id) — this scopes every query to the caller's own
// musician, same fix as every other route this session.
export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return [];
    return tx.merchandise.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } });
  });

  return NextResponse.json({ items: toPlain(items) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const type = body?.type;
  const priceZar = Number(body?.priceZar);
  if (!name) return NextResponse.json({ error: "Product name is required" }, { status: 400 });
  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: "Invalid product type" }, { status: 400 });
  if (!Number.isFinite(priceZar) || priceZar <= 0) return NextResponse.json({ error: "A ZAR price is required" }, { status: 400 });

  type Result = { status: 404; error: string } | { status: 409; error: string } | { status: 200; item: unknown };

  const result = await withCurrentUser<Result>(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404, error: "Musician not found" };

    const existingCount = await tx.merchandise.count({ where: { musicianId: musician.id } });
    if (existingCount >= MAX_ITEMS) return { status: 409, error: `You can only have up to ${MAX_ITEMS} merchandise items` };

    const item = await tx.merchandise.create({
      data: {
        musicianId: musician.id,
        name,
        description: body?.description || undefined,
        type,
        priceZar,
        priceNgn: body?.priceNgn ? Number(body.priceNgn) : undefined,
        priceUsd: body?.priceUsd ? Number(body.priceUsd) : undefined,
        imageUrl: body?.imageUrl || undefined,
        sizes: Array.isArray(body?.sizes) ? body.sizes : [],
        isOnDemand: body?.isOnDemand !== false,
      },
    });
    return { status: 200, item };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ item: toPlain(result.item) });
}
