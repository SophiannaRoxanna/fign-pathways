import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { Label } from "@/components/ui/Label";
import { OrgChip } from "@/components/org/OrgChip";
import { inputStyle } from "@/components/admin/form";
import type { Member, Organisation } from "@/lib/supabase/types";

type PageProps = {
  searchParams: Promise<{ country?: string; primary_org?: string }>;
};

export default async function AdminMembersPage({ searchParams }: PageProps) {
  const { country, primary_org } = await searchParams;
  const supabase = await getSupabaseServer();

  let query = supabase.from("members").select("*").order("joined_at", { ascending: false });
  if (country) query = query.eq("country", country);
  if (primary_org) query = query.eq("primary_org_id", primary_org);

  const [{ data: membersData }, { data: orgsData }, { data: allForCountries }] =
    await Promise.all([
      query,
      supabase.from("organisations").select("*").order("name"),
      supabase.from("members").select("country"),
    ]);

  const members = (membersData ?? []) as Member[];
  const orgs = (orgsData ?? []) as Organisation[];
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  const countries = Array.from(
    new Set(
      ((allForCountries ?? []) as { country: string | null }[])
        .map((r) => r.country)
        .filter(Boolean) as string[],
    ),
  ).sort();

  return (
    <div>
      <SectionHead
        num="04"
        kicker="the membership"
        sub="Read-only roster for Phase 0. Edit surfaces arrive in Phase 1."
      >
        Members across the network.
      </SectionHead>

      <form
        method="get"
        className="mt-6 mb-6 flex flex-wrap items-end gap-3"
        style={{ borderTop: `1px solid ${C.ink}22`, paddingTop: 16 }}
      >
        <div className="flex flex-col gap-1.5">
          <Label>country</Label>
          <select
            name="country"
            defaultValue={country ?? ""}
            style={{ ...inputStyle, minWidth: 160 }}
          >
            <option value="">all countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>primary org</Label>
          <select
            name="primary_org"
            defaultValue={primary_org ?? ""}
            style={{ ...inputStyle, minWidth: 220 }}
          >
            <option value="">all orgs</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-5 py-3"
          style={{
            background: C.ink,
            color: C.paper,
            border: `1.5px solid ${C.ink}`,
          }}
        >
          filter →
        </button>
        {(country || primary_org) && (
          <Link
            href="/admin/members"
            className="font-mono text-[10px] tracking-[0.18em] uppercase"
            style={{ color: C.coral }}
          >
            clear filters
          </Link>
        )}
        <span
          className="ml-auto font-mono text-[10px] tracking-[0.18em] uppercase"
          style={{ color: C.inkMute }}
        >
          {members.length} shown
        </span>
      </form>

      <div style={{ border: `1.5px solid ${C.ink}` }}>
        <div
          className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] tracking-[0.2em] uppercase items-center"
          style={{
            background: C.paperAlt,
            color: C.inkMute,
            borderBottom: `1.5px solid ${C.ink}`,
          }}
        >
          <span>handle</span>
          <span>name</span>
          <span>country/city</span>
          <span>primary org</span>
          <span>umbrella?</span>
          <span>joined</span>
          <span>xp</span>
        </div>
        {members.length === 0 ? (
          <div
            className="px-5 py-8 text-center italic font-display text-lg"
            style={{ color: C.inkMute }}
          >
            No members match.
          </div>
        ) : (
          members.map((m, i) => {
            const org = m.primary_org_id ? orgById.get(m.primary_org_id) : null;
            return (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 items-center"
                style={{
                  background: i % 2 ? C.paper : C.paperAlt,
                  borderBottom:
                    i < members.length - 1 ? `1px solid ${C.ink}22` : undefined,
                }}
              >
                <span
                  className="font-mono text-[12px]"
                  style={{ color: C.ink }}
                >
                  {m.handle ?? "—"}
                </span>
                <span
                  className="font-display text-[16px]"
                  style={{ color: C.ink }}
                >
                  {m.name ?? "—"}
                </span>
                <span
                  className="font-mono text-[11px]"
                  style={{ color: C.inkSoft }}
                >
                  {[m.country, m.city].filter(Boolean).join(" · ") || "—"}
                </span>
                {org ? (
                  <OrgChip org={org} />
                ) : (
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: C.inkMute }}
                  >
                    —
                  </span>
                )}
                {m.is_umbrella_admin ? (
                  <span
                    className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
                    style={{
                      color: C.paper,
                      background: C.coral,
                      padding: "3px 8px",
                    }}
                  >
                    umbrella
                  </span>
                ) : (
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: C.inkMute }}
                  >
                    —
                  </span>
                )}
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ color: C.inkMute }}
                >
                  {new Date(m.joined_at).toLocaleDateString("en", {
                    timeZone: "UTC",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span
                  className="font-mono text-[11px] font-bold"
                  style={{ color: C.ink }}
                >
                  {m.xp}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
