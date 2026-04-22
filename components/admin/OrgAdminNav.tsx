"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { C } from "@/lib/design/tokens";

type NavItem = { href: string; label: string; match?: (p: string) => boolean };

export function OrgAdminNav({ slug }: { slug: string }) {
  const pathname = usePathname() ?? `/orgs/${slug}/admin`;
  const base = `/orgs/${slug}/admin`;

  const items: NavItem[] = [
    { href: base, label: "Home", match: (p) => p === base },
    { href: `${base}/items`, label: "Items", match: (p) => p.startsWith(`${base}/items`) },
    { href: `${base}/team`, label: "Team", match: (p) => p.startsWith(`${base}/team`) },
    { href: `${base}/roster`, label: "Roster", match: (p) => p.startsWith(`${base}/roster`) },
    { href: `/orgs/${slug}/impact`, label: "Impact", match: (p) => p === `/orgs/${slug}/impact` },
    { href: `${base}/settings`, label: "Settings", match: (p) => p.startsWith(`${base}/settings`) },
  ];

  return (
    <nav className="hidden md:flex items-center gap-5 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold">
      {items.map((item) => {
        const active = item.match ? item.match(pathname) : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{
              color: active ? C.ink : C.inkSoft,
              textDecoration: active ? "underline" : "none",
              textDecorationColor: active ? C.coral : "transparent",
              textDecorationThickness: active ? 2 : undefined,
              textUnderlineOffset: active ? 6 : undefined,
              outlineColor: C.coral,
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
