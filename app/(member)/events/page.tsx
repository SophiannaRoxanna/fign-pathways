import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip } from "@/components/org/OrgChip";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Item, ItemKind, Organisation } from "@/lib/supabase/types";

const KINDS: { id: ItemKind | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "tournament", label: "Tournaments" },
  { id: "workshop", label: "Workshops" },
  { id: "opportunity", label: "Opportunities" },
  { id: "circle", label: "Circles" },
  { id: "hackathon", label: "Hackathons" },
  { id: "mentor_call", label: "Mentor calls" },
];

const COUNTRIES: { code: string; name: string }[] = [
  { code: "", name: "All countries" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "SN", name: "Senegal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
];

const dateFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

type ItemRow = Item & { host: Organisation | null };
type MatchRow = { item_id: string; why_you: string; overlap: number };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const kind = typeof sp.kind === "string" ? sp.kind : "all";
  const country = typeof sp.country === "string" ? sp.country : "";

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: matches } = await supabase.rpc("match_items_for_member", {
    p_member: user.id,
    p_limit: 48,
  });
  const matchMap = new Map<string, MatchRow>();
  (matches as MatchRow[] | null)?.forEach((m) => matchMap.set(m.item_id, m));
  const ids = Array.from(matchMap.keys());

  let items: ItemRow[] = [];
  if (ids.length > 0) {
    let q = supabase
      .from("items")
      .select("*, host:organisations(*)")
      .in("id", ids);
    if (kind !== "all") q = q.eq("kind", kind);
    if (country) q = q.eq("country", country);
    const { data } = await q;
    items = ((data as ItemRow[] | null) ?? []).sort((a, b) => {
      const oa = matchMap.get(a.id)?.overlap ?? 0;
      const ob = matchMap.get(b.id)?.overlap ?? 0;
      return ob - oa;
    });
  }

  const buildHref = (k: string) => {
    const params = new URLSearchParams();
    if (k !== "all") params.set("kind", k);
    if (country) params.set("country", country);
    const q = params.toString();
    return q ? `/events?${q}` : "/events";
  };

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-6xl mx-auto">
      <SectionHead
        num="01"
        kicker="Matched to your map"
        sub="Tournaments, workshops, gigs and circles filtered through what you told us you care about."
      >
        <em>Your feed</em>, not a firehose.
      </SectionHead>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => {
            const active = kind === k.id;
            return (
              <Link
                key={k.id}
                href={buildHref(k.id)}
                className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold px-3 py-1.5"
                style={{
                  background: active ? C.ink : "transparent",
                  color: active ? C.paper : C.ink,
                  border: `1.5px solid ${C.ink}`,
                }}
              >
                {k.label}
              </Link>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Label>Country</Label>
          <form method="GET" action="/events" className="flex items-center gap-2">
            {kind !== "all" && <input type="hidden" name="kind" value={kind} />}
            <select
              name="country"
              defaultValue={country}
              className="font-mono text-[11px] tracking-[0.12em] uppercase px-2 py-1.5 bg-transparent"
              style={{ color: C.ink, border: `1.5px solid ${C.ink}` }}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold px-2 py-1.5"
              style={{ background: C.ink, color: C.paper }}
            >
              Go
            </button>
          </form>
        </div>
      </div>

      {items.length === 0 ? (
        <div
          className="p-8 text-center"
          style={{ border: `1.5px dashed ${C.ink}55`, color: C.inkSoft }}
        >
          <p className="italic font-serif text-lg">
            Nothing matches these filters yet. Loosen them or come back tomorrow.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => {
            const match = matchMap.get(it.id);
            const hostBg = it.host?.brand_color || C.ink;
            return (
              <article
                key={it.id}
                className="flex flex-col"
                style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
              >
                <div
                  className="px-3 py-2 flex items-center justify-between"
                  style={{ background: hostBg, color: C.paper }}
                >
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold">
                    {it.host?.short_name || it.host?.name || "FIGN"}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.18em] uppercase opacity-80">
                    {it.kind.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3
                    className="font-serif italic text-xl leading-tight"
                    style={{ color: C.ink }}
                  >
                    {it.title}
                  </h3>
                  {it.hook && (
                    <p
                      className="mt-2 text-sm leading-snug"
                      style={{ color: C.inkSoft }}
                    >
                      {it.hook}
                    </p>
                  )}

                  <div
                    className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono tracking-[0.14em] uppercase"
                    style={{ color: C.inkMute }}
                  >
                    {it.when_start && (
                      <span>{dateFmt.format(new Date(it.when_start))}</span>
                    )}
                    {it.country && <span>· {it.country}</span>}
                    {it.rolling && <span>· rolling</span>}
                  </div>

                  {it.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {it.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="font-mono text-[10px] tracking-[0.12em] uppercase px-1.5 py-0.5"
                          style={{ color: C.ink, border: `1px solid ${C.ink}44` }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {match?.why_you && (
                    <div
                      className="mt-3 pt-3 text-xs italic"
                      style={{
                        borderTop: `1px solid ${C.ink}22`,
                        color: C.inkSoft,
                      }}
                    >
                      <span
                        style={{ color: C.green, fontStyle: "normal", fontWeight: 600 }}
                      >
                        Why you:{" "}
                      </span>
                      {match.why_you}
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    {it.registration_url ? (
                      <a
                        href={it.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
                        style={{ background: C.ink, color: C.paper }}
                      >
                        Register →
                      </a>
                    ) : (
                      <span
                        className="inline-block font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
                        style={{
                          color: C.ink,
                          border: `1.5px solid ${C.ink}`,
                        }}
                      >
                        Via {it.host?.short_name || "host"}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
