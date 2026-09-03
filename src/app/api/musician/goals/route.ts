import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";

// Ported from the Base44 app's src/components/goals/GoalForm.jsx.
// goal_write RLS already covers full owner CRUD, so withCurrentUser is
// enough for both list and create.
export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const goals = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return [];
    return tx.goal.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } });
  });

  return NextResponse.json({ goals: toPlain(goals) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const goalType = body?.goalType;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const targetValue = Number(body?.targetValue);
  const endDate = typeof body?.endDate === "string" ? body.endDate : "";

  if (!["REVENUE", "FOLLOWERS", "TRACKS", "DOWNLOADS", "CUSTOM"].includes(goalType)) {
    return NextResponse.json({ error: "Invalid goal type" }, { status: 400 });
  }
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!Number.isFinite(targetValue) || targetValue <= 0) return NextResponse.json({ error: "Target value must be greater than 0" }, { status: 400 });
  if (!endDate) return NextResponse.json({ error: "Deadline is required" }, { status: 400 });

  type Result = { status: 404; error: string } | { status: 200; goal: unknown };

  const result = await withCurrentUser<Result>(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404, error: "Musician not found" };

    const goal = await tx.goal.create({
      data: {
        musicianId: musician.id,
        goalType,
        title,
        description: body?.description || undefined,
        targetValue,
        startDate: new Date(),
        endDate: new Date(endDate),
      },
    });
    return { status: 200, goal };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ goal: toPlain(result.goal) });
}
