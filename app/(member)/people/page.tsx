import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip } from "@/components/org/OrgChip";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { InterestTag, Organisation } from "@/lib/supabase/types";

const COUNTRIES: { code: string; name: string }[] = [
  { code: "", name: "All countries" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "SN", name: "Senegal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
];

type PublicMember = {
  id: string;
  handle: string | null;
  name: string | null;
  country: string | null;
  city: string | null;
  primary_org_id: string | null;
  description_freetext: string | null;
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tagSlug = typeof sp.tag === "string" ? sp.tag : "";
  const country = typeof sp.country === "string" ? sp.country : "";

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Load my tag slugs for "matching tags" pill
  const { data: myTagRows } = await supabase
    .from("member_tags")
    .select("tag_id, interest_tags!inner(slug, name_en)")
    .eq("member_id", user.id);
  const mySlugs = new Set<string>();
  (myTagRows ?? []).forEach((r) => {
    const raw = (r as { interest_tags: unknown }).interest_tags;
    const t = Array.isArray(raw) ? raw[0] : raw;
    if (t && typeof (t as { slug?: unknown }).slug === "string") {
      mySlugs.add((t as { slug: string }).slug);
    }
  });

  // All tags for filter dropdown
  const { data: allTags } = await supabase
    .from("interest_tags")
    .select("id, slug, name_en, name_fr, group, color, adjacency_slugs")
    .order("name_en");
  const tags = (allTags as InterestTag[] | null) ?? [];

  // Find member_ids with the selected tag, if any
  let restrictIds: string[] | null = null;
  if (tagSlug) {
    const tag = tags.find((t) => t.slug === tagSlug);
    if (tag) {
      const { data: hits } = await supabase
        .from("member_tags")
        .select("member_id")
        .eq("tag_id", tag.id);
      restrictIds = (hits ?? []).map((h) => h.member_id as string);
      if (restrictIds.length === 0) restrictIds = ["00000000-0000-0000-0000-000000000000"];
    }
  }

  let q = supabase
    .from("public_members")
    .select("id, handle, name, country, city, primary_org_id, description_freetext")
    .neq("id", user.id)
    .limit(60);
  if (country) q = q.eq("country", country);
  if (restrictIds) q = q.in("id", restrictIds);
  const { data: membersData } = await q;
  const members = (membersData as PublicMember[] | null) ?? [];

  // Batch-load orgs and tags for the visible set
  const orgIds = Array.from(
    new Set(members.map((m) => m.primary_org_id).filter((x): x is string => !!x)),
  );
  const orgMap = new Map<string, Organisation>();
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase
      .from("organisations")
      .select("*")
      .in("id", orgIds);
    (orgs as Organisation[] | null)?.forEach((o) => orgMap.set(o.id, o));
  }

  const memberIds = members.map((m) => m.id);
  const tagsByMember = new Map<string, { slug: string; name_en: string }[]>();
  if (memberIds.length > 0) {
    const { data: mtRows } = await supabase
      .from("member_tags")
      .select("member_id, interest_tags!inner(slug, name_en)")
      .in("member_id", memberIds);
    (mtRows ?? []).forEach((r) => {
      const row = r as { member_id: string; interest_tags: unknown };
      const raw = row.interest_tags;
      const t = Array.isArray(raw) ? raw[0] : raw;
      if (!t || typeof (t as { slug?: unknown }).slug !== "string") return;
      const tag = t as { slug: string; name_en: string };
      const arr = tagsByMember.get(row.member_id) ?? [];
      arr.push(tag);
      tagsByMember.set(row.member_id, arr);
    });
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-6xl mx-auto">
      <SectionHead
        num="02"
        kicker="People"
        sub="Women in the network who overlap with what you care about, or share a place with you."
      >
        <em>Find your people</em>.
      </SectionHead>

      <form method="GET" action="/people" className="flex flex-wrap items-center gap-3 mb-6">
        <Label>Interest</Label>
        <select
          name="tag"
          defaultValue={tagSlug}
          className="font-mono text-[11px] tracking-[0.12em] uppercase px-2 py-1.5 bg-transparent"
          style={{ color: C.ink, border: `1.5px solid ${C.ink}` }}
        >
          <option value="">Any</option>
          {tags.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name_en}
            </option>
          ))}
        </select>
        <Label>Country</Label>
        <select
          name="country"
          defaultValue={country}
          className="font-mono text-[11px] tracking-[0.12em] uppercase px-2 py-1.5 bg-transparent"
          style={{ color: C.ink, border: `1.5px solid ${C.ink}` }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold px-3 py-1.5"
          style={{ background: C.ink, color: C.paper }}
        >
          Filter →
        </button>
      </form>

      {members.length === 0 ? (
        <div
          className="p-8 text-center"
          style={{ border: `1.5px dashed ${C.ink}55`, color: C.inkSoft }}
        >
          <p className="italic font-display text-lg">
            No one matches those filters yet. Try widening.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => {
            const org = m.primary_org_id ? orgMap.get(m.primary_org_id) : null;
            const theirTags = tagsByMember.get(m.id) ?? [];
            const shared = theirTags.filter((t) => mySlugs.has(t.slug));
            return (
              <article
                key={m.id}
                className="p-4 flex flex-col"
                style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3
                      className="font-display italic text-xl leading-tight"
                      style={{ color: C.ink }}
                    >
                      {m.name || m.handle || "Someone"}
                    </h3>
                    {m.handle && m.name && (
                      <div
                        className="font-mono text-[11px] tracking-[0.14em]"
                        style={{ color: C.inkMute }}
                      >
                        @{m.handle}
                      </div>
                    )}
                  </div>
                  {org && (
                    <OrgChip
                      org={{
                        id: org.id,
                        slug: org.slug,
                        name: org.name,
                        short_name: org.short_name,
                        type: org.type,
                        brand_color: org.brand_color,
                      }}
                    />
                  )}
                </div>

                {(m.city || m.country) && (
                  <div
                    className="mt-2 font-mono text-[11px] tracking-[0.14em] uppercase"
                    style={{ color: C.inkMute }}
                  >
                    {[m.city, m.country].filter(Boolean).join(" · ")}
                  </div>
                )}

                {shared.length > 0 && (
                  <div className="mt-3">
                    <Label color={C.green}>Shared</Label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {shared.slice(0, 5).map((t) => (
                        <span
                          key={t.slug}
                          className="font-mono text-[10px] tracking-[0.12em] uppercase px-1.5 py-0.5"
                          style={{ color: C.green, border: `1px solid ${C.green}88` }}
                        >
                          {t.name_en}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2 opacity-60 cursor-not-allowed"
                    style={{ color: C.ink, border: `1.5px solid ${C.ink}` }}
                  >
                    Say hello
                  </button>
                  {m.handle && (
                    <Link
                      href={`/people/${m.handle}`}
                      className="font-mono text-[11px] tracking-[0.14em] uppercase"
                      style={{ color: C.inkSoft }}
                    >
                      View trail →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
