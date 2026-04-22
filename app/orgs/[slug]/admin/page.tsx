import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { Rule } from "@/components/ui/Rule";
import { OrgChip } from "@/components/org/OrgChip";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";
import type { Item, Organisation } from "@/lib/supabase/types";

const dateFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});
const datetimeFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function startOfWeekISO() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return d.toISOString();
}
function startOfMonthISO() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export default async function OrgAdminHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { org, role } = await requireOrgAdmin(slug);
  const supabase = await getSupabaseServer();

  const nowIso = new Date().toISOString();
  const weekIso = startOfWeekISO();
  const monthIso = startOfMonthISO();

  const [
    { data: upcomingData },
    { count: upcomingCount },
    { data: ownedItemIdsData },
    { count: followersCount },
    { data: activityData },
  ] = await Promise.all([
    supabase
      .from("items")
      .select("id, kind, title, when_start, when_end, rolling, city, country, visibility, host_org_id, co_host_org_ids, endorsed_org_ids, language, capacity, registration_url, registration_preference, tags, hook, body, cover_url, posted_at, posted_by")
      .or(`host_org_id.eq.${org.id},co_host_org_ids.cs.{${org.id}}`)
      .or(`when_start.gte.${nowIso},rolling.eq.true`)
      .order("when_start", { ascending: true, nullsFirst: false })
      .limit(3),
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .or(`host_org_id.eq.${org.id},co_host_org_ids.cs.{${org.id}}`)
      .or(`when_start.gte.${nowIso},rolling.eq.true`),
    supabase.from("items").select("id").eq("host_org_id", org.id),
    supabase
      .from("follows")
      .select("member_id", { count: "exact", head: true })
      .eq("org_id", org.id),
    supabase
      .from("activities")
      .select("id, kind, title, created_at, member_id, related_entity_id")
      .eq("host_org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const upcoming = (upcomingData as Item[] | null) ?? [];
  const ownedItemIds = ((ownedItemIdsData as { id: string }[] | null) ?? []).map(
    (r) => r.id,
  );

  let regsThisWeek = 0;
  let attendedThisMonth = 0;
  if (ownedItemIds.length > 0) {
    const [{ count: regsCount }, { count: attCount }] = await Promise.all([
      supabase
        .from("item_registrations")
        .select("item_id", { count: "exact", head: true })
        .in("item_id", ownedItemIds)
        .gte("registered_at", weekIso),
      supabase
        .from("item_registrations")
        .select("item_id", { count: "exact", head: true })
        .in("item_id", ownedItemIds)
        .eq("attended", true)
        .gte("registered_at", monthIso),
    ]);
    regsThisWeek = regsCount ?? 0;
    attendedThisMonth = attCount ?? 0;
  }

  return (
    <div>
      {/* Welcome strip */}
      <div className="mb-10">
        <Label>§ admin · {role}</Label>
        <h1
          className="mt-3 font-display italic text-4xl md:text-5xl leading-[1.05]"
          style={{ color: C.ink }}
        >
          Good to see you, <em>{org.short_name || org.name}</em>.
        </h1>
        <p
          className="mt-4 max-w-2xl font-display italic text-xl leading-snug"
          style={{ color: C.inkSoft }}
        >
          Post items, track who showed up, and keep your page honest. Every card
          you publish carries your host strip across the federation.
        </p>
      </div>

      {/* Glance — no borders, big numerals, mono captions */}
      <section className="mb-12">
        <SectionHead num="01" kicker="At a glance">
          <em>The numbers that matter today.</em>
        </SectionHead>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          <Stat value={upcomingCount ?? 0} label="Upcoming / rolling items" />
          <Stat value={regsThisWeek} label="Registrations · this week" />
          <Stat value={attendedThisMonth} label="Attended · this month" />
          <Stat value={followersCount ?? 0} label="Followers · all time" />
        </div>
      </section>

      <Rule />

      {/* Quick actions */}
      <section className="my-12">
        <Label>Next moves</Label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <QuickAction
            href={`/orgs/${slug}/admin/items/new`}
            primary
            label="Post a new item →"
          />
          <QuickAction
            href={`/orgs/${slug}/admin/items`}
            label="Manage items"
          />
          <QuickAction
            href={`/orgs/${slug}/admin/team`}
            label="Invite a coordinator"
          />
          <QuickAction
            href={`/orgs/${slug}/admin/settings`}
            label="Edit public page"
          />
        </div>
      </section>

      <Rule />

      {/* Next 3 */}
      <section className="my-12">
        <SectionHead num="02" kicker="On the calendar" sub={
          <span>
            Next <em>three</em>. Hosted by {org.short_name || org.name} or
            co-hosted with partners.
          </span>
        }>
          <em>What&rsquo;s next.</em>
        </SectionHead>
        {upcoming.length === 0 ? (
          <EmptyState
            body="No upcoming items yet. Post your first one and it lands on every matching member's map."
            ctaHref={`/orgs/${slug}/admin/items/new`}
            ctaLabel="Post an item →"
          />
        ) : (
          <ol className="space-y-4">
            {upcoming.map((item, i) => (
              <UpcomingRow key={item.id} n={i + 1} item={item} org={org} slug={slug} />
            ))}
          </ol>
        )}
      </section>

      <Rule />

      {/* Recent activity */}
      <section className="my-12">
        <SectionHead num="03" kicker="Latest footprints">
          <em>Recent activity attributed to you.</em>
        </SectionHead>
        <ActivityFeed rows={activityData ?? []} />
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div
        className="font-display leading-none"
        style={{
          color: C.ink,
          fontSize: "clamp(42px, 6vw, 68px)",
          fontWeight: 500,
        }}
      >
        {value}
      </div>
      <div
        className="mt-2 font-mono text-[10px] tracking-[0.2em] uppercase font-semibold"
        style={{ color: C.inkMute }}
      >
        {label}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  primary,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
      style={{
        background: primary ? C.ink : "transparent",
        color: primary ? C.paper : C.ink,
        border: `1.5px solid ${C.ink}`,
      }}
    >
      {label}
    </Link>
  );
}

function UpcomingRow({
  n,
  item,
  org,
  slug,
}: {
  n: number;
  item: Item;
  org: Organisation;
  slug: string;
}) {
  const when = item.rolling
    ? "Rolling"
    : item.when_start
    ? datetimeFmt.format(new Date(item.when_start))
    : "TBD";
  const where =
    item.city && item.country
      ? `${item.city} · ${item.country}`
      : item.city || item.country || "";

  return (
    <li
      className="flex items-baseline gap-5 py-3"
      style={{ borderBottom: `1px solid ${C.hairline}` }}
    >
      <span
        className="font-mono text-[11px] tracking-[0.18em] uppercase"
        style={{ color: C.inkMute }}
      >
        § {String(n).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <OrgChip org={org} />
          <Label color={C.inkMute}>{item.kind.replace(/_/g, " ")}</Label>
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: C.inkMute }}>
            {when}
            {where ? ` · ${where}` : ""}
          </span>
        </div>
        <div
          className="mt-1 font-display text-xl md:text-2xl leading-tight"
          style={{ color: C.ink }}
        >
          {item.title}
        </div>
      </div>
      <Link
        href={`/orgs/${slug}/admin/items/${item.id}`}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold shrink-0"
        style={{ color: C.coralDk }}
      >
        edit →
      </Link>
    </li>
  );
}

function EmptyState({
  body,
  ctaHref,
  ctaLabel,
}: {
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div
      className="py-10 px-6 text-center"
      style={{ background: C.paperAlt, border: `1.5px solid ${C.hairline}` }}
    >
      <p
        className="font-display italic text-xl max-w-md mx-auto"
        style={{ color: C.inkSoft }}
      >
        {body}
      </p>
      <Link
        href={ctaHref}
        className="inline-block mt-6 font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
        style={{ background: C.ink, color: C.paper }}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function ActivityFeed({
  rows,
}: {
  rows: { id: string; kind: string; title: string | null; created_at: string }[];
}) {
  if (rows.length === 0) {
    return (
      <p
        className="font-display italic text-lg"
        style={{ color: C.inkMute }}
      >
        No attributed activity yet — it will show up here once members register,
        attend, or complete your lessons.
      </p>
    );
  }
  return (
    <ol className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.id}
          className="flex items-baseline gap-4 py-2"
          style={{ borderBottom: `1px solid ${C.hairline}` }}
        >
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase shrink-0"
            style={{ color: C.inkMute, minWidth: "4.5rem" }}
          >
            {dateFmt.format(new Date(r.created_at))}
          </span>
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase shrink-0"
            style={{ color: C.coralDk, minWidth: "10rem" }}
          >
            {r.kind.replace(/_/g, " ")}
          </span>
          <span
            className="text-[14px] leading-snug"
            style={{ color: C.inkSoft }}
          >
            {r.title ?? "—"}
          </span>
        </li>
      ))}
    </ol>
  );
}
