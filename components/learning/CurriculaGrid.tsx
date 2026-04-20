import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip } from "@/components/org/OrgChip";
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

// Ordered paths, co-authored by member orgs + partners. Not a forced track
// — a thoughtfully ordered sequence, if sequences help you.
export function CurriculaGrid({ curricula }: Props) {
  return (
    <section className="mt-20">
      <SectionHead
        num="03"
        kicker="Curricula · ordered paths"
        sub="Co-authored with member orgs and partners. Not a forced track — a thoughtfully ordered sequence, if sequences help you."
      >
        A <em style={{ color: C.coral }}>shaped path</em>, if you want one
      </SectionHead>

      {curricula.length === 0 ? (
        <div
          className="p-8 text-center"
          style={{ border: `1.5px dashed ${C.ink}55`, color: C.inkSoft }}
        >
          <p className="font-display italic text-lg">
            Curricula will appear here as Sophia + member orgs co-author them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {curricula.map((c) => {
            const doneCount = c.lessons.filter((l) => l.done).length;
            const total = c.lessons.length;
            const totalMin = c.lessons.reduce((s, l) => s + l.length_min, 0);
            const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);
            const nextLesson = c.lessons.find((l) => !l.done) ?? c.lessons[0];

            return (
              <article
                key={c.id}
                className="p-6 flex flex-col"
                style={{
                  background: C.paperAlt,
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                {c.coAuthors.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2 mb-3">
                    <Label>co-authored with</Label>
                    {c.coAuthors.map((o) => (
                      <OrgChip
                        key={o.id}
                        org={{
                          id: o.id,
                          name: o.name,
                          short_name: o.short_name,
                          type: o.type,
                          brand_color: o.brand_color,
                        }}
                      />
                    ))}
                  </div>
                )}

                <h3
                  className="font-display text-2xl italic leading-tight"
                  style={{ color: C.ink }}
                >
                  {c.title}
                </h3>
                {c.blurb && (
                  <p className="mt-2 text-sm" style={{ color: C.inkSoft }}>
                    {c.blurb}
                  </p>
                )}

                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span
                      className="font-mono text-[10px] tracking-wider"
                      style={{ color: C.inkMute }}
                    >
                      {doneCount} of {total} done · {totalMin} min total
                    </span>
                    <span
                      className="font-mono text-[10px] tracking-wider font-bold"
                      style={{ color: C.coral }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div
                    className="h-2 relative"
                    style={{ background: C.paper, border: `1px solid ${C.ink}22` }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 transition-all"
                      style={{ width: `${pct}%`, background: C.coral }}
                    />
                  </div>
                </div>

                <ol className="mt-4 space-y-2">
                  {c.lessons.map((l, i) => (
                    <li
                      key={l.id}
                      className="flex items-baseline gap-3 text-sm"
                      style={{ color: C.ink }}
                    >
                      <span
                        className="font-mono text-[10px] shrink-0"
                        style={{ color: C.inkMute }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Link
                        href={`/lessons/${l.slug}`}
                        className={`flex-1 transition-colors hover:underline underline-offset-2 ${l.done ? "line-through opacity-60" : ""}`}
                        style={{ color: C.ink }}
                      >
                        {l.title}
                      </Link>
                      <span
                        className="font-mono text-[10px] shrink-0"
                        style={{ color: C.inkMute }}
                      >
                        {l.length_min}m
                      </span>
                      {l.done && (
                        <span
                          className="font-mono text-[9px] tracking-wider uppercase font-bold"
                          style={{ color: C.green }}
                        >
                          done
                        </span>
                      )}
                    </li>
                  ))}
                </ol>

                {nextLesson && (
                  <Link
                    href={`/lessons/${nextLesson.slug}`}
                    className="mt-5 inline-block self-start font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      background: C.ink,
                      color: C.paper,
                      outlineColor: C.coral,
                    }}
                  >
                    {doneCount > 0 ? "Continue →" : "Begin →"}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
