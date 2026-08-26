import { FirstFruitsForm } from "./FirstFruitsForm";

// Copy verbatim from "ENKORE Connect — First Fruits Application Copy".
// Dark charcoal / gold-accent direction per the UI/UX Design Brief
// (§2 Colour Palette) — that brief itself notes no brand guideline is
// finalised yet, so treat this styling as the working direction, not locked.
export default function FirstFruitsPage() {
  return (
    <div className="min-h-full bg-[#1A1A1A] px-6 py-16 text-[#F5F5F5]">
      <div className="mx-auto flex max-w-xl flex-col gap-10">
        <div className="flex flex-col gap-4 text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            ENKORE Connect isn&apos;t open to everyone. Yet.
          </h1>
          <p className="text-[#A0A0A0]">
            We&apos;re opening First Fruits to Christian musicians who want in early. Not to gatekeep — First Fruits
            is about being first, not about being one of a few. The first offering is always the one that sets the
            standard for the harvest that follows, and that&apos;s what we need this to be.
          </p>
          <p className="text-sm text-[#A0A0A0]">Takes 2 minutes. We read every application ourselves.</p>
        </div>

        <FirstFruitsForm />
      </div>
    </div>
  );
}
