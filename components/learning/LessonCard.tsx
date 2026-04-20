import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { OrgChip } from "@/components/org/OrgChip";
import type { Lesson, Organisation } from "@/lib/supabase/types";

type Props = {
  lesson: Pick<Lesson, "id" | "slug" | "title" | "length_min" | "format" | "tags"> & {
    host: Organisation | null;
  };
  done?: boolean;
};

// Lesson tile used on /learn. Host chip + length/format kicker, serif italic
// title, interest-tag chip row, "done" ribbon when completed.
export function LessonCard({ lesson, done }: Props) {
  return (
    <div
      className="p-5 relative transition-transform hover:-translate-y-0.5"
      style={{
        background: done ? C.paperAlt : C.paper,
        border: `1.5px solid ${C.ink}`,
      }}
    >
      {done && (
        <div
          className="absolute -top-2 right-4 px-2 py-0.5 font-mono text-[9px] tracking-[0.18em] uppercase font-bold"
          style={{ background: C.green, color: C.paper }}
        >
          done
        </div>
      )}

      <div className="flex items-center justify-between mb-3 gap-2">
        {lesson.host ? (
          <OrgChip
            org={{
              id: lesson.host.id,
              name: lesson.host.name,
              short_name: lesson.host.short_name,
              type: lesson.host.type,
              brand_color: lesson.host.brand_color,
            }}
          />
        ) : (
          <span />
        )}
        <span
          className="font-mono text-[10px] tracking-wider"
          style={{ color: C.inkMute }}
        >
          {lesson.length_min} min · {lesson.format.replace(/_/g, " ")}
        </span>
      </div>

      <h3
        className="font-display text-lg italic leading-snug"
        style={{ color: C.ink }}
      >
        {lesson.title}
      </h3>

      {lesson.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {lesson.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="font-mono text-[10px] tracking-wider px-2 py-0.5"
              style={{ color: C.ink, border: `1px solid ${C.ink}44` }}
            >
              {t.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Link
          href={`/lessons/${lesson.slug}`}
          className="inline-block font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: done ? "transparent" : C.ink,
            color: done ? C.ink : C.paper,
            border: done ? `1.5px solid ${C.ink}` : "none",
            outlineColor: C.coral,
          }}
        >
          {done ? "Review" : "Start →"}
        </Link>
      </div>
    </div>
  );
}
