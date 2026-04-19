import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip } from "@/components/org/OrgChip";
import { getSupabaseServer } from "@/lib/supabase/server";
import { MilestonesPanel } from "@/components/learning/MilestonesPanel";
import { ActivityTrail, type ActivityRow } from "@/components/member/ActivityTrail";
import { PublicSkillsToggle } from "./PublicSkillsToggle";
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

  let primaryOrg: Organisation | null = null;
  if (me.primary_org_id) {
    const { data } = await supabase
      .from("organisations")
      .select("*")
      .eq("id", me.primary_org_id)
      .maybeSingle();
    primaryOrg = data as Organisation | null;
  }

  const { data: tagRows } = await supabase
    .from("member_tags")
    .select("source, interest_tags!inner(slug, name_en, color, group)")
    .eq("member_id", user.id);
  type TagRow = {
    source: "declared" | "derived" | "activity_inferred";
    interest_tags: {
      slug: string;
      name_en: string;
      color: string | null;
      group: string;
    } | null;
  };
  const declared: TagRow[] = [];
  const derived: TagRow[] = [];
  (tagRows as TagRow[] | null)?.forEach((r) => {
    if (!r.interest_tags) return;
    if (r.source === "declared") declared.push(r);
    else derived.push(r);
  });

  const { data: milestonesData } = await supabase
    .from("milestones")
    .select("*")
    .eq("member_id", user.id)
    .order("set_at", { ascending: false });
  const milestones = (milestonesData as Milestone[] | null) ?? [];

  const { data: activitiesData } = await supabase
    .from("activities")
    .select("id, title, kind, kind_group, xp_awarded, created_at, host:organisations(id, slug, name, short_name, type, brand_color)")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);
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

  const { data: skillsData } = await supabase
    .from("member_skills")
    .select("id, skill_name, level, is_public")
    .eq("member_id", user.id);
  const skills = (skillsData ?? []) as {
    id: string;
    skill_name: string;
    level: number;
    is_public: boolean;
  }[];
  const anyPublic = skills.some((s) => s.is_public);

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
    </div>
  );
}
