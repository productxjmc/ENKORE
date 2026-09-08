"use client";

import { useClerk } from "@clerk/nextjs";

export default function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/m" })}
      className="min-h-[48px] w-full border-2 text-[13px] font-bold"
      style={{ borderColor: "var(--m-line)" }}
    >
      Sign out
    </button>
  );
}
