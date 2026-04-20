"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { C } from "@/lib/design/tokens";

type NavItem = { href: string; label: string; match?: (p: string) => boolean };

const ITEMS: NavItem[] = [
  { href: "/map",          label: "Map",    match: (p) => p === "/map" },
  { href: "/learn",        label: "Learn",  match: (p) => p.startsWith("/learn") || p.startsWith("/lessons") },
  { href: "/events",       label: "Events", match: (p) => p.startsWith("/events") },
  { href: "/people",       label: "People", match: (p) => p.startsWith("/people") },
  { href: "/orgs-follow",  label: "Orgs",   match: (p) => p.startsWith("/orgs-follow") || p.startsWith("/orgs/") },
  { href: "/me",           label: "Trail",  match: (p) => p.startsWith("/me") },
];

export function MemberNav() {
  const pathname = usePathname() ?? "/map";
  return (
    <nav className="hidden md:flex items-center gap-5 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold">
      {ITEMS.map((item) => {
        const active = item.match ? item.match(pathname) : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
            style={{
              color: active ? C.ink : C.inkMute,
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
