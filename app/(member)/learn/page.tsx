import { redirect } from "next/navigation";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { getSupabaseServer } from "@/lib/supabase/server";
import { LibraryBrowse, type LessonRow } from "@/components/learning/LibraryBrowse";
import {
  CurriculaGrid,
  type CurriculumRow,
} from "@/components/learning/CurriculaGrid";
import { SkillsGraphFull } from "@/components/learning/SkillsGraphFull";
import type { Lesson, MemberSkill, Organisation } from "@/lib/supabase/types";

type LessonWithHost = Lesson & { host: Organisation | null };

type CurriculumLessonRow = {
  curriculum_id: string;
  position: number;
  lesson: Lesson | null;
};

type CurriculumDb = {
  id: string;
  slug: string;
  title: string;
  blurb: string | null;
  tags: string[];
  co_author_org_ids: string[];
};

// Phase 2.5: /learn — the full library. Browse lessons, follow curricula,
// inspect your own skills graph. All read-only; authoring happens in /admin.
export default async function LearnPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const [
    lessonsRes,
    compsRes,
    curriculaRes,
    curLessonsRes,
    skillsRes,
    orgsRes,
    memberTagsRes,
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select("*, host:organisations(*)")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase
      .from("lesson_completions")
      .select("lesson_id")
      .eq("member_id", user.id),
    supabase
      .from("curricula")
      .select("id, slug, title, blurb, tags, co_author_org_ids")
      .order("created_at"),
    supabase
      .from("curriculum_lessons")
      .select("curriculum_id, position, lesson:lessons(*)")
      .order("position"),
    supabase
      .from("member_skills")
      .select("*")
      .eq("member_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase.from("organisations").select("*"),
    supabase
      .from("member_tags")
      .select("tag:interest_tags(slug)")
      .eq("member_id", user.id),
  ]);

  // Welcome lesson is always first. After that, prioritise lessons whose tags
  // overlap with the member's interests. Everything else follows.
  const memberTagSlugs = new Set(
    ((memberTagsRes.data as { tag: { slug: string } | null }[] | null) ?? [])
      .map((r) => r.tag?.slug)
      .filter((s): s is string => !!s),
  );

  const lessonsRaw = ((lessonsRes.data as LessonWithHost[] | null) ?? []).map(
    (l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      length_min: l.length_min,
      format: l.format,
      tags: l.tags,
      host: l.host,
    } as LessonRow),
  );

  // Three-tier sort: welcome-to-fign first, then lessons matching member
  // interests, then everything else. Within each tier we keep the original
  // newest-first order.
  const WELCOME_SLUG = "welcome-to-fign";
  const rank = (l: LessonRow) => {
    if (l.slug === WELCOME_SLUG) return 0;
    if (memberTagSlugs.size && l.tags.some((t) => memberTagSlugs.has(t))) return 1;
    return 2;
  };
  const lessons = lessonsRaw
    .map((l, i) => ({ l, i }))
    .sort((a, b) => {
      const r = rank(a.l) - rank(b.l);
      return r !== 0 ? r : a.i - b.i;
    })
    .map(({ l }) => l);
  const completedIds = new Set(
    ((compsRes.data as { lesson_id: string }[] | null) ?? []).map(
      (r) => r.lesson_id,
    ),
  );
  const allOrgs = (orgsRes.data as Organisation[] | null) ?? [];
  const orgById = new Map(allOrgs.map((o) => [o.id, o]));

  // Hosts that actually appear on at least one lesson — keep the filter row tight.
  const hostIdsInUse = Array.from(
    new Set(lessons.map((l) => l.host?.id).filter((x): x is string => !!x)),
  );
  const hosts = hostIdsInUse
    .map((id) => orgById.get(id))
    .filter((o): o is Organisation => !!o)
    .sort((a, b) => a.name.localeCompare(b.name));

  const tags = Array.from(
    new Set(lessons.flatMap((l) => l.tags)),
  ).sort();
  const formats = Array.from(new Set(lessons.map((l) => l.format))).sort();

  // Curricula + their ordered lessons
  const curriculaDb =
    (curriculaRes.data as CurriculumDb[] | null) ?? [];
  const curLessonLinks =
    (curLessonsRes.data as unknown as CurriculumLessonRow[] | null) ?? [];

  const curricula: CurriculumRow[] = curriculaDb.map((c) => {
    const ownLessons = curLessonLinks
      .filter((cl) => cl.curriculum_id === c.id)
      .sort((a, b) => a.position - b.position)
      .map((cl) => cl.lesson)
      .filter((l): l is Lesson => !!l)
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        length_min: l.length_min,
        done: completedIds.has(l.id),
      }));

    const coAuthors = (c.co_author_org_ids ?? [])
      .map((id) => orgById.get(id))
      .filter((o): o is Organisation => !!o);

    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      blurb: c.blurb,
      tags: c.tags ?? [],
      coAuthors,
      lessons: ownLessons,
    };
  });

  // Mirrors the lesson sort: onboarding path first (unless already finished),
  // then paths whose tags overlap member interests, then everything else.
  const ONBOARDING_PATH_SLUG = "onboarding-new-fign-member";
  const pathRank = (c: CurriculumRow) => {
    const allDone = c.lessons.length > 0 && c.lessons.every((l) => l.done);
    if (c.slug === ONBOARDING_PATH_SLUG && !allDone) return 0;
    if (memberTagSlugs.size && c.tags.some((t) => memberTagSlugs.has(t)))
      return 1;
    return 2;
  };
  const sortedCurricula = curricula
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const r = pathRank(a.c) - pathRank(b.c);
      return r !== 0 ? r : a.i - b.i;
    })
    .map(({ c }) => c);

  const skills = (skillsRes.data as MemberSkill[] | null) ?? [];

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-7xl mx-auto">
      {/* Hero */}
      <Label color={C.coral}>§ 01 · Skills Lab</Label>
      <h1
        className="mt-3 font-display text-5xl md:text-7xl leading-[0.95]"
        style={{ color: C.ink }}
      >
        The <em style={{ color: C.coral }}>library</em>.
      </h1>
      <p
        className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed"
        style={{ color: C.inkSoft }}
      >
        A growing collection of short lessons from FIGN, member orgs, partners,
        and the open web. Browse freely, or follow a curriculum. Every finished
        lesson gives you tailored options — you choose what to do with them.
      </p>

      {/* Library stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
        {[
          [String(lessons.length), "lessons live"],
          [String(hosts.length), "sources"],
          [String(curricula.length), "curricula"],
          [String(completedIds.size), "you've finished"],
        ].map(([n, l]) => (
          <div
            key={l}
            className="p-4"
            style={{ background: C.ink, color: C.paper }}
          >
            <div
              className="font-display text-3xl italic leading-none"
              style={{ color: C.coral }}
            >
              {n}
            </div>
            <div
              className="mt-2 font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
              style={{ opacity: 0.9 }}
            >
              {l}
            </div>
          </div>
        ))}
      </div>

      <CurriculaGrid curricula={sortedCurricula} />
      <LibraryBrowse
        lessons={lessons}
        hosts={hosts}
        tags={tags}
        formats={formats}
        completedIds={completedIds}
        totalHosts={hosts.length}
      />
      <SkillsGraphFull skills={skills} />
    </div>
  );
}
