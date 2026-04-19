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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  let takeItLiveItem: { id: string; title: string } | null = null;
  if (typedLesson.tags.length > 0) {
    const { data: items } = await supabase
      .from("items")
      .select("id, title, registration_url, registration_preference")
      .overlaps("tags", typedLesson.tags)
      .or("registration_preference.eq.fign_hosted,registration_url.not.is.null")
      .limit(1);
    if (items && items.length > 0) {
      takeItLiveItem = { id: items[0].id, title: items[0].title };
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

  return (
    <div style={{ background: C.paper, minHeight: "100vh" }}>
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
          className="mt-3 font-serif italic text-4xl md:text-5xl leading-[1.05]"
          style={{ color: C.ink }}
        >
          {typedLesson.title}
        </h1>
        {typedLesson.hook && (
          <p
            className="mt-4 font-serif italic text-xl md:text-2xl leading-snug"
            style={{ color: C.inkSoft }}
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
              className="text-[16px] leading-[1.7]"
              style={{ color: C.inkSoft }}
            >
              {p}
            </p>
          ))}
        </div>
      </article>

      <div
        className="sticky bottom-0 px-6 md:px-10 py-4"
        style={{
          background: C.paperDk,
          borderTop: `1.5px solid ${C.ink}`,
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Label>§ your turn</Label>
            {existing && (
              <span
                className="text-sm italic"
                style={{ color: C.inkSoft }}
              >
                You finished this on{" "}
                {dateFmt.format(new Date(existing.completed_at))}.
              </span>
            )}
          </div>
          {!existing && (
            <LessonFinisher
              lessonId={typedLesson.id}
              lessonTitle={typedLesson.title}
              hostName={host?.name ?? "FIGN"}
              options={options}
              pickPayloads={pickPayloads}
            />
          )}
        </div>
      </div>
    </div>
  );
}
