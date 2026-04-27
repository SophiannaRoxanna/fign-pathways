import Link from "next/link";
import { notFound } from "next/navigation";
import { C, ORG_TYPE_COLOR } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { Rule } from "@/components/ui/Rule";
import { OrgChip } from "@/components/org/OrgChip";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Organisation } from "@/lib/supabase/types";

// Public, queryable page. Cap recompute to once a minute so visit-spikes don't
// re-run the dozen aggregate queries below.
export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

const monthFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function OrgImpactPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();

  const { data: orgData } = await supabase
    .from("organisations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const org = orgData as Organisation | null;
  if (!org || !org.public_page_enabled) notFound();

  const thirtyIso = isoDaysAgo(30);

  // Parallel queries to build the page.
  const [
    { count: itemsAllTime },
    { count: items30 },
    { data: itemIdsData },
    { count: followers },
    { data: followersPrev },
    { data: lessonRows },
    { data: activitiesRaw },
  ] = await Promise.all([
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("host_org_id", org.id),
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("host_org_id", org.id)
      .gte("posted_at", thirtyIso),
    supabase.from("items").select("id").eq("host_org_id", org.id),
    supabase
      .from("follows")
      .select("member_id", { count: "exact", head: true })
      .eq("org_id", org.id),
    supabase
      .from("follows")
      .select("member_id")
      .eq("org_id", org.id)
      .lt("followed_at", thirtyIso),
    supabase
      .from("lessons")
      .select("id, status")
      .eq("host_org_id", org.id),
    supabase
      .from("activities")
      .select("member_id, kind, created_at")
      .eq("host_org_id", org.id),
  ]);

  const itemIds = ((itemIdsData ?? []) as { id: string }[]).map((r) => r.id);

  let totalRegs = 0;
  let totalAttended = 0;
  const uniqueAttendees = new Set<string>();
  if (itemIds.length > 0) {
    const { count: regsCount } = await supabase
      .from("item_registrations")
      .select("item_id", { count: "exact", head: true })
      .in("item_id", itemIds);
    totalRegs = regsCount ?? 0;

    const { data: attendedData } = await supabase
      .from("item_registrations")
      .select("member_id")
      .in("item_id", itemIds)
      .eq("attended", true);
    for (const row of attendedData ?? []) {
      const m = (row as { member_id: string }).member_id;
      uniqueAttendees.add(m);
      totalAttended++;
    }
  }

  const followersPrevCount = (followersPrev ?? []).length;
  const followersDelta = (followers ?? 0) - followersPrevCount;

  const lessons = (lessonRows ?? []) as { id: string; status: string }[];
  const lessonsPublished = lessons.filter((l) => l.status === "published").length;

  let lessonCompletions = 0;
  if (lessons.length > 0) {
    const { count } = await supabase
      .from("lesson_completions")
      .select("id", { count: "exact", head: true })
      .in(
        "lesson_id",
        lessons.map((l) => l.id),
      );
    lessonCompletions = count ?? 0;
  }

  const activities = (activitiesRaw ?? []) as {
    member_id: string;
    kind: string;
    created_at: string;
  }[];
  const uniqueMembersTouched = new Set(activities.map((a) => a.member_id));
  const activities30 = activities.filter((a) => a.created_at >= thirtyIso).length;

  const chipBg = org.brand_color || ORG_TYPE_COLOR[org.type] || C.ink;
  const now = new Date();

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}>
      {/* Host strip in org's brand colour */}
      <div style={{ height: 6, background: chipBg }} />

      <div className="px-6 md:px-10 py-10 max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href={`/orgs/${slug}`}
            className="font-mono text-[10px] tracking-[0.2em] uppercase"
            style={{ color: C.inkMute }}
          >
            ← {org.short_name || org.name}
          </Link>
          <div className="flex items-center gap-3">
            <OrgChip org={org} size="md" />
            <span
              className="font-mono text-[10px] tracking-[0.18em] uppercase"
              style={{ color: C.inkMute }}
            >
              {org.type}
            </span>
          </div>
        </div>

        <Label>§ impact · live</Label>
        <h1
          className="mt-3 font-display italic leading-[0.98]"
          style={{
            color: C.ink,
            fontSize: "clamp(48px, 8vw, 96px)",
          }}
        >
          What <em>{org.short_name || org.name}</em> has done.
        </h1>
        <p
          className="mt-5 max-w-2xl font-display italic text-xl leading-snug"
          style={{ color: C.inkSoft }}
        >
          Live numbers. Attribution is compound — every activity counted here
          also shows on a member&rsquo;s trail. As of {monthFmt.format(now)}.
        </p>

        <div className="my-12">
          <Rule />
        </div>

        {/* Hosting */}
        <section className="mb-14">
          <SectionHead num="01" kicker="hosting">
            <em>Items</em> put into the world.
          </SectionHead>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            <Stat value={itemsAllTime ?? 0} label="All-time items" />
            <Stat value={items30 ?? 0} label="Last 30 days" />
            <Stat value={totalRegs} label="Registrations · all items" />
            <Stat value={totalAttended} label="Attended · verified & not" />
          </div>
        </section>

        <Rule />

        {/* Reach */}
        <section className="my-14">
          <SectionHead num="02" kicker="reach">
            <em>Women</em> touched by this work.
          </SectionHead>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            <Stat value={uniqueAttendees.size} label="Unique attendees" />
            <Stat
              value={uniqueMembersTouched.size}
              label="Unique members · any activity"
            />
            <Stat value={activities30} label="Activities · last 30 days" />
            <Stat
              value={followers ?? 0}
              label={
                followersDelta >= 0
                  ? `Followers · +${followersDelta} last 30d`
                  : `Followers · ${followersDelta} last 30d`
              }
            />
          </div>
        </section>

        <Rule />

        {/* Learning */}
        <section className="my-14">
          <SectionHead num="03" kicker="learning">
            <em>Lessons</em> contributed and completed.
          </SectionHead>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
            <Stat value={lessonsPublished} label="Lessons published" />
            <Stat value={lessons.length} label="Lessons · all statuses" />
            <Stat value={lessonCompletions} label="Completions · all time" />
          </div>
        </section>

        <Rule />

        <footer className="mt-14 mb-4">
          <p
            className="font-display italic text-lg"
            style={{ color: C.inkMute }}
          >
            Counted in real time. Numbers reconcile across the federation —
            every registration, attendance, and completion also credits the
            participating woman&rsquo;s trail.
          </p>
        </footer>
      </div>
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
          fontSize: "clamp(42px, 6vw, 76px)",
          fontWeight: 500,
        }}
      >
        {value.toLocaleString("en")}
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
