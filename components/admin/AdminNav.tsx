"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { C } from "@/lib/design/tokens";

type NavItem = { href: string; label: string; match?: (p: string) => boolean };

const ITEMS: NavItem[] = [
  { href: "/admin",         label: "Dashboard", match: (p) => p === "/admin" },
  { href: "/admin/orgs",    label: "Orgs",      match: (p) => p.startsWith("/admin/orgs") },
  { href: "/admin/items",   label: "Items",     match: (p) => p.startsWith("/admin/items") },
  { href: "/admin/lessons", label: "Lessons",   match: (p) => p.startsWith("/admin/lessons") },
  { href: "/admin/members", label: "Members",   match: (p) => p.startsWith("/admin/members") },
];

export function AdminNav() {
  const pathname = usePathname() ?? "/admin";
  return (
    <nav className="hidden md:flex items-center gap-5 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold">
      {ITEMS.map((item) => {
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
