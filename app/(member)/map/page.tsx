import { redirect } from "next/navigation";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { getSupabaseServer } from "@/lib/supabase/server";
import type {
  Activity,
  GrowthSnapshot,
  InterestTag,
  Item,
  ItemMatch,
  Lesson,
  LessonMatch,
  Member,
  MemberSkill,
  MemberTag,
  Milestone,
  Organisation,
} from "@/lib/supabase/types";
import { InterestMap } from "@/components/member/InterestMap";
import { SkillsLab, type SkillsLabLesson } from "@/components/learning/SkillsLab";
import { MilestonesPanel } from "@/components/learning/MilestonesPanel";
import { GrowthGlance } from "@/components/learning/GrowthGlance";
import { SkillsBars } from "@/components/learning/SkillsBars";
import { MatchedFeed, type MatchedFeedCard } from "@/components/member/MatchedFeed";
import { PeoplePanel, type PeopleCard } from "@/components/member/PeoplePanel";
import { ActivityTrail, type ActivityRow } from "@/components/member/ActivityTrail";
import type { OrgChipData } from "@/components/org/OrgChip";

const joinedFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  year: "numeric",
});

function orgToChip(o: Organisation): OrgChipData {
  return {
    id: o.id,
    slug: o.slug,
    name: o.name,
    short_name: o.short_name,
    type: o.type,
    brand_color: o.brand_color,
  };
}

export default async function MapPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: meRow } = await supabase
    .from("members")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!meRow) redirect("/onboarding/start");
  const me = meRow as Member;

  const [
    tagsRes,
    memberTagsRes,
    itemsMatchRes,
    lessonsMatchRes,
    milestonesRes,
    growthRes,
    skillsRes,
    activitiesRes,
    peopleRes,
  ] = await Promise.all([
    supabase.from("interest_tags").select("*"),
    supabase
      .from("member_tags")
      .select("*, tag:interest_tags(*)")
      .eq("member_id", me.id),
    supabase.rpc("match_items_for_member", { p_member: me.id, p_limit: 12 }),
    supabase.rpc("match_lessons_for_member", { p_member: me.id, p_limit: 3 }),
    supabase
      .from("milestones")
      .select("*")
      .eq("member_id", me.id)
      .eq("status", "active")
      .order("set_at", { ascending: false }),
    supabase
      .from("growth_snapshots")
      .select("*")
      .eq("member_id", me.id),
    supabase
      .from("member_skills")
      .select("*")
      .eq("member_id", me.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("activities")
      .select("*, host:organisations(*)")
      .eq("member_id", me.id)
      .order("created_at", { ascending: false })
      .limit(12),
    me.country
      ? supabase
          .from("public_members")
          .select("*, org:organisations(*)")
          .eq("country", me.country)
          .neq("id", me.id)
          .limit(6)
      : Promise.resolve({ data: [] as unknown[], error: null }),
  ]);

  const allTags = (tagsRes.data ?? []) as InterestTag[];
  const tagBySlug = new Map(allTags.map((t) => [t.slug, t]));

  // Member tags with joined tag row
  type MemberTagJoined = MemberTag & { tag: InterestTag | null };
  const memberTags = (memberTagsRes.data ?? []) as MemberTagJoined[];

  const declaredSlugs: string[] = [];
  const derivedSlugs: string[] = [];
  const ownedSlugs = new Set<string>();
  for (const mt of memberTags) {
    const slug = mt.tag?.slug;
    if (!slug) continue;
    ownedSlugs.add(slug);
    if (mt.source === "declared") declaredSlugs.push(slug);
    else if (mt.source === "derived" || mt.source === "activity_inferred")
      derivedSlugs.push(slug);
  }

  // Adjacent: union of adjacency_slugs across member's tags minus owned
  const adjacentSet = new Set<string>();
  for (const mt of memberTags) {
    for (const adj of mt.tag?.adjacency_slugs ?? []) {
      if (!ownedSlugs.has(adj)) adjacentSet.add(adj);
    }
  }
  const adjacentSlugs = [...adjacentSet].slice(0, 5);

  const slugToName = (slug: string) =>
    tagBySlug.get(slug)?.name_en ?? slug.replace(/-/g, " ");

  const declaredNames = declaredSlugs.map(slugToName);
  const derivedNames = derivedSlugs.map(slugToName);
  const adjacentNames = adjacentSlugs.map(slugToName);

  // Matched items — fetch full item + host org
  const itemMatches = (itemsMatchRes.data ?? []) as ItemMatch[];
  const itemIds = itemMatches.map((m) => m.item_id);
  let matchedCards: MatchedFeedCard[] = [];
  if (itemIds.length > 0) {
    const { data: itemRows } = await supabase
      .from("items")
      .select("*, host:organisations!items_host_org_id_fkey(*)")
      .in("id", itemIds);
    type ItemJoined = Item & { host: Organisation | null };
    const rows = (itemRows ?? []) as ItemJoined[];
    const byId = new Map(rows.map((r) => [r.id, r]));

    // Gather all co_host and endorsed org ids to fetch in one go
    const extraOrgIds = new Set<string>();
    for (const r of rows) {
      for (const id of r.co_host_org_ids ?? []) extraOrgIds.add(id);
      for (const id of r.endorsed_org_ids ?? []) extraOrgIds.add(id);
    }
    const extraOrgs = new Map<string, Organisation>();
    if (extraOrgIds.size > 0) {
      const { data: orgRows } = await supabase
        .from("organisations")
        .select("*")
        .in("id", [...extraOrgIds]);
      for (const o of (orgRows ?? []) as Organisation[]) extraOrgs.set(o.id, o);
    }

    matchedCards = itemMatches
      .map((m): MatchedFeedCard | null => {
        const row = byId.get(m.item_id);
        if (!row || !row.host) return null;
        return {
          item: row,
          host: orgToChip(row.host),
          co_hosts: (row.co_host_org_ids ?? [])
            .map((id) => extraOrgs.get(id))
            .filter((o): o is Organisation => !!o)
            .map(orgToChip),
          endorsed: (row.endorsed_org_ids ?? [])
            .map((id) => extraOrgs.get(id))
            .filter((o): o is Organisation => !!o)
            .map(orgToChip),
          why_you: m.why_you,
        };
      })
      .filter((c): c is MatchedFeedCard => !!c);
  }

  // Matched lessons
  const lessonMatches = (lessonsMatchRes.data ?? []) as LessonMatch[];
  const lessonIds = lessonMatches.map((l) => l.lesson_id);
  let labLessons: SkillsLabLesson[] = [];
  if (lessonIds.length > 0) {
    const { data: lessonRows } = await supabase
      .from("lessons")
      .select("*, host:organisations!lessons_host_org_id_fkey(*)")
      .in("id", lessonIds);
    type LessonJoined = Lesson & { host: Organisation | null };
    const rows = (lessonRows ?? []) as LessonJoined[];
    const byId = new Map(rows.map((r) => [r.id, r]));
    labLessons = lessonMatches
      .map((m): SkillsLabLesson | null => {
        const row = byId.get(m.lesson_id);
        if (!row || !row.host) return null;
        return {
          id: row.id,
          slug: row.slug,
          title: row.title,
          hook: row.hook ?? "",
          length_min: row.length_min,
          format: row.format,
          tags: row.tags ?? [],
          host: orgToChip(row.host),
          why_this: m.why_this,
        };
      })
      .filter((l): l is SkillsLabLesson => !!l);
  }

  const milestones = (milestonesRes.data ?? []) as Milestone[];

  const growth = (growthRes.data ?? []) as GrowthSnapshot[];
  const before = growth.find((g) => g.kind === "then");
  const now = growth.find((g) => g.kind === "now");

  const skills = (skillsRes.data ?? []) as MemberSkill[];

  type ActivityJoined = Activity & { host: Organisation | null };
  const activityRows = (activitiesRes.data ?? []) as ActivityJoined[];
  const activities: ActivityRow[] = activityRows
    .filter((a) => a.host)
    .map((a) => ({
      id: a.id,
      what: a.title ?? a.description ?? a.kind,
      host: orgToChip(a.host as Organisation),
      xp: a.xp_awarded,
      kind_group: a.kind_group,
      created_at: a.created_at,
    }));

  type PublicMemberRow = {
    id: string;
    handle: string | null;
    name: string | null;
    country: string | null;
    city: string | null;
    primary_org_id: string | null;
    org: Organisation | null;
  };
  const peopleRows = ((peopleRes as { data: unknown }).data ??
    []) as PublicMemberRow[];
  const people: PeopleCard[] = peopleRows.map((p) => ({
    name: p.name ?? p.handle ?? "Someone",
    city: p.city,
    country: p.country,
    handle: p.handle,
    org: p.org ? orgToChip(p.org) : null,
    matching_tags: [],
  }));

  const firstName = (me.name ?? me.handle ?? "you").split(" ")[0];
  const joinedLabel = joinedFmt.format(new Date(me.joined_at));

  return (
    <div className="px-6 md:px-10 py-10 max-w-[1280px] mx-auto">
      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-8">
          <Label>§ 01 · Your map · joined {joinedLabel}</Label>
          <h1
            className="mt-3 font-display text-5xl md:text-7xl leading-[0.95]"
            style={{ color: C.ink }}
          >
            Hello, <em style={{ color: C.coral }}>{firstName}</em>.
          </h1>
          <p
            className="mt-5 text-base md:text-lg max-w-xl leading-relaxed"
            style={{ color: C.inkSoft }}
          >
            Your map is built from what you love + what you&apos;ve done.
            Below: short lessons matched to it, milestones in your own words,
            and a glance back at how far you&apos;ve come.
          </p>
        </div>
        {me.description_freetext && me.description_freetext.trim().length > 0 && (
          <div className="md:col-span-4">
            <Label>in your own words</Label>
            <blockquote
              className="mt-2 font-display italic leading-relaxed p-4"
              style={{
                color: C.ink,
                background: C.paperAlt,
                border: `1.5px solid ${C.ink}`,
                fontSize: "15px",
              }}
            >
              &ldquo;{me.description_freetext}&rdquo;
            </blockquote>
          </div>
        )}
      </div>

      {/* Interest map */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <Label>
            your map · {declaredNames.length} picked ·{" "}
            {derivedNames.length} found in your words
          </Label>
          <span
            className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
            style={{ color: C.green }}
          >
            + Add more interests
          </span>
        </div>
        <div
          className="p-4 md:p-8"
          style={{ background: C.paperAlt, border: `2px solid ${C.ink}` }}
        >
          <InterestMap
            declared={declaredNames}
            derived={derivedNames}
            adjacent={adjacentNames}
            memberFirstName={firstName}
          />
        </div>
      </div>

      <SkillsLab lessons={labLessons} />
      <MilestonesPanel initial={milestones} />
      <GrowthGlance
        before={before ? { as_of: before.as_of, lines: before.lines } : null}
        now={now ? { as_of: now.as_of, lines: now.lines } : null}
      />
      <SkillsBars skills={skills} />
      <MatchedFeed items={matchedCards} />
      <PeoplePanel people={people} />
      <ActivityTrail activities={activities} />
    </div>
  );
}
