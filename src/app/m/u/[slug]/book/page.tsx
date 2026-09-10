import { notFound } from "next/navigation";
import { withCurrentUser } from "@/lib/auth";
import BookingRequestForm from "@/components/mobile/BookingRequestForm";

export default async function MobileBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const musician = await withCurrentUser((tx) =>
    tx.musician.findFirst({ where: { OR: [{ storefrontUrl: slug }, { id: slug }] }, select: { id: true, musicianName: true } }),
  );
  if (!musician) notFound();

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Book an event</p>
      <h1 className="mt-1.5 text-[22px] font-extrabold uppercase tracking-[-0.02em]">{musician.musicianName}</h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
        Tell {musician.musicianName} about your event — they&apos;ll get back to you directly.
      </p>
      <div className="mt-5">
        <BookingRequestForm musicianId={musician.id} musicianName={musician.musicianName} />
      </div>
    </div>
  );
}
