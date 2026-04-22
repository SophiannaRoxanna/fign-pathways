import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { Label } from "@/components/ui/Label";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";

type MemberRow = {
  id: string;
  handle: string | null;
  name: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  primary_org_id: string | null;
};

const dateFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function OrgAdminRosterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { org } = await requireOrgAdmin(slug);
  const supabase = await getSupabaseServer();

  // Roster = primary_org = this org UNION anyone who attended one of our items.
  const { data: primaryRows } = await supabase
    .from("members")
    .select("id, handle, name, email, country, city, primary_org_id")
    .eq("primary_org_id", org.id);

  const { data: itemIdRows } = await supabase
    .from("items")
    .select("id")
    .eq("host_org_id", org.id);
  const ourItemIds = ((itemIdRows ?? []) as { id: string }[]).map((r) => r.id);

  const byId = new Map<string, MemberRow>();
  for (const m of (primaryRows ?? []) as MemberRow[]) {
    byId.set(m.id, m);
  }

  if (ourItemIds.length > 0) {
    const { data: attendeeIdsRaw } = await supabase
      .from("item_registrations")
      .select("member_id")
      .in("item_id", ourItemIds)
      .eq("attended", true);
    const attendeeIds = Array.from(
      new Set(
        ((attendeeIdsRaw ?? []) as { member_id: string }[]).map(
          (r) => r.member_id,
        ),
      ),
    ).filter((id) => !byId.has(id));
    if (attendeeIds.length > 0) {
      const { data: moreMembers } = await supabase
        .from("members")
        .select("id, handle, name, email, country, city, primary_org_id")
        .in("id", attendeeIds);
      for (const m of (moreMembers ?? []) as MemberRow[]) {
        byId.set(m.id, m);
      }
    }
  }

  const members = Array.from(byId.values());
  members.sort((a, b) => (a.name ?? a.handle ?? "").localeCompare(b.name ?? b.handle ?? ""));

  // Visibility rows for this org.
  const memberIds = members.map((m) => m.id);
  const visByMember = new Map<string, boolean>();
  const addedByMember = new Map<string, string>();
  if (memberIds.length > 0) {
    const { data: visRows } = await supabase
      .from("org_roster_visibility")
      .select("member_id, visible_in_public_roster, added_at")
      .eq("org_id", org.id)
      .in("member_id", memberIds);
    for (const r of (visRows ?? []) as {
      member_id: string;
      visible_in_public_roster: boolean;
      added_at: string;
    }[]) {
      visByMember.set(r.member_id, r.visible_in_public_roster);
      addedByMember.set(r.member_id, r.added_at);
    }
  }

  const optInCount = Array.from(visByMember.values()).filter(Boolean).length;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/orgs/${slug}/admin`}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          ← home
        </Link>
      </div>
      <SectionHead
        num="07"
        kicker="roster"
        sub={
          <span>
            Everyone who names <em>{org.short_name || org.name}</em> as home, or
            who has attended one of your items. Public visibility is member-opt-in
            — you can&rsquo;t toggle it on their behalf.
          </span>
        }
      >
        {members.length} in your world. <em>{optInCount}</em> show publicly.
      </SectionHead>

      {members.length === 0 ? (
        <p
          className="font-display italic text-lg"
          style={{ color: C.inkMute }}
        >
          No members linked yet. As people attend your items or set their
          primary org, they&rsquo;ll appear here.
        </p>
      ) : (
        <div style={{ border: `1.5px solid ${C.ink}` }}>
          <div
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] tracking-[0.2em] uppercase items-center"
            style={{
              background: C.paperAlt,
              color: C.inkMute,
              borderBottom: `1.5px solid ${C.ink}`,
            }}
          >
            <span>member</span>
            <span>primary?</span>
            <span>public roster</span>
            <span>opted in</span>
          </div>
          {members.map((m, i) => {
            const visible = visByMember.get(m.id);
            const isPrimary = m.primary_org_id === org.id;
            const optInDate = addedByMember.get(m.id);
            return (
              <div
                key={m.id}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3"
                style={{
                  background: i % 2 ? C.paper : C.paperAlt,
                  borderBottom:
                    i < members.length - 1
                      ? `1px solid ${C.ink}22`
                      : undefined,
                }}
              >
                <div>
                  <div
                    className="font-display text-[16px]"
                    style={{ color: C.ink }}
                  >
                    {m.name ?? m.handle ?? "—"}
                  </div>
                  <div
                    className="font-mono text-[11px]"
                    style={{ color: C.inkSoft }}
                  >
                    {m.email ?? "(no email)"}
                    {m.country ? ` · ${m.country}` : ""}
                    {m.city ? ` / ${m.city}` : ""}
                  </div>
                </div>
                <span
                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                  style={{
                    color: isPrimary ? C.coralDk : C.inkMute,
                    fontWeight: isPrimary ? 700 : 400,
                  }}
                >
                  {isPrimary ? "primary" : "attended"}
                </span>
                <span
                  className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
                  style={{
                    color: visible === true ? C.paper : C.inkMute,
                    background: visible === true ? C.green : "transparent",
                    border:
                      visible === true
                        ? "none"
                        : `1.5px dashed ${C.hairline}`,
                    padding: "2px 8px",
                  }}
                >
                  {visible === true ? "public" : "hidden"}
                </span>
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ color: C.inkMute }}
                >
                  {optInDate ? dateFmt.format(new Date(optInDate)) : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        <Label>a note on consent</Label>
        <p
          className="mt-2 max-w-2xl font-display italic text-lg leading-snug"
          style={{ color: C.inkSoft }}
        >
          FIGN&rsquo;s default is private. Members who want to show up on your
          public page opt in from their own <em>Me</em> page. That choice is
          theirs to make and reverse.
        </p>
      </div>
    </div>
  );
}
