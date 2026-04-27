import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip } from "@/components/org/OrgChip";
import { getSupabaseServer } from "@/lib/supabase/server";
import { MilestonesPanel } from "@/components/learning/MilestonesPanel";
import { ActivityTrail, type ActivityRow } from "@/components/member/ActivityTrail";
import { PublicSkillsToggle } from "./PublicSkillsToggle";
import { toggleRosterVisibilityAction } from "./roster-actions";
import type { Member, Milestone, Organisation } from "@/lib/supabase/types";

const dateFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

export default async function MePage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: meData } = await supabase
    .from("members")
    .select("*")
    .eq("id", user.id)
    .single();
  const me = meData as Member | null;
  if (!me) return null;

  type TagRow = {
    source: "declared" | "derived" | "activity_inferred";
    interest_tags: {
      slug: string;
      name_en: string;
      color: string | null;
      group: string;
    } | null;
  };

  // All independent member-scoped fetches in parallel — saves ~5 round trips
  // on the page that gets hit on every login.
  const [
    primaryOrgRes,
    tagRowsRes,
    milestonesRes,
    activitiesRes,
    skillsRes,
    attendedHostsRes,
  ] = await Promise.all([
    me.primary_org_id
      ? supabase
          .from("organisations")
          .select("*")
          .eq("id", me.primary_org_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("member_tags")
      .select("source, interest_tags!inner(slug, name_en, color, group)")
      .eq("member_id", user.id),
    supabase
      .from("milestones")
      .select("*")
      .eq("member_id", user.id)
      .order("set_at", { ascending: false }),
    supabase
      .from("activities")
      .select(
        "id, title, kind, kind_group, xp_awarded, created_at, host:organisations(id, slug, name, short_name, type, brand_color)",
      )
      .eq("member_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("member_skills")
      .select("id, skill_name, level, is_public")
      .eq("member_id", user.id),
    supabase
      .from("item_registrations")
      .select("items!inner(host_org_id)")
      .eq("member_id", user.id)
      .eq("attended", true),
  ]);

  const primaryOrg = (primaryOrgRes.data as Organisation | null) ?? null;
  const tagRows = tagRowsRes.data;
  const declared: TagRow[] = [];
  const derived: TagRow[] = [];
  (tagRows as TagRow[] | null)?.forEach((r) => {
    if (!r.interest_tags) return;
    if (r.source === "declared") declared.push(r);
    else derived.push(r);
  });
  const milestones = (milestonesRes.data as Milestone[] | null) ?? [];
  const activitiesData = activitiesRes.data;
  type RawActivity = {
    id: string;
    title: string | null;
    kind: string;
    kind_group: "doing" | "learning" | "reflection";
    xp_awarded: number;
    created_at: string;
    host: {
      id: string;
      slug: string;
      name: string;
      short_name: string | null;
      type: string;
      brand_color: string | null;
    } | null;
  };
  const activities: ActivityRow[] = ((activitiesData as RawActivity[] | null) ?? []).map((a) => ({
    id: a.id,
    what: a.title || a.kind.replace(/_/g, " "),
    host: a.host
      ? {
          id: a.host.id,
          slug: a.host.slug,
          name: a.host.name,
          short_name: a.host.short_name,
          type: a.host.type,
          brand_color: a.host.brand_color,
        }
      : { name: "FIGN", type: "umbrella" },
    xp: a.xp_awarded,
    kind_group: a.kind_group,
    created_at: a.created_at,
  }));

  const skills = (skillsRes.data ?? []) as {
    id: string;
    skill_name: string;
    level: number;
    is_public: boolean;
  }[];
  const anyPublic = skills.some((s) => s.is_public);

  // Orgs the member could appear on: primary + any org whose item they attended.
  const rosterableOrgIds = new Set<string>();
  if (me.primary_org_id) rosterableOrgIds.add(me.primary_org_id);
  for (const row of (attendedHostsRes.data ?? []) as unknown as {
    items: { host_org_id: string } | { host_org_id: string }[] | null;
  }[]) {
    const it = Array.isArray(row.items) ? row.items[0] : row.items;
    if (it?.host_org_id) rosterableOrgIds.add(it.host_org_id);
  }

  const rosterableOrgs: Organisation[] = [];
  const visByOrg = new Map<string, boolean>();
  if (rosterableOrgIds.size > 0) {
    const ids = Array.from(rosterableOrgIds);
    const { data: orgsData } = await supabase
      .from("organisations")
      .select("*")
      .in("id", ids)
      .eq("public_page_enabled", true);
    rosterableOrgs.push(...((orgsData ?? []) as Organisation[]));

    const { data: visData } = await supabase
      .from("org_roster_visibility")
      .select("org_id, visible_in_public_roster")
      .eq("member_id", user.id)
      .in("org_id", ids);
    for (const r of (visData ?? []) as {
      org_id: string;
      visible_in_public_roster: boolean;
    }[]) {
      visByOrg.set(r.org_id, r.visible_in_public_roster);
    }
  }

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-4xl mx-auto">
      <Label>§ your profile · as others see it</Label>
      <h1
        className="mt-3 font-display italic text-4xl md:text-5xl leading-[1.05]"
        style={{ color: C.ink }}
      >
        {me.name || me.handle || "You"}
      </h1>
      <div
        className="mt-2 font-mono text-[11px] tracking-[0.18em] uppercase flex flex-wrap items-center gap-2"
        style={{ color: C.inkMute }}
      >
        {me.handle && <span>@{me.handle}</span>}
        {(me.city || me.country) && (
          <>
            <span>·</span>
            <span>{[me.city, me.country].filter(Boolean).join(" · ")}</span>
          </>
        )}
        <span>·</span>
        <span>joined {dateFmt.format(new Date(me.joined_at))}</span>
      </div>

      {primaryOrg && (
        <div className="mt-4">
          <OrgChip
            org={{
              id: primaryOrg.id,
              slug: primaryOrg.slug,
              name: primaryOrg.name,
              short_name: primaryOrg.short_name,
              type: primaryOrg.type,
              brand_color: primaryOrg.brand_color,
            }}
            size="md"
          />
        </div>
      )}

      {me.description_freetext && (
        <p
          className="mt-6 font-display italic text-xl leading-snug max-w-2xl"
          style={{ color: C.inkSoft }}
        >
          {me.description_freetext}
        </p>
      )}

      <section className="mt-10">
        <SectionHead
          num="01"
          kicker="Interests"
          sub="What you told us you care about, plus what we've noticed from your activity."
        >
          Your <em>map</em>, in words.
        </SectionHead>

        {declared.length > 0 && (
          <div className="mb-5">
            <Label>Declared</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {declared.map((r) => (
                <span
                  key={r.interest_tags!.slug}
                  className="font-mono text-[11px] tracking-[0.14em] uppercase px-2 py-0.5"
                  style={{
                    color: C.ink,
                    border: `1.5px solid ${C.ink}`,
                  }}
                >
                  {r.interest_tags!.name_en}
                </span>
              ))}
            </div>
          </div>
        )}
        {derived.length > 0 && (
          <div>
            <Label color={C.coral}>Derived from activity</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {derived.map((r) => (
                <span
                  key={r.interest_tags!.slug}
                  className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-0.5 italic"
                  style={{
                    color: C.coral,
                    border: `1px dashed ${C.coral}aa`,
                  }}
                >
                  {r.interest_tags!.name_en}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <ActivityTrail activities={activities} />

      <MilestonesPanel initial={milestones} />

      <section className="mt-14">
        <SectionHead
          num="04"
          kicker="Skills on your public profile"
          sub="Evidence-backed from your activity. You choose whether others can see them."
        >
          Who <em>sees</em> what.
        </SectionHead>
        <PublicSkillsToggle initial={anyPublic} />
        {skills.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm" style={{ color: C.inkSoft }}>
            {skills.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span className="font-display italic">{s.skill_name}</span>
                <span
                  className="font-mono text-[10px] tracking-[0.18em] uppercase"
                  style={{ color: s.is_public ? C.green : C.inkMute }}
                >
                  lvl {s.level} · {s.is_public ? "public" : "private"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {rosterableOrgs.length > 0 && (
        <section className="mt-14">
          <SectionHead
            num="05"
            kicker="Show me on these org pages"
            sub="Private by default. Flip a toggle to appear on an org's public member list. Reversible anytime."
          >
            Where you <em>show up</em>.
          </SectionHead>
          <ul className="mt-4 space-y-2">
            {rosterableOrgs.map((o) => {
              const visible = visByOrg.get(o.id) === true;
              return (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-4 py-2"
                  style={{ borderBottom: `1px solid ${C.hairline}` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <OrgChip org={o} />
                    <span
                      className="font-display text-[16px] truncate"
                      style={{ color: C.ink }}
                    >
                      {o.name}
                    </span>
                  </div>
                  <form action={toggleRosterVisibilityAction}>
                    <input type="hidden" name="org_id" value={o.id} />
                    <input type="hidden" name="org_slug" value={o.slug} />
                    <input
                      type="hidden"
                      name="next"
                      value={visible ? "0" : "1"}
                    />
                    <button
                      type="submit"
                      className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold px-3 py-1"
                      style={{
                        background: visible ? C.green : "transparent",
                        color: visible ? C.paper : C.ink,
                        border: `1.5px solid ${visible ? C.green : C.ink}`,
                      }}
                    >
                      {visible ? "✓ showing" : "show me"}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
