import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

// Clerk's "Core 3" removed <SignedIn>/<SignedOut> in favor of the
// server-only <Show when="signed-in|signed-out"> component — confirmed by
// reading node_modules/@clerk/nextjs/dist/types directly since this
// package version is newer than general training data.
export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-6 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-2xl font-semibold">ENKORE rebuild — auth smoke test</h1>
      <Show when="signed-out">
        <div className="flex gap-4">
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </div>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-4">
          <UserButton />
          <Link href="/dashboard" className="underline">
            Go to dashboard
          </Link>
        </div>
      </Show>
    </div>
  );
}
