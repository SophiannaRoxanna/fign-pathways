import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { Label } from "@/components/ui/Label";

// Admin dashboard. Top-level stat cards + the four quick-action surfaces.
export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServer();

  const [orgs, members, items, lessons] = await Promise.all([
    supabase.from("organisations").select("*", { count: "exact", head: true }),
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase.from("items").select("*", { count: "exact", head: true }),
    supabase
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  const stats: { num: string; label: string }[] = [
    { num: String(orgs.count ?? 0), label: "Organisations" },
    { num: String(members.count ?? 0), label: "Members" },
    { num: String(items.count ?? 0), label: "Items posted" },
    { num: String(lessons.count ?? 0), label: "Lessons published" },
  ];

  const actions: { href: string; label: string; accent: string }[] = [
    { href: "/admin/orgs/new", label: "+ New organisation", accent: C.purple },
    { href: "/admin/items/new", label: "+ Post an item", accent: C.coral },
    { href: "/admin/lessons/new", label: "+ Write a lesson", accent: C.blue },
    { href: "/admin/members", label: "Review members →", accent: C.green },
  ];

  return (
    <div>
      <SectionHead
        num="00"
        kicker="umbrella desk"
        sub="Sophia's workbench. Everything that federates — orgs, items, lessons, members — is posted and edited from here."
      >
        The view from the <em style={{ color: C.coral }}>umbrella</em>.
      </SectionHead>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-5"
            style={{ background: C.ink, color: C.paper }}
          >
            <div
              className="text-5xl italic leading-none font-display"
              style={{ color: C.coral }}
            >
              {s.num}
            </div>
            <div
              className="mt-3 font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
              style={{ opacity: 0.9 }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Label>do something next</Label>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((a, i) => (
            <Link
              key={a.href}
              href={a.href}
              className="p-6 flex items-baseline gap-5 font-mono text-[12px] tracking-[0.18em] uppercase font-bold"
              style={{
                background: C.paperAlt,
                color: C.ink,
                border: `1.5px solid ${C.ink}`,
              }}
            >
              <span
                className="font-display italic text-3xl leading-none shrink-0"
                style={{ color: a.accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
