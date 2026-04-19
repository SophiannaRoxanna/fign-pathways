import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip } from "@/components/org/OrgChip";
import type { Lesson, Organisation } from "@/lib/supabase/types";

export default async function AdminLessonsPage() {
  const supabase = await getSupabaseServer();
  const [{ data: lessonsData }, { data: orgsData }] = await Promise.all([
    supabase.from("lessons").select("*").order("created_at", { ascending: false }),
    supabase.from("organisations").select("*"),
  ]);
  const lessons = (lessonsData ?? []) as Lesson[];
  const orgs = (orgsData ?? []) as Organisation[];
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-7">
        <SectionHead num="03" kicker="the skills lab">
          Lessons across the federation.
        </SectionHead>
        <Link
          href="/admin/lessons/new"
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-5 py-3"
          style={{
            background: C.ink,
            color: C.paper,
            border: `1.5px solid ${C.ink}`,
          }}
        >
          + new lesson
        </Link>
      </div>

      <div style={{ border: `1.5px solid ${C.ink}` }}>
        <div
          className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] tracking-[0.2em] uppercase items-center"
          style={{
            background: C.paperAlt,
            color: C.inkMute,
            borderBottom: `1.5px solid ${C.ink}`,
          }}
        >
          <span>host</span>
          <span>title</span>
          <span>format</span>
          <span>length</span>
          <span>status</span>
          <span>edit</span>
        </div>
        {lessons.length === 0 ? (
          <div
            className="px-5 py-8 text-center italic font-display text-lg"
            style={{ color: C.inkMute }}
          >
            No lessons yet. <Link href="/admin/lessons/new" style={{ color: C.coral }}>Write the first one →</Link>
          </div>
        ) : (
          lessons.map((l, i) => {
            const host = orgById.get(l.host_org_id);
            return (
              <div
                key={l.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 items-center"
                style={{
                  background: i % 2 ? C.paper : C.paperAlt,
                  borderBottom:
                    i < lessons.length - 1 ? `1px solid ${C.ink}22` : undefined,
                }}
              >
                {host ? (
                  <OrgChip org={host} />
                ) : (
                  <span style={{ color: C.inkMute }}>—</span>
                )}
                <span
                  className="font-display text-[17px] truncate"
                  style={{ color: C.ink }}
                >
                  {l.title}
                </span>
                <span
                  className="font-mono text-[10px] tracking-[0.18em] uppercase"
                  style={{ color: C.inkSoft }}
                >
                  {l.format}
                </span>
                <span
                  className="font-mono text-[11px]"
                  style={{ color: C.ink }}
                >
                  {l.length_min} min
                </span>
                <span
                  className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
                  style={{
                    color: C.paper,
                    background: l.status === "published" ? C.green : C.inkMute,
                    padding: "3px 8px",
                  }}
                >
                  {l.status}
                </span>
                <Link
                  href={`/admin/lessons/${l.id}`}
                  className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                  style={{ color: C.coral }}
                >
                  edit →
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
