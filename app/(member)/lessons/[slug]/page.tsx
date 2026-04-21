import { notFound } from "next/navigation";
import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { OrgChip } from "@/components/org/OrgChip";
import { getSupabaseServer } from "@/lib/supabase/server";
import { DOOR_COPY, type DoorCopy, type DoorId } from "@/lib/copy/doorOptions";
import type { Organisation } from "@/lib/supabase/types";
import { LessonFinisher } from "./LessonFinisher";

const dateFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

type LessonRow = {
  id: string;
  slug: string;
  title: string;
  host_org_id: string;
  length_min: number;
  format: string;
  tags: string[];
  hook: string | null;
  body: string | null;
  content_url: string | null;
  host: Organisation | null;
};

type PathLesson = {
  slug: string;
  title: string;
  length_min: number;
  done: boolean;
};

type PathContext = {
  slug: string;
  title: string;
  lessons: PathLesson[];
  index: number; // zero-based position of the current lesson
  prev: PathLesson | null;
  next: PathLesson | null;
};

function isVideoUrl(url: string): boolean {
  return /(youtube\.com|youtu\.be|vimeo\.com|loom\.com)/i.test(url);
}

function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

export default async function LessonReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { slug } = await params;
  const { path: pathSlug } = await searchParams;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*, host:organisations(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (!lesson) notFound();

  const typedLesson = lesson as LessonRow;
  const host = typedLesson.host;

  const { data: existing } = await supabase
    .from("lesson_completions")
    .select("id, completed_at")
    .eq("member_id", user.id)
    .eq("lesson_id", typedLesson.id)
    .maybeSingle();

  // If we arrived inside a path, hydrate the whole series so we can show
  // position, prev/next, and a curriculum-aware footer CTA.
  let pathCtx: PathContext | null = null;
  if (pathSlug) {
    const { data: curriculumRow } = await supabase
      .from("curricula")
      .select("id, slug, title")
      .eq("slug", pathSlug)
      .maybeSingle();
    if (curriculumRow) {
      const { data: links } = await supabase
        .from("curriculum_lessons")
        .select("position, lesson:lessons(id, slug, title, length_min)")
        .eq("curriculum_id", curriculumRow.id)
        .order("position");
      const ordered = ((links as unknown as {
        position: number;
        lesson: {
          id: string;
          slug: string;
          title: string;
          length_min: number;
        } | null;
      }[] | null) ?? [])
        .map((l) => l.lesson)
        .filter((l): l is NonNullable<typeof l> => !!l);

      const lessonIds = ordered.map((l) => l.id);
      const { data: comps } = await supabase
        .from("lesson_completions")
        .select("lesson_id")
        .eq("member_id", user.id)
        .in("lesson_id", lessonIds);
      const doneSet = new Set(
        ((comps as { lesson_id: string }[] | null) ?? []).map((c) => c.lesson_id),
      );

      const pathLessons: PathLesson[] = ordered.map((l) => ({
        slug: l.slug,
        title: l.title,
        length_min: l.length_min,
        done: doneSet.has(l.id),
      }));
      const index = pathLessons.findIndex((l) => l.slug === typedLesson.slug);
      if (index >= 0) {
        pathCtx = {
          slug: curriculumRow.slug,
          title: curriculumRow.title,
          lessons: pathLessons,
          index,
          prev: index > 0 ? pathLessons[index - 1] : null,
          next:
            index < pathLessons.length - 1 ? pathLessons[index + 1] : null,
        };
      }
    }
  }

  // Build tailored doors
  const doorIds: DoorId[] = ["reflect", "bring_someone", "bookmark"];
  const doorOverrides: Partial<Record<DoorId, { title: string; payload?: Record<string, unknown> }>> = {};

  const makeFormats = ["video_plus_script", "audio_plus_drill", "interactive"];
  if (makeFormats.includes(typedLesson.format)) {
    doorIds.unshift("make_something");
  }

  const { data: curriculumRows } = await supabase
    .from("curriculum_lessons")
    .select("curriculum:curricula(slug, title)")
    .eq("lesson_id", typedLesson.id)
    .limit(1);
  const curriculum = (curriculumRows?.[0] as
    | { curriculum: { slug: string; title: string } | null }
    | undefined)?.curriculum;
  if (curriculum) {
    doorIds.push("go_further");
    doorOverrides.go_further = {
      title: curriculum.title,
      payload: { curriculum_slug: curriculum.slug },
    };
  }

  if (typedLesson.tags.length > 0) {
    const { data: items } = await supabase
      .from("items")
      .select("id, title, registration_url, registration_preference")
      .overlaps("tags", typedLesson.tags)
      .or("registration_preference.eq.fign_hosted,registration_url.not.is.null")
      .limit(1);
    if (items && items.length > 0) {
      doorIds.push("take_it_live");
      doorOverrides.take_it_live = {
        title: items[0].title,
        payload: { item_id: items[0].id },
      };
    }
  }

  const orderedIds: DoorId[] = [
    "make_something",
    "reflect",
    "go_further",
    "take_it_live",
    "bring_someone",
    "bookmark",
  ].filter((id): id is DoorId => doorIds.includes(id as DoorId));

  const options: DoorCopy[] = orderedIds.map((id) => {
    const base = DOOR_COPY[id];
    const override = doorOverrides[id];
    return {
      id,
      kind: base.kind,
      why: base.why,
      commitment: base.commitment,
      color: base.color,
      title: override?.title ?? base.titleFallback,
    };
  });

  const pickPayloads: Partial<Record<DoorId, Record<string, unknown>>> = {};
  orderedIds.forEach((id) => {
    const p = doorOverrides[id]?.payload;
    if (p) pickPayloads[id] = p;
  });

  const hostBg = host?.brand_color || C.ink;
  const paragraphs = (typedLesson.body ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const withPath = (targetSlug: string) =>
    pathCtx
      ? `/lessons/${targetSlug}?path=${encodeURIComponent(pathCtx.slug)}`
      : `/lessons/${targetSlug}`;

  return (
    <div style={{ background: C.paper, minHeight: "100vh" }}>
      {/* Path bar — only when arriving inside a curriculum. Sits above host bar
          so the reader sees: "you are in a path" before "who hosts this". */}
      {pathCtx && (
        <div
          className="px-6 md:px-10 py-3"
          style={{ background: C.ink, color: C.paper }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <span
                className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold shrink-0"
                style={{ color: C.coral }}
              >
                Path
              </span>
              <Link
                href={`/learn#path-${pathCtx.slug}`}
                className="font-display italic text-base md:text-lg leading-tight truncate hover:underline underline-offset-2"
                style={{ color: C.paper }}
              >
                {pathCtx.title}
              </Link>
              <span
                className="font-mono text-[10px] tracking-[0.2em] uppercase shrink-0"
                style={{ opacity: 0.7 }}
              >
                step {pathCtx.index + 1} of {pathCtx.lessons.length}
              </span>
            </div>

            {/* Step dots — a compact progress meter */}
            <div
              className="flex items-center gap-1.5 shrink-0"
              role="progressbar"
              aria-valuenow={pathCtx.index + 1}
              aria-valuemin={1}
              aria-valuemax={pathCtx.lessons.length}
              aria-label={`Step ${pathCtx.index + 1} of ${pathCtx.lessons.length} in ${pathCtx.title}`}
            >
              {pathCtx.lessons.map((l, i) => {
                const isCurrent = i === pathCtx!.index;
                const isDone = l.done;
                const bg = isCurrent
                  ? C.coral
                  : isDone
                    ? C.paper
                    : "transparent";
                const border = isCurrent
                  ? C.coral
                  : isDone
                    ? C.paper
                    : `${C.paper}66`;
                return (
                  <Link
                    key={l.slug}
                    href={withPath(l.slug)}
                    title={`${i + 1}. ${l.title}`}
                    aria-label={`Step ${i + 1}: ${l.title}`}
                    className="w-2.5 h-2.5 transition-transform hover:scale-125"
                    style={{
                      background: bg,
                      border: `1.5px solid ${border}`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {host && (
        <div
          className="px-6 md:px-10 py-3 flex items-center gap-3 flex-wrap"
          style={{ background: hostBg, color: C.paper }}
        >
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase font-semibold">
            Hosted by
          </span>
          <Link
            href={`/orgs/${host.slug}`}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold"
            style={{ color: C.paper }}
          >
            {host.name}
          </Link>
          <span className="opacity-40">·</span>
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-80">
            {host.type}
          </span>
        </div>
      )}

      <article className="max-w-3xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <Label>§ lesson · {typedLesson.format.replace(/_/g, " ")}</Label>
        <h1
          className="mt-3 font-display italic text-4xl md:text-5xl leading-[1.05]"
          style={{ color: C.ink }}
        >
          {typedLesson.title}
        </h1>
        {typedLesson.hook && (
          <p
            className="mt-4 font-display italic text-xl md:text-2xl leading-snug"
            style={{ color: C.inkSoft, maxWidth: "34ch" }}
          >
            {typedLesson.hook}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {host && (
            <OrgChip
              org={{
                id: host.id,
                slug: host.slug,
                name: host.name,
                short_name: host.short_name,
                type: host.type,
                brand_color: host.brand_color,
              }}
            />
          )}
          <span
            className="font-mono text-[11px] tracking-[0.18em] uppercase"
            style={{ color: C.inkMute }}
          >
            {typedLesson.length_min} min
          </span>
          <span style={{ color: C.inkMute, opacity: 0.5 }}>·</span>
          <span
            className="font-mono text-[11px] tracking-[0.18em] uppercase"
            style={{ color: C.inkMute }}
          >
            {typedLesson.format.replace(/_/g, " ")}
          </span>
          {typedLesson.tags.map((t) => (
            <span
              key={t}
              className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-0.5"
              style={{ color: C.ink, border: `1px solid ${C.ink}55` }}
            >
              {t}
            </span>
          ))}
        </div>

        <div
          className="my-8 h-px w-full"
          style={{ background: C.ink, opacity: 0.15 }}
        />

        {typedLesson.content_url && isVideoUrl(typedLesson.content_url) && (
          <div
            className="mb-8 aspect-video w-full"
            style={{ border: `1.5px solid ${C.ink}` }}
          >
            <iframe
              src={toEmbedUrl(typedLesson.content_url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={typedLesson.title}
            />
          </div>
        )}

        {typedLesson.content_url && !isVideoUrl(typedLesson.content_url) && (
          <a
            href={typedLesson.content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-8 font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
            style={{ background: C.ink, color: C.paper }}
          >
            Open content in a new tab →
          </a>
        )}

        <div className="space-y-5">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-[16.5px] leading-[1.75]"
              style={{ color: C.inkSoft, maxWidth: "68ch" }}
            >
              {p}
            </p>
          ))}
        </div>

        {/* In-path prev/next — a larger, more navigable block than the footer.
            Only shows when we know the path. */}
        {pathCtx && (pathCtx.prev || pathCtx.next) && (
          <nav
            aria-label="Path navigation"
            className="mt-14 pt-8 grid grid-cols-1 md:grid-cols-2 gap-3"
            style={{ borderTop: `1.5px solid ${C.ink}` }}
          >
            {pathCtx.prev ? (
              <Link
                href={withPath(pathCtx.prev.slug)}
                className="p-5 flex flex-col gap-1.5 transition-colors"
                style={{
                  background: C.paper,
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                <span
                  className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold"
                  style={{ color: C.inkMute }}
                >
                  ← previous in path
                </span>
                <span
                  className="font-display italic text-lg leading-snug"
                  style={{ color: C.ink }}
                >
                  {pathCtx.prev.title}
                </span>
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ color: C.inkMute }}
                >
                  {pathCtx.prev.length_min} min
                  {pathCtx.prev.done ? " · done" : ""}
                </span>
              </Link>
            ) : (
              <span />
            )}

            {pathCtx.next ? (
              <Link
                href={withPath(pathCtx.next.slug)}
                className="p-5 flex flex-col gap-1.5 md:text-right transition-colors"
                style={{
                  background: C.ink,
                  color: C.paper,
                }}
              >
                <span
                  className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold"
                  style={{ color: C.coral }}
                >
                  next in path →
                </span>
                <span className="font-display italic text-lg leading-snug">
                  {pathCtx.next.title}
                </span>
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ opacity: 0.7 }}
                >
                  {pathCtx.next.length_min} min
                  {pathCtx.next.done ? " · done" : ""}
                </span>
              </Link>
            ) : (
              <div
                className="p-5 flex flex-col gap-1.5 md:text-right"
                style={{
                  background: C.paperAlt,
                  border: `1.5px solid ${C.ink}`,
                  color: C.ink,
                }}
              >
                <span
                  className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold"
                  style={{ color: C.coral }}
                >
                  end of path
                </span>
                <span className="font-display italic text-lg leading-snug">
                  You finished {pathCtx.title}.
                </span>
                <Link
                  href="/learn"
                  className="font-mono text-[10px] tracking-wider underline underline-offset-2"
                  style={{ color: C.inkMute }}
                >
                  back to library
                </Link>
              </div>
            )}
          </nav>
        )}
      </article>

      <div
        className="sticky bottom-0 px-6 md:px-10 py-4"
        style={{
          background: C.paperDk,
          borderTop: `1.5px solid ${C.ink}`,
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Label>§ your turn</Label>
            {existing && (
              <span
                className="text-sm italic truncate"
                style={{ color: C.inkSoft }}
              >
                You finished this on{" "}
                {dateFmt.format(new Date(existing.completed_at))}.
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {!existing && (
              <LessonFinisher
                lessonId={typedLesson.id}
                lessonTitle={typedLesson.title}
                hostName={host?.name ?? "FIGN"}
                options={options}
                pickPayloads={pickPayloads}
              />
            )}
            {pathCtx?.next && (
              <Link
                href={withPath(pathCtx.next.slug)}
                className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-4 py-2.5 transition-colors"
                style={{
                  background: C.coral,
                  color: C.paper,
                }}
              >
                Next in path →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
