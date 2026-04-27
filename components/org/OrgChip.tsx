import { C } from "@/lib/design/tokens";
import { ORG_TYPE_COLOR } from "@/lib/design/tokens";

export type OrgChipData = {
  id?: string;
  slug?: string;
  name: string;
  short_name?: string | null;
  type: string;
  brand_color?: string | null;
};

// Relative luminance per WCAG. Returns 0..1; > ~0.55 means a dark-ink overlay
// reads better than the default paper-on-coloured-bg.
function luminance(hex: string): number {
  const m = hex.replace("#", "").match(/^([0-9a-fA-F]{6})$/);
  if (!m) return 0; // unknown format → treat as dark, keep paper text
  const v = m[1];
  const channel = (start: number) => {
    const c = parseInt(v.slice(start, start + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = channel(0);
  const g = channel(2);
  const b = channel(4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function OrgChip({
  org,
  size = "sm",
}: {
  org: OrgChipData;
  size?: "sm" | "md";
}) {
  const bg = org.brand_color || ORG_TYPE_COLOR[org.type] || C.ink;
  // Flip text colour when the brand background is light enough that paper
  // would fail AA (e.g., a partner sets brand_color to #FFE0F0).
  const fg = luminance(bg) > 0.55 ? C.ink : C.paper;
  const px = size === "sm" ? "px-2 py-[2px]" : "px-2.5 py-1";
  const fs = size === "sm" ? "text-[10px]" : "text-[11px]";
  return (
    <span
      className={`inline-block font-mono ${fs} tracking-[0.12em] uppercase font-bold ${px}`}
      style={{ color: fg, background: bg }}
      title={`${org.name} · ${org.type}`}
    >
      {org.short_name || org.name}
    </span>
  );
}
