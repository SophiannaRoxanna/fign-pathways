import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip } from "@/components/org/OrgChip";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";
import type { Item, Organisation } from "@/lib/supabase/types";

export default async function OrgAdminItemsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { org } = await requireOrgAdmin(slug);
  const supabase = await getSupabaseServer();

  const [{ data: itemsData }, { data: orgsData }] = await Promise.all([
    supabase
      .from("items")
      .select("*")
      .or(`host_org_id.eq.${org.id},co_host_org_ids.cs.{${org.id}}`)
      .order("posted_at", { ascending: false }),
    supabase.from("organisations").select("*"),
  ]);

  const items = (itemsData ?? []) as Item[];
  const orgs = (orgsData ?? []) as Organisation[];
  const orgById = new Map(orgs.map((o) => [o.id, o]));

  const itemIds = items.map((i) => i.id);
  const regCountByItem = new Map<string, number>();
  if (itemIds.length > 0) {
    const { data: regData } = await supabase
      .from("item_registrations")
      .select("item_id")
      .in("item_id", itemIds);
    for (const r of regData ?? []) {
      const k = (r as { item_id: string }).item_id;
      regCountByItem.set(k, (regCountByItem.get(k) ?? 0) + 1);
    }
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-7">
        <SectionHead num="02" kicker="items" sub={
          <span>
            Hosted by you, or co-hosted with partners. Co-hosted items are
            read-only — <em>edit</em> only appears where {org.short_name || org.name} is the host.
          </span>
        }>
          Your feed.
        </SectionHead>
        <Link
          href={`/orgs/${slug}/admin/items/new`}
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-5 py-3 shrink-0"
          style={{
            background: C.ink,
            color: C.paper,
            border: `1.5px solid ${C.ink}`,
          }}
        >
          + new item
        </Link>
      </div>

      {items.length === 0 ? (
        <div
          className="py-12 px-6 text-center"
          style={{ background: C.paperAlt, border: `1.5px solid ${C.hairline}` }}
        >
          <p
            className="font-display italic text-xl max-w-md mx-auto"
            style={{ color: C.inkSoft }}
          >
            No items yet. Post your first one and it lands on every matching
            member&rsquo;s map.
          </p>
          <Link
            href={`/orgs/${slug}/admin/items/new`}
            className="inline-block mt-6 font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
            style={{ background: C.ink, color: C.paper }}
          >
            Post an item →
          </Link>
        </div>
      ) : (
        <div style={{ border: `1.5px solid ${C.ink}` }}>
          <div
            className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] tracking-[0.2em] uppercase items-center"
            style={{
              background: C.paperAlt,
              color: C.inkMute,
              borderBottom: `1.5px solid ${C.ink}`,
            }}
          >
            <span>host</span>
            <span>kind</span>
            <span>title</span>
            <span>when</span>
            <span>regs</span>
            <span>vis</span>
            <span>edit</span>
          </div>
          {items.map((it, i) => {
            const host = orgById.get(it.host_org_id);
            const isHost = it.host_org_id === org.id;
            return (
              <div
                key={it.id}
                className="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 items-center"
                style={{
                  background: i % 2 ? C.paper : C.paperAlt,
                  borderBottom:
                    i < items.length - 1 ? `1px solid ${C.ink}22` : undefined,
                }}
              >
                {host ? (
                  <OrgChip org={host} />
                ) : (
                  <span style={{ color: C.inkMute }}>—</span>
                )}
                <span
                  className="font-mono text-[10px] tracking-[0.18em] uppercase"
                  style={{
                    color: C.paper,
                    background: C.inkSoft,
                    padding: "2px 6px",
                  }}
                >
                  {it.kind}
                </span>
                <span
                  className="font-display text-[17px] truncate"
                  style={{ color: C.ink }}
                  title={it.title}
                >
                  {it.title}
                </span>
                <span
                  className="font-mono text-[10px] tracking-wider uppercase"
                  style={{ color: C.inkSoft }}
                >
                  {it.when_start
                    ? new Date(it.when_start).toLocaleDateString("en", {
                        timeZone: "UTC",
                        month: "short",
                        day: "numeric",
                      })
                    : it.rolling
                      ? "rolling"
                      : "—"}
                </span>
                {isHost ? (
                  <Link
                    href={`/orgs/${slug}/admin/items/${it.id}/registrations`}
                    className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                    style={{ color: C.ink }}
                  >
                    {regCountByItem.get(it.id) ?? 0}
                  </Link>
                ) : (
                  <span
                    className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                    style={{ color: C.inkMute }}
                    title="Co-host — registrations are managed by the host org"
                  >
                    {regCountByItem.get(it.id) ?? 0}
                  </span>
                )}
                <span
                  className="font-mono text-[10px] tracking-[0.18em] uppercase"
                  style={{ color: C.inkMute }}
                >
                  {it.visibility}
                </span>
                {isHost ? (
                  <Link
                    href={`/orgs/${slug}/admin/items/${it.id}`}
                    className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                    style={{ color: C.coralDk }}
                  >
                    edit →
                  </Link>
                ) : (
                  <span
                    className="font-mono text-[10px] tracking-[0.18em] uppercase"
                    style={{ color: C.inkMute }}
                    title="Co-hosted — edit on host's admin"
                  >
                    co-host
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
