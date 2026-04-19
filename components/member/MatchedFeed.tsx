import { C, ORG_TYPE_COLOR } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip, type OrgChipData } from "@/components/org/OrgChip";
import type { Item } from "@/lib/supabase/types";

const whenFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatWhen(item: Item): string {
  if (item.rolling) return "Open · rolling";
  if (!item.when_start) return "TBA";
  const start = new Date(item.when_start);
  if (Number.isNaN(start.getTime())) return "TBA";
  return whenFmt.format(start);
}

function formatWhere(item: Item): string {
  if (item.location_freetext) return item.location_freetext;
  const parts = [item.city, item.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Online";
}

export type MatchedFeedCard = {
  item: Item;
  host: OrgChipData;
  co_hosts: OrgChipData[];
  endorsed: OrgChipData[];
  why_you: string;
};

export function MatchedFeed({ items }: { items: MatchedFeedCard[] }) {
  return (
    <section className="mt-20">
      <SectionHead
        num="06"
        kicker="Matched to your map"
        sub="Events, workshops, gigs, circles — from FIGN, member orgs, and partners. Register where the host prefers."
      >
        What&apos;s <em style={{ color: C.coral }}>for you</em> right now
      </SectionHead>

      {items.length === 0 ? (
        <div
          className="p-6 text-sm italic"
          style={{
            background: C.paperAlt,
            border: `1.5px solid ${C.ink}`,
            color: C.inkSoft,
          }}
        >
          Your feed is waking up — check back as your map grows.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(({ item, host, co_hosts, endorsed, why_you }) => {
            const hostColor =
              host.brand_color || ORG_TYPE_COLOR[host.type] || C.ink;
            const external =
              item.registration_preference === "own_system" &&
              !!item.registration_url;
            const actionLabel = external
              ? `Register on ${host.short_name || host.name} →`
              : "Register via FIGN →";

            return (
              <div
                key={item.id}
                className="p-6 relative"
                style={{
                  background: C.paperAlt,
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                <div
                  className="-mx-6 -mt-6 px-4 py-2 flex items-center justify-between"
                  style={{
                    background: hostColor,
                    color: C.paper,
                    borderBottom: `1.5px solid ${C.ink}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold">
                      hosted by
                    </span>
                    <span className="font-mono text-[11px] font-bold">
                      {host.name}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-80">
                    {external ? "register on their site" : "register via FIGN"}
                  </span>
                </div>

                {(co_hosts.length > 0 || endorsed.length > 0) && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {co_hosts.map((o) => (
                      <span
                        key={`co-${o.id ?? o.name}`}
                        className="flex items-center gap-1"
                      >
                        <span
                          className="font-mono text-[9px] tracking-wider uppercase"
                          style={{ color: C.inkMute }}
                        >
                          with
                        </span>
                        <OrgChip org={o} />
                      </span>
                    ))}
                    {endorsed.map((o) => (
                      <span
                        key={`en-${o.id ?? o.name}`}
                        className="flex items-center gap-1"
                      >
                        <span
                          className="font-mono text-[9px] tracking-wider uppercase"
                          style={{ color: C.inkMute }}
                        >
                          endorsed by
                        </span>
                        <OrgChip org={o} />
                      </span>
                    ))}
                  </div>
                )}

                <h3
                  className="mt-4 font-display text-xl italic"
                  style={{ color: C.ink }}
                >
                  {item.title}
                </h3>
                <div className="mt-1 text-sm" style={{ color: C.inkSoft }}>
                  {item.hook}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <Label>When</Label>
                    <div style={{ color: C.ink }}>{formatWhen(item)}</div>
                  </div>
                  <div>
                    <Label>Where</Label>
                    <div style={{ color: C.ink }}>{formatWhere(item)}</div>
                  </div>
                </div>
                <div
                  className="mt-3 pt-3 text-sm italic"
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
                    Why you:{" "}
                  </span>
                  {why_you}
                </div>
                <div className="mt-3 flex gap-2">
                  {external && item.registration_url ? (
                    <a
                      href={item.registration_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2"
                      style={{ background: C.ink, color: C.paper }}
                    >
                      {actionLabel}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2 opacity-60 cursor-not-allowed"
                      style={{ background: C.ink, color: C.paper }}
                    >
                      {actionLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
