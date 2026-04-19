import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip } from "@/components/org/OrgChip";
import type { Organisation } from "@/lib/supabase/types";

export default async function AdminOrgsPage() {
  const supabase = await getSupabaseServer();
  const { data: orgs } = await supabase
    .from("organisations")
    .select("*")
    .order("type")
    .order("name");

  const rows = (orgs ?? []) as Organisation[];

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-7">
        <SectionHead num="01" kicker="the federation">
          Organisations under the umbrella.
        </SectionHead>
        <Link
          href="/admin/orgs/new"
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-5 py-3"
          style={{
            background: C.ink,
            color: C.paper,
            border: `1.5px solid ${C.ink}`,
          }}
        >
          + new organisation
        </Link>
      </div>

      <div style={{ border: `1.5px solid ${C.ink}` }}>
        <div
          className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{
            background: C.paperAlt,
            color: C.inkMute,
            borderBottom: `1.5px solid ${C.ink}`,
          }}
        >
          <span>chip</span>
          <span>name</span>
          <span>type</span>
          <span>country</span>
          <span>status</span>
          <span>edit</span>
        </div>
        {rows.length === 0 ? (
          <div
            className="px-5 py-8 text-center italic font-serif text-lg"
            style={{ color: C.inkMute }}
          >
            No organisations yet. <Link href="/admin/orgs/new" style={{ color: C.coral }}>Add the first one →</Link>
          </div>
        ) : (
          rows.map((o, i) => (
            <div
              key={o.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 items-center"
              style={{
                background: i % 2 ? C.paper : C.paperAlt,
                borderBottom:
                  i < rows.length - 1 ? `1px solid ${C.ink}22` : undefined,
              }}
            >
              <OrgChip org={o} />
              <span className="font-serif text-[17px]" style={{ color: C.ink }}>
                {o.name}
                {o.tagline ? (
                  <span
                    className="ml-2 italic text-[13px]"
                    style={{ color: C.inkMute }}
                  >
                    — {o.tagline}
                  </span>
                ) : null}
              </span>
              <span
                className="font-mono text-[10px] tracking-[0.18em] uppercase"
                style={{ color: C.inkSoft }}
              >
                {o.type}
              </span>
              <span
                className="font-mono text-[11px] tracking-wider uppercase"
                style={{ color: C.ink }}
              >
                {o.country_code ?? "—"}
              </span>
              <span
                className="font-mono text-[10px] tracking-[0.18em] uppercase"
                style={{ color: o.status === "active" ? C.green : C.inkMute }}
              >
                {o.status}
              </span>
              <Link
                href={`/admin/orgs/${o.id}`}
                className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                style={{ color: C.coral }}
              >
                edit →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
