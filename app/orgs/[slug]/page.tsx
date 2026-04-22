import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip } from "@/components/org/OrgChip";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Item, Organisation } from "@/lib/supabase/types";

const followSchema = z.object({
  org_id: z.string().uuid(),
  op: z.enum(["follow", "unfollow"]),
  slug: z.string().min(1),
});

async function toggleFollow(formData: FormData) {
  "use server";
  const parsed = followSchema.safeParse({
    org_id: formData.get("org_id"),
    op: formData.get("op"),
    slug: formData.get("slug"),
  });
  if (!parsed.success) return;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (parsed.data.op === "follow") {
    await supabase
      .from("follows")
      .insert({ member_id: user.id, org_id: parsed.data.org_id });
  } else {
    await supabase
      .from("follows")
      .delete()
      .eq("member_id", user.id)
      .eq("org_id", parsed.data.org_id);
  }
  revalidatePath(`/orgs/${parsed.data.slug}`);
}

const dateFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function OrgPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();

  const { data: orgData } = await supabase
    .from("organisations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const org = orgData as Organisation | null;
  if (!org || !org.public_page_enabled) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nowIso = new Date().toISOString();
  const { data: itemsData } = await supabase
    .from("items")
    .select("*")
    .or(`host_org_id.eq.${org.id},co_host_org_ids.cs.{${org.id}}`)
    .or(`when_start.gte.${nowIso},rolling.eq.true`)
    .order("when_start", { ascending: true })
    .limit(48);
  const items = (itemsData as Item[] | null) ?? [];

  // Public roster: members who have opted into visibility for this org.
  const { data: rosterVis } = await supabase
    .from("org_roster_visibility")
    .select("member_id")
    .eq("org_id", org.id)
    .eq("visible_in_public_roster", true)
    .limit(48);
  const rosterMemberIds = ((rosterVis ?? []) as { member_id: string }[]).map(
    (r) => r.member_id,
  );
  type RosterMember = {
    id: string;
    handle: string | null;
    name: string | null;
    country: string | null;
    city: string | null;
  };
  let rosterMembers: RosterMember[] = [];
  if (rosterMemberIds.length > 0) {
    const { data: pm } = await supabase
      .from("public_members")
      .select("id, handle, name, country, city")
      .in("id", rosterMemberIds)
      .order("name");
    rosterMembers = ((pm ?? []) as RosterMember[]) ?? [];
  }

  let isFollowing = false;
  let isAdmin = false;
  if (user) {
    const { data: follow } = await supabase
      .from("follows")
      .select("org_id")
      .eq("member_id", user.id)
      .eq("org_id", org.id)
      .maybeSingle();
    isFollowing = !!follow;

    const { data: admin } = await supabase
      .from("org_admins")
      .select("role")
      .eq("member_id", user.id)
      .eq("org_id", org.id)
      .maybeSingle();
    isAdmin = !!admin;
  }

  const bg = org.brand_color || C.ink;

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}>
      <header
        className="px-6 md:px-10 py-8 md:py-10"
        style={{ background: bg, color: C.paper }}
      >
        <div className="max-w-5xl mx-auto">
          <div
            className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-80"
          >
            {org.type} · {org.country_code ?? "pan-african"}
            {org.language ? ` · ${org.language}` : ""}
          </div>
          <h1 className="mt-3 font-display italic text-4xl md:text-6xl leading-[1.02]">
            {org.name}
          </h1>
          {org.tagline && (
            <p className="mt-4 font-display italic text-xl md:text-2xl max-w-2xl opacity-90">
              {org.tagline}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {user && (
              <form action={toggleFollow}>
                <input type="hidden" name="org_id" value={org.id} />
                <input type="hidden" name="slug" value={org.slug} />
                <input
                  type="hidden"
                  name="op"
                  value={isFollowing ? "unfollow" : "follow"}
                />
                <button
                  type="submit"
                  className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
                  style={{ background: C.paper, color: C.ink }}
                >
                  {isFollowing ? "Following ✓" : "Follow this org →"}
                </button>
              </form>
            )}
            {!user && (
              <Link
                href="/signin"
                className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
                style={{ background: C.paper, color: C.ink }}
              >
                Sign in to follow →
              </Link>
            )}
            {isAdmin && (
              <Link
                href={`/orgs/${org.slug}/admin`}
                className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold"
                style={{ color: C.paper, textDecoration: "underline" }}
              >
                Manage this org →
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <SectionHead
          num="01"
          kicker="Upcoming"
          sub="Items hosted or co-hosted by this organisation."
        >
          What&rsquo;s <em>next</em> from {org.short_name || org.name}
        </SectionHead>

        {items.length === 0 ? (
          <div
            className="p-8 text-center"
            style={{ border: `1.5px dashed ${C.ink}55`, color: C.inkSoft }}
          >
            <p className="italic font-display text-lg">
              Nothing on the calendar right now. Follow to be the first to know.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((it) => (
              <article
                key={it.id}
                className="flex flex-col p-4"
                style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <OrgChip
                    org={{
                      id: org.id,
                      slug: org.slug,
                      name: org.name,
                      short_name: org.short_name,
                      type: org.type,
                      brand_color: org.brand_color,
                    }}
                  />
                  <span
                    className="font-mono text-[10px] tracking-[0.18em] uppercase"
                    style={{ color: C.inkMute }}
                  >
                    {it.kind.replace(/_/g, " ")}
                  </span>
                </div>
                <h3
                  className="mt-3 font-display italic text-xl leading-tight"
                  style={{ color: C.ink }}
                >
                  {it.title}
                </h3>
                {it.hook && (
                  <p className="mt-2 text-sm" style={{ color: C.inkSoft }}>
                    {it.hook}
                  </p>
                )}
                <div
                  className="mt-3 font-mono text-[11px] tracking-[0.14em] uppercase"
                  style={{ color: C.inkMute }}
                >
                  {it.when_start && dateFmt.format(new Date(it.when_start))}
                  {it.country && ` · ${it.country}`}
                  {it.rolling && " · rolling"}
                </div>
                {it.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {it.tags.slice(0, 5).map((t) => (
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
                    <Label>Registration via {org.short_name || "host"}</Label>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {rosterMembers.length > 0 && (
          <section className="mt-14">
            <SectionHead
              num="02"
              kicker="Members"
              sub="Women who chose to be visible on this page. Opt-in, reversible."
            >
              Who <em>shows up</em> for {org.short_name || org.name}
            </SectionHead>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {rosterMembers.map((m) => (
                <li
                  key={m.id}
                  className="p-3"
                  style={{ background: C.paperAlt, border: `1.5px solid ${C.hairline}` }}
                >
                  <div
                    className="font-display text-[16px] leading-tight truncate"
                    style={{ color: C.ink }}
                  >
                    {m.name ?? m.handle ?? "—"}
                  </div>
                  <div
                    className="mt-1 font-mono text-[10px] tracking-[0.18em] uppercase"
                    style={{ color: C.inkMute }}
                  >
                    {[m.city, m.country].filter(Boolean).join(" · ") || "—"}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
