import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import { slugify } from "@/lib/slugify";

// Ported from the Base44 app's src/pages/UploadTrack.jsx and
// src/components/dashboard/InlineUploadPanel.jsx — consolidated into one
// create path for both (see TrackUploadForm.tsx, rendered inline on the
// dashboard and at /dashboard/upload-track). track_write RLS already
// lets an owner write their own rows, so withCurrentUser is enough.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const genre = typeof body?.genre === "string" ? body.genre.trim() : "";
  const audioFileUrl = typeof body?.audioFileUrl === "string" ? body.audioFileUrl.trim() : "";
  const coverArt = typeof body?.coverArt === "string" ? body.coverArt.trim() : "";

  if (!title || !genre || !audioFileUrl || !coverArt) {
    return NextResponse.json({ error: "Title, genre, cover art, and audio file are all required" }, { status: 400 });
  }

  const basePrice = Number(body?.basePrice ?? 0);
  const payWhatYouWant = Boolean(body?.payWhatYouWant);
  const minimumPrice = Number(body?.minimumPrice ?? 0);
  if (!Number.isFinite(basePrice) || basePrice < 0) return NextResponse.json({ error: "Price must be 0 or greater" }, { status: 400 });
  if (!Number.isFinite(minimumPrice) || minimumPrice < 0) return NextResponse.json({ error: "Minimum price must be 0 or greater" }, { status: 400 });

  type Result = { status: 404; error: string } | { status: 200; track: unknown };

  const result = await withCurrentUser<Result>(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404, error: "Musician profile not found" };

    const baseSlug = slugify(title) || "track";
    let slug = baseSlug;
    for (let attempt = 1; attempt <= 10; attempt++) {
      const clash = await tx.track.findUnique({ where: { musicianId_slug: { musicianId: musician.id, slug } } });
      if (!clash) break;
      slug = `${baseSlug}-${attempt}`;
    }

    const track = await tx.track.create({
      data: {
        musicianId: musician.id,
        title,
        slug,
        description: body?.description || undefined,
        genre,
        coverArt,
        audioFileUrl,
        basePrice,
        payWhatYouWant,
        minimumPrice,
        releaseDate: body?.releaseDate ? new Date(body.releaseDate) : undefined,
        duration: body?.duration || undefined,
        lyrics: body?.lyrics || undefined,
        songwriters: Array.isArray(body?.songwriters) ? body.songwriters : [],
        producers: Array.isArray(body?.producers) ? body.producers : [],
        bpm: body?.bpm ? Number(body.bpm) : undefined,
        key: body?.key || undefined,
        mood: body?.mood || undefined,
      },
    });

    await tx.musician.update({ where: { id: musician.id }, data: { tracksUploaded: { increment: 1 } } });

    return { status: 200, track };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ track: toPlain(result.track) });
}
