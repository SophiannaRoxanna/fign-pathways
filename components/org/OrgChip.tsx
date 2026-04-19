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

export function OrgChip({
  org,
  size = "sm",
}: {
  org: OrgChipData;
  size?: "sm" | "md";
}) {
  const bg = org.brand_color || ORG_TYPE_COLOR[org.type] || C.ink;
  const px = size === "sm" ? "px-2 py-[2px]" : "px-2.5 py-1";
  const fs = size === "sm" ? "text-[10px]" : "text-[11px]";
  return (
    <span
      className={`inline-block font-mono ${fs} tracking-[0.12em] uppercase font-bold ${px}`}
      style={{ color: C.paper, background: bg }}
      title={`${org.name} · ${org.type}`}
    >
      {org.short_name || org.name}
    </span>
  );
}
