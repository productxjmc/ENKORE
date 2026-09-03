import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { parseFanFile, detectFanFileFormat } from "@/lib/fanImport";

// Preview-only step of the fan-import flow (src/app/dashboard/import-fans):
// fetches the just-uploaded Blob, extracts candidate emails, and returns
// them for the musician to review — nothing is written to the database
// here. The actual Fan/Follow creation happens in .../confirm/route.ts
// after the musician has had a chance to remove bad entries (PDF/DOCX text
// extraction can misfire on scanned or oddly-formatted documents).
const MAX_PREVIEW_FANS = 2000;

export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url : null;
  const fileName = typeof body?.fileName === "string" ? body.fileName : "";

  // This route server-side fetches whatever URL it's given — restricted to
  // our own Blob storage host, not any https:// URL, so an authenticated
  // caller can't turn this into an SSRF probe against internal services.
  const isOwnBlobUrl = (() => {
    try {
      return new URL(url ?? "").hostname.endsWith(".public.blob.vercel-storage.com");
    } catch {
      return false;
    }
  })();

  const format = detectFanFileFormat(fileName);
  if (!isOwnBlobUrl || !format) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    const fileRes = await fetch(url);
    if (!fileRes.ok) throw new Error("fetch failed");
    buffer = Buffer.from(await fileRes.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded file" }, { status: 502 });
  }

  let fans;
  try {
    fans = await parseFanFile(buffer, format);
  } catch (err) {
    console.error("[fan import parse] failed:", err);
    return NextResponse.json({ error: "Could not parse this file. Please check the format and try again." }, { status: 422 });
  }

  const truncated = fans.length > MAX_PREVIEW_FANS;
  return NextResponse.json({ fans: fans.slice(0, MAX_PREVIEW_FANS), truncated, total: fans.length });
}
