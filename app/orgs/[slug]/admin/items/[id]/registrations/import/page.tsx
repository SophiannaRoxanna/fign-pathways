import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { Label } from "@/components/ui/Label";
import { inputStyle, PrimaryButton } from "@/components/admin/form";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";
import type { Item } from "@/lib/supabase/types";
import { importCsvAction, resolvePendingAction } from "./actions";

type PageProps = {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{
    matched?: string;
    attended?: string;
    pending?: string;
    skipped?: string;
    err?: string;
  }>;
};

type PendingRow = {
  id: string;
  email: string;
  name: string | null;
  attended: boolean;
  created_at: string;
};

const dateFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function OrgAdminImportPage({
  params,
  searchParams,
}: PageProps) {
  const { slug, id } = await params;
  const sp = await searchParams;
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

  const { data: pendingRaw } = await supabase
    .from("pending_registrations")
    .select("id, email, name, attended, created_at")
    .eq("item_id", id)
    .is("resolved_at", null)
    .order("created_at", { ascending: false });
  const pending = (pendingRaw ?? []) as PendingRow[];

  const summary =
    sp.matched !== undefined
      ? {
          matched: Number(sp.matched),
          attended: Number(sp.attended ?? 0),
          pending: Number(sp.pending ?? 0),
          skipped: Number(sp.skipped ?? 0),
        }
      : null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/orgs/${slug}/admin/items/${id}/registrations`}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          ← registrations
        </Link>
      </div>
      <SectionHead
        num="05a"
        kicker="import csv"
        sub={
          <span>
            Paste or upload the attendee list from your own registration system.
            Columns: <em>email</em> (required), <em>name</em>, <em>attended</em>{" "}
            (1/true/yes), <em>verified</em>. Emails without a FIGN member land
            in the pending list below — invite them individually.
          </span>
        }
      >
        Backfill attendance for <em>{it.title}</em>.
      </SectionHead>

      {summary ? (
        <div
          className="mb-8 p-5"
          style={{ background: C.coralSoft, border: `1.5px solid ${C.coralDk}` }}
        >
          <Label color={C.coralDk}>last import</Label>
          <p
            className="mt-2 font-display italic text-xl leading-snug"
            style={{ color: C.ink }}
          >
            Matched <em>{summary.matched}</em> members ·{" "}
            <em>{summary.attended}</em> newly marked attended ·{" "}
            <em>{summary.pending}</em> pending invites · {summary.skipped}{" "}
            already attended.
          </p>
        </div>
      ) : null}

      {sp.err ? (
        <div
          className="mb-8 p-5"
          style={{ background: "#fde7ea", border: `1.5px solid ${C.danger}` }}
        >
          <Label color={C.danger}>import failed</Label>
          <p
            className="mt-2 font-display italic text-lg"
            style={{ color: C.ink }}
          >
            {decodeURIComponent(sp.err)}
          </p>
        </div>
      ) : null}

      <form action={importCsvAction} className="space-y-5">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="item_id" value={id} />

        <div className="flex flex-col gap-2">
          <Label>paste csv</Label>
          <textarea
            name="csv_text"
            rows={10}
            placeholder={`email,name,attended\nmaya@fac.cm,Maya,yes\nngozi@example.com,Ngozi,yes`}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }}
          />
        </div>

        <div
          className="font-mono text-[10px] tracking-[0.2em] uppercase text-center py-1"
          style={{ color: C.inkMute }}
        >
          or
        </div>

        <div className="flex flex-col gap-2">
          <Label>upload csv file</Label>
          <input type="file" name="csv_file" accept=".csv,text/csv" />
        </div>

        <PrimaryButton>Import →</PrimaryButton>
      </form>

      <div className="mt-14">
        <SectionHead
          num="05b"
          kicker="pending invites"
          sub="Emails uploaded but not matched to a FIGN member. Invite the person — they get a magic link and, on first sign-in, their registration is auto-linked."
        >
          {pending.length} waiting.
        </SectionHead>

        {pending.length === 0 ? (
          <p
            className="font-display italic text-lg"
            style={{ color: C.inkMute }}
          >
            Nothing pending. All uploaded emails matched or were resolved.
          </p>
        ) : (
          <div style={{ border: `1.5px solid ${C.ink}` }}>
            <div
              className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] tracking-[0.2em] uppercase items-center"
              style={{
                background: C.paperAlt,
                color: C.inkMute,
                borderBottom: `1.5px solid ${C.ink}`,
              }}
            >
              <span>email</span>
              <span>name</span>
              <span>attended</span>
              <span>uploaded</span>
              <span>actions</span>
            </div>
            {pending.map((p, i) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3"
                style={{
                  background: i % 2 ? C.paper : C.paperAlt,
                  borderBottom:
                    i < pending.length - 1
                      ? `1px solid ${C.ink}22`
                      : undefined,
                }}
              >
                <span
                  className="font-mono text-[12px]"
                  style={{ color: C.ink }}
                >
                  {p.email}
                </span>
                <span
                  className="font-display text-[15px]"
                  style={{ color: C.inkSoft }}
                >
                  {p.name ?? "—"}
                </span>
                <span
                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: p.attended ? C.green : C.inkMute }}
                >
                  {p.attended ? "yes" : "no"}
                </span>
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ color: C.inkMute }}
                >
                  {dateFmt.format(new Date(p.created_at))}
                </span>
                <div className="flex items-center gap-2">
                  <form action={resolvePendingAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="item_id" value={id} />
                    <input type="hidden" name="pending_id" value={p.id} />
                    <input type="hidden" name="action" value="invite" />
                    <button
                      type="submit"
                      className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold px-2 py-1"
                      style={{
                        background: C.ink,
                        color: C.paper,
                        border: `1.5px solid ${C.ink}`,
                      }}
                    >
                      invite →
                    </button>
                  </form>
                  <form action={resolvePendingAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="item_id" value={id} />
                    <input type="hidden" name="pending_id" value={p.id} />
                    <input type="hidden" name="action" value="dismiss" />
                    <button
                      type="submit"
                      className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                      style={{ color: C.inkMute }}
                    >
                      dismiss
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
