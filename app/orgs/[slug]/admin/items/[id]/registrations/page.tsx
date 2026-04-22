import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { Label } from "@/components/ui/Label";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";
import type { Item } from "@/lib/supabase/types";
import { toggleAttendedAction, toggleVerifiedAction } from "./actions";

type PageProps = { params: Promise<{ slug: string; id: string }> };

type RegRow = {
  item_id: string;
  member_id: string;
  status: string;
  source: "fign" | "external_webhook" | "csv_upload";
  registered_at: string;
  attended: boolean;
  verified_by: string | null;
  members: {
    id: string;
    handle: string | null;
    name: string | null;
    email: string | null;
    country: string | null;
  } | null;
};

const dateFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const SOURCE_COLOR: Record<string, string> = {
  fign: C.coral,
  external_webhook: C.purple,
  csv_upload: C.purpleDeep,
};

export default async function OrgAdminRegistrationsPage({ params }: PageProps) {
  const { slug, id } = await params;
  const { org, isUmbrella } = await requireOrgAdmin(slug);
  const supabase = await getSupabaseServer();

  const { data: item } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!item) notFound();
  const it = item as Item;
  if (it.host_org_id !== org.id && !isUmbrella) notFound();

  const { data: regRaw } = await supabase
    .from("item_registrations")
    .select(
      "item_id, member_id, status, source, registered_at, attended, verified_by, members(id, handle, name, email, country)",
    )
    .eq("item_id", id)
    .order("registered_at", { ascending: false });
  const regs = (regRaw ?? []) as unknown as RegRow[];

  const attendedCount = regs.filter((r) => r.attended).length;
  const verifiedCount = regs.filter((r) => r.verified_by).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href={`/orgs/${slug}/admin/items/${id}`}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          ← edit item
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/orgs/${slug}/admin/items/${id}/registrations/export`}
            prefetch={false}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
            style={{
              background: "transparent",
              color: C.ink,
              border: `1.5px solid ${C.ink}`,
            }}
          >
            export csv ↓
          </Link>
          <Link
            href={`/orgs/${slug}/admin/items/${id}/registrations/import`}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
            style={{
              background: C.ink,
              color: C.paper,
              border: `1.5px solid ${C.ink}`,
            }}
          >
            import csv ↑
          </Link>
        </div>
      </div>

      <SectionHead
        num="05"
        kicker={it.kind.replace(/_/g, " ")}
        sub={
          <span>
            {regs.length} registered · <em>{attendedCount}</em> attended ·{" "}
            {verifiedCount} verified. Mark attendance — each flip creates an
            <em> activity</em> entry on the member&rsquo;s trail with your host
            strip.
          </span>
        }
      >
        <em>{it.title}</em>
      </SectionHead>

      {regs.length === 0 ? (
        <div
          className="py-12 px-6 text-center"
          style={{ background: C.paperAlt, border: `1.5px solid ${C.hairline}` }}
        >
          <p
            className="font-display italic text-xl max-w-md mx-auto"
            style={{ color: C.inkSoft }}
          >
            No registrations yet. If you collect them on your own system,
            <br />
            upload a CSV after the event to backfill attendance.
          </p>
        </div>
      ) : (
        <div style={{ border: `1.5px solid ${C.ink}` }}>
          <div
            className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] tracking-[0.2em] uppercase items-center"
            style={{
              background: C.paperAlt,
              color: C.inkMute,
              borderBottom: `1.5px solid ${C.ink}`,
            }}
          >
            <span>member</span>
            <span>registered</span>
            <span>source</span>
            <span>status</span>
            <span>attended</span>
            <span>verified</span>
          </div>
          {regs.map((r, i) => (
            <div
              key={`${r.item_id}:${r.member_id}`}
              className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3"
              style={{
                background: i % 2 ? C.paper : C.paperAlt,
                borderBottom:
                  i < regs.length - 1 ? `1px solid ${C.ink}22` : undefined,
              }}
            >
              <div>
                <div
                  className="font-display text-[16px]"
                  style={{ color: C.ink }}
                >
                  {r.members?.name ?? r.members?.handle ?? "—"}
                </div>
                <div
                  className="font-mono text-[11px]"
                  style={{ color: C.inkSoft }}
                >
                  {r.members?.email ?? "(no email)"}
                  {r.members?.country ? ` · ${r.members.country}` : ""}
                </div>
              </div>
              <span
                className="font-mono text-[10px] tracking-wider"
                style={{ color: C.inkMute }}
              >
                {dateFmt.format(new Date(r.registered_at))}
              </span>
              <span
                className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                style={{
                  color: C.paper,
                  background: SOURCE_COLOR[r.source] ?? C.ink,
                  padding: "2px 6px",
                }}
                title={r.source}
              >
                {r.source === "fign"
                  ? "fign"
                  : r.source === "external_webhook"
                    ? "hook"
                    : "csv"}
              </span>
              <span
                className="font-mono text-[10px] tracking-[0.18em] uppercase"
                style={{ color: C.inkMute }}
              >
                {r.status}
              </span>
              <form action={toggleAttendedAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="item_id" value={r.item_id} />
                <input type="hidden" name="member_id" value={r.member_id} />
                <input
                  type="hidden"
                  name="next"
                  value={r.attended ? "0" : "1"}
                />
                <button
                  type="submit"
                  className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold px-2 py-1"
                  style={{
                    color: r.attended ? C.paper : C.ink,
                    background: r.attended ? C.green : "transparent",
                    border: `1.5px solid ${r.attended ? C.green : C.ink}`,
                  }}
                >
                  {r.attended ? "✓ attended" : "mark attended"}
                </button>
              </form>
              <form action={toggleVerifiedAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="item_id" value={r.item_id} />
                <input type="hidden" name="member_id" value={r.member_id} />
                <input
                  type="hidden"
                  name="next"
                  value={r.verified_by ? "0" : "1"}
                />
                <button
                  type="submit"
                  className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                  style={{ color: r.verified_by ? C.coralDk : C.inkMute }}
                  title={
                    r.verified_by
                      ? "verified by an org admin"
                      : "mark this registration as verified"
                  }
                >
                  {r.verified_by ? "✓ verified" : "verify"}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Label>source codes</Label>
        <p
          className="mt-2 max-w-2xl text-[14px]"
          style={{ color: C.inkMute }}
        >
          <span style={{ color: C.coral, fontWeight: 700 }}>fign</span> — member
          registered through FIGN;{" "}
          <span style={{ color: C.purple, fontWeight: 700 }}>hook</span> — synced
          from your own registration system via webhook;{" "}
          <span style={{ color: C.purpleDeep, fontWeight: 700 }}>csv</span> —
          uploaded from a spreadsheet.
        </p>
      </div>
    </div>
  );
}
