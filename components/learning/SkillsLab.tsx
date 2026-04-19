"use client";

import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip, type OrgChipData } from "@/components/org/OrgChip";

export type SkillsLabLesson = {
  id: string;
  slug: string;
  title: string;
  hook: string;
  length_min: number;
  format: string;
  tags: string[];
  host: OrgChipData;
  why_this: string;
};

export function SkillsLab({ lessons }: { lessons: SkillsLabLesson[] }) {
  return (
    <section className="mt-20">
      <SectionHead
        num="02"
        kicker="Skills Lab · short, matched lessons"
        sub="Inline here; the full library lives on /learn. Every lesson is attributed to its creator — FIGN, partners, member orgs, open source."
      >
        Learn <em style={{ color: C.coral }}>something small</em> today
      </SectionHead>

      {lessons.length === 0 ? (
        <div
          className="p-6 text-sm italic"
          style={{
            background: C.paperAlt,
            border: `1.5px solid ${C.ink}`,
            color: C.inkSoft,
          }}
        >
          No lessons matched yet — add more interests to your map and they&apos;ll
          show up here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {lessons.map((l) => (
            <div
              key={l.id}
              className="p-5 relative flex flex-col"
              style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <OrgChip org={l.host} />
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ color: C.inkMute }}
                >
                  {l.length_min} min · {l.format}
                </span>
              </div>
              <h3
                className="font-display text-xl italic leading-tight"
                style={{ color: C.ink }}
              >
                {l.title}
              </h3>
              <div className="mt-2 text-sm" style={{ color: C.inkSoft }}>
                {l.hook}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {l.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[10px] tracking-wider px-2 py-0.5"
                    style={{ color: C.ink, border: `1px solid ${C.ink}44` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div
                className="mt-3 pt-3 text-xs italic"
                style={{
                  borderTop: `1px solid ${C.ink}22`,
                  color: C.inkSoft,
                }}
              >
                <span
                  style={{
                    color: C.green,
                    fontStyle: "normal",
                    fontWeight: 600,
                  }}
                >
                  Why this:{" "}
                </span>
                {l.why_this}
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/lessons/${l.slug}`}
                  className="font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2"
                  style={{ background: C.ink, color: C.paper }}
                >
                  Start →
                </Link>
                <button
                  type="button"
                  className="font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2"
                  style={{ color: C.ink, border: `1.5px solid ${C.ink}` }}
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <span
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          · 42 more lessons matched to your map
        </span>
        <span
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold"
          style={{ color: C.coral }}
        >
          Browse the full library · /learn →
        </span>
      </div>
    </section>
  );
}
