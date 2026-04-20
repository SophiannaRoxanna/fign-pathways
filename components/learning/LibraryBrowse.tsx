"use client";

import { useMemo, useState } from "react";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { LessonCard } from "./LessonCard";
import type { Lesson, Organisation } from "@/lib/supabase/types";

export type LessonRow = Pick<
  Lesson,
  "id" | "slug" | "title" | "length_min" | "format" | "tags"
> & { host: Organisation | null };

type HostOption = Pick<Organisation, "id" | "name" | "short_name" | "type" | "brand_color">;

type Props = {
  lessons: LessonRow[];
  hosts: HostOption[];
  tags: string[];   // interest tag slugs used across lessons, pre-sorted
  formats: string[]; // distinct format strings
  completedIds: Set<string>;
  totalHosts: number;
};

export function LibraryBrowse({
  lessons,
  hosts,
  tags,
  formats,
  completedIds,
  totalHosts,
}: Props) {
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [hostFilter, setHostFilter] = useState<string | null>(null); // host org id
  const [formatFilter, setFormatFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      if (tagFilter && !l.tags.includes(tagFilter)) return false;
      if (hostFilter && l.host?.id !== hostFilter) return false;
      if (formatFilter && l.format !== formatFilter) return false;
      return true;
    });
  }, [lessons, tagFilter, hostFilter, formatFilter]);

  const hasFilter = tagFilter || hostFilter || formatFilter;
  const clearAll = () => {
    setTagFilter(null);
    setHostFilter(null);
    setFormatFilter(null);
  };

  return (
    <section className="mt-10">
      <SectionHead
        num="02"
        kicker="Browse · the full library"
        sub={`${lessons.length} lessons · ${totalHosts} sources · filter by interest, host, or format.`}
      >
        Learn something <em style={{ color: C.coral }}>intentional</em>
      </SectionHead>

      <div className="mb-6 space-y-3">
        <FilterRow label="interest">
          {tags.slice(0, 12).map((t) => (
            <Chip
              key={t}
              active={tagFilter === t}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
              activeBg={C.coral}
            >
              {t.replace(/-/g, " ")}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="host">
          {hosts.map((h) => (
            <Chip
              key={h.id}
              active={hostFilter === h.id}
              onClick={() => setHostFilter(hostFilter === h.id ? null : h.id)}
              activeBg={h.brand_color ?? C.ink}
            >
              {h.short_name ?? h.name}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="format">
          {formats.map((f) => (
            <Chip
              key={f}
              active={formatFilter === f}
              onClick={() => setFormatFilter(formatFilter === f ? null : f)}
              activeBg={C.ink}
            >
              {f.replace(/_/g, " ")}
            </Chip>
          ))}
          {hasFilter && (
            <button
              onClick={clearAll}
              className="font-mono text-[10px] tracking-wider uppercase font-bold px-2 py-1 ml-auto focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: C.coral, outlineColor: C.coral }}
            >
              clear filters ×
            </button>
          )}
        </FilterRow>
      </div>

      <div className="text-sm mb-4" style={{ color: C.inkSoft }}>
        Showing <strong>{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "lesson" : "lessons"}.
      </div>

      {filtered.length === 0 ? (
        <div
          className="p-8 text-center"
          style={{ border: `1.5px dashed ${C.ink}55`, color: C.inkSoft }}
        >
          <p className="font-display italic text-lg">
            No lessons match these filters. Try widening.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => (
            <LessonCard key={l.id} lesson={l} done={completedIds.has(l.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  activeBg,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  activeBg: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="font-mono text-[10px] tracking-wider uppercase font-semibold px-2 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: active ? activeBg : "transparent",
        color: active ? C.paper : C.ink,
        border: `1px solid ${active ? activeBg : C.ink + "44"}`,
        outlineColor: activeBg,
      }}
    >
      {children}
    </button>
  );
}
