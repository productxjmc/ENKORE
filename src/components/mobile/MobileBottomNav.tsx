"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Disc3, Library, Ticket, User } from "lucide-react";

// Member-role nav only, per the design's slide 13 ("the hinge of the whole
// app" — nav items change with the role switch). Musician (Studio/
// Community/Money/Profile) and Partner (Partner/Activity/Payout/Profile)
// variants come in Phase 1 once real role state exists — this is deliberately
// a single fixed nav for Phase 0's shell smoke test, not the full switcher.
const MEMBER_NAV = [
  { href: "/m", label: "Home", icon: Home },
  { href: "/m/musicians", label: "Musicians", icon: Disc3 },
  { href: "/m/library", label: "Library", icon: Library },
  { href: "/m/tickets", label: "Tickets", icon: Ticket },
  { href: "/m/profile", label: "Profile", icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-20 grid grid-cols-5 border-t-2"
      style={{ background: "var(--m-ground)", borderColor: "var(--m-line)" }}
    >
      {MEMBER_NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/m" ? pathname === "/m" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold"
            style={{ color: active ? "var(--m-accent)" : "var(--m-text-muted)" }}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
