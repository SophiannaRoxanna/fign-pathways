import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import type { Organisation } from "@/lib/supabase/types";

type CurriculumLesson = {
  id: string;
  slug: string;
  title: string;
  length_min: number;
  done: boolean;
};

export type CurriculumRow = {
  id: string;
  slug: string;
  title: string;
  blurb: string | null;
  tags: string[];
  coAuthors: Organisation[];
  lessons: CurriculumLesson[];
};

type Props = { curricula: CurriculumRow[] };

// Curricula live above the full library — a path you can start is more useful
// than a thousand lessons you can browse. Every link carries ?path=<slug> so
// the lesson reader knows you're inside a series and can show "next up".
export function CurriculaGrid({ curricula }: Props) {
  return (
    <section className="mt-20">
      <SectionHead
        num="02"
        kicker="Paths · begin a group"
        sub="Start anywhere. Each path is a short, ordered series co-authored with FIGN member orgs and partners. Begin one and the reader shows you what comes next."
      >
        Pick a <em style={{ color: C.coral }}>path</em> and follow it
      </SectionHead>

      {curricula.length === 0 ? (
        <div
          className="p-8 text-center"
          style={{ border: `1.5px dashed ${C.ink}55`, color: C.inkSoft }}
        >
          <p className="font-display italic text-lg">
            Paths will appear here as FIGN and member orgs co-author them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {curricula.map((c, idx) => {
            const doneCount = c.lessons.filter((l) => l.done).length;
            const total = c.lessons.length;
            const totalMin = c.lessons.reduce((s, l) => s + l.length_min, 0);
            const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
            const nextLesson = c.lessons.find((l) => !l.done) ?? c.lessons[0];
            const withPath = (slug: string) =>
              `/lessons/${slug}?path=${encodeURIComponent(c.slug)}`;
            const stripColor = c.coAuthors[0]?.brand_color || C.purple;

            return (
              <article
                key={c.id}
                className="flex flex-col relative"
                style={{
                  background: C.paperAlt,
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                {/* Top band — host-colored, holds path number + coauthors */}
                <div
                  className="px-5 py-2.5 flex items-center justify-between gap-3 flex-wrap"
                  style={{ background: stripColor, color: C.paper }}
                >
                  <span className="font-mono text-[10px] tracking-[0.22em] uppercase font-bold">
                    Path · {String(idx + 1).padStart(2, "0")}
                  </span>
                  {c.coAuthors.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-mono text-[9px] tracking-[0.18em] uppercase"
                        style={{ opacity: 0.85 }}
                      >
                        with
                      </span>
                      {c.coAuthors.slice(0, 3).map((o) => (
                        <span
                          key={o.id}
                          className="font-mono text-[10px] tracking-[0.14em] uppercase font-bold px-2 py-0.5"
                          style={{
                            background: C.paper,
                            color: C.ink,
                          }}
                        >
                          {o.short_name || o.name}
                        </span>
                      ))}
                      {c.coAuthors.length > 3 && (
                        <span
                          className="font-mono text-[9px] tracking-[0.18em]"
                          style={{ opacity: 0.85 }}
                        >
                          +{c.coAuthors.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col flex-1">
                  <h3
                    className="font-display text-2xl md:text-3xl italic leading-[1.1]"
                    style={{ color: C.ink }}
                  >
                    {c.title}
                  </h3>
                  {c.blurb && (
                    <p
                      className="mt-2 text-[15px] leading-relaxed"
                      style={{ color: C.inkSoft, maxWidth: "55ch" }}
                    >
                      {c.blurb}
                    </p>
                  )}

                  {/* At-a-glance stats */}
                  <div className="mt-5 flex items-baseline gap-6 flex-wrap">
                    <Stat value={String(total)} label="lessons" />
                    <Stat value={`${totalMin}m`} label="total time" />
                    <Stat
                      value={`${pct}%`}
                      label={doneCount > 0 ? "done" : "to start"}
                      accent={doneCount > 0}
                    />
                  </div>

                  {/* Progress bar */}
                  <div
                    className="mt-3 h-1.5 relative"
                    style={{
                      background: C.paper,
                      border: `1px solid ${C.ink}22`,
                    }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 transition-all"
                      style={{ width: `${pct}%`, background: C.coral }}
                    />
                  </div>

                  {/* Lesson list — compact TOC */}
                  <ol className="mt-5 space-y-1.5">
                    {c.lessons.map((l, i) => (
                      <li
                        key={l.id}
                        className="flex items-baseline gap-3 text-[14px]"
                      >
                        <span
                          className="font-mono text-[10px] shrink-0 w-6"
                          style={{ color: C.inkMute }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Link
                          href={withPath(l.slug)}
                          className={`flex-1 leading-snug transition-colors hover:underline underline-offset-2 ${l.done ? "line-through opacity-55" : ""}`}
                          style={{ color: C.ink }}
                        >
                          {l.title}
                        </Link>
                        <span
                          className="font-mono text-[10px] shrink-0 tabular-nums"
                          style={{ color: C.inkMute }}
                        >
                          {l.length_min}m
                        </span>
                      </li>
                    ))}
                  </ol>

                  {/* CTA — names the next lesson so the click is never blind */}
                  {nextLesson && (
                    <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${C.ink}22` }}>
                      <Label color={C.inkMute}>
                        {doneCount > 0 ? "next up" : "start with"}
                      </Label>
                      <Link
                        href={withPath(nextLesson.slug)}
                        className="mt-2 flex items-center justify-between gap-4 p-3 transition-colors group"
                        style={{
                          background: C.ink,
                          color: C.paper,
                        }}
                      >
                        <span className="font-display italic text-base md:text-lg leading-tight">
                          {nextLesson.title}
                        </span>
                        <span
                          className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold shrink-0 transition-transform group-hover:translate-x-0.5"
                          style={{ color: C.coral }}
                        >
                          {doneCount > 0 ? "continue →" : "begin →"}
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Stat({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span
        className="font-display italic text-2xl leading-none tabular-nums"
        style={{ color: accent ? C.coral : C.ink }}
      >
        {value}
      </span>
      <span
        className="mt-1 font-mono text-[9px] tracking-[0.22em] uppercase font-bold"
        style={{ color: C.inkMute }}
      >
        {label}
      </span>
    </div>
  );
}
