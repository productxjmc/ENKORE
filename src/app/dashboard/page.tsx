import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth";

// Smoke test for the full chain: proxy.ts does the optimistic route gate,
// Clerk authenticates, getCurrentAppUser() resolves (or lazily creates)
// the matching User row through withServiceRole. The redirect below is
// the real check — proxy.ts matching is optimistic only (see Next.js's
// own authentication guide), so every protected page must still verify
// for itself rather than trusting it was gated upstream.
export default async function DashboardPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/");

  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-4 p-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <pre className="rounded bg-black/5 p-4 text-sm dark:bg-white/10">
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
}
