import Link from "next/link";
import { headers } from "next/headers";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { Label } from "@/components/ui/Label";
import { Rule } from "@/components/ui/Rule";
import { OrgForm } from "@/components/admin/OrgForm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";
import { updateOrgSettingsAction, rotateWebhookSecretAction } from "./actions";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ new_secret?: string }>;
};

type WebhookEvent = {
  id: string;
  ok: boolean;
  matched_count: number;
  pending_count: number;
  error: string | null;
  received_at: string;
};

const datetimeFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function OrgAdminSettingsPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const { org, isUmbrella } = await requireOrgAdmin(slug);
  const supabase = await getSupabaseServer();

  const { data: orgSecretRow } = await supabase
    .from("organisations")
    .select("webhook_secret")
    .eq("id", org.id)
    .maybeSingle();
  const hasSecret = !!(orgSecretRow as { webhook_secret: string | null } | null)
    ?.webhook_secret;

  const { data: eventsRaw } = await supabase
    .from("webhook_events")
    .select("id, ok, matched_count, pending_count, error, received_at")
    .eq("org_id", org.id)
    .order("received_at", { ascending: false })
    .limit(10);
  const events = (eventsRaw ?? []) as WebhookEvent[];

  const h = await headers();
  const host = h.get("host") ?? "fign.org";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const webhookUrl = `${proto}://${host}/api/orgs/${slug}/registrations/webhook`;

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
        num="06"
        kicker="settings"
        sub={
          <span>
            Your brand, your tagline, how registrations flow. Slug and type are
            umbrella-owned — contact Sophia to rename.
          </span>
        }
      >
        How <em>{org.short_name || org.name}</em> shows up.
      </SectionHead>

      <OrgForm
        initial={org}
        action={updateOrgSettingsAction}
        hiddenFields={{ id: org.id, current_slug: org.slug }}
        lockIdentity={!isUmbrella}
        submitLabel="Save settings"
      />

      <div className="mt-14">
        <Rule />
      </div>

      {/* Webhook panel */}
      <section className="mt-10">
        <SectionHead
          num="06b"
          kicker="webhook"
          sub={
            <span>
              POST your post-event attendee list to FIGN to auto-mark
              attendance. Body: JSON with <em>external_item_ref</em> and{" "}
              <em>attendees</em>. Sign the raw body with HMAC-SHA256 using your
              secret; send as <code style={{ color: C.ink }}>X-FIGN-Signature: sha256=…</code>.
            </span>
          }
        >
          Sync from your own system.
        </SectionHead>

        {sp.new_secret ? (
          <div
            className="mb-6 p-5"
            style={{
              background: C.coralSoft,
              border: `1.5px solid ${C.coralDk}`,
            }}
          >
            <Label color={C.coralDk}>new secret · shown once</Label>
            <p
              className="mt-2 font-display italic text-lg leading-snug"
              style={{ color: C.ink }}
            >
              Copy this now. We don&rsquo;t show it again — if you lose it,
              rotate another.
            </p>
            <pre
              className="mt-3 px-3 py-2 font-mono text-[12px] overflow-x-auto"
              style={{
                background: C.paper,
                border: `1.5px solid ${C.ink}`,
                color: C.ink,
              }}
            >
              {sp.new_secret}
            </pre>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <Label>your endpoint</Label>
            <pre
              className="mt-2 px-3 py-2 font-mono text-[12px] overflow-x-auto"
              style={{
                background: C.paperAlt,
                border: `1.5px solid ${C.hairline}`,
                color: C.ink,
              }}
            >
              {webhookUrl}
            </pre>
            <p className="mt-3 text-[14px]" style={{ color: C.inkSoft }}>
              Status:{" "}
              {hasSecret ? (
                <span style={{ color: C.green, fontWeight: 700 }}>
                  configured
                </span>
              ) : (
                <span style={{ color: C.inkMute, fontWeight: 700 }}>
                  no secret set — rotate to activate
                </span>
              )}
            </p>
          </div>

          <form action={rotateWebhookSecretAction}>
            <input type="hidden" name="slug" value={slug} />
            <button
              type="submit"
              className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
              style={{
                background: hasSecret ? "transparent" : C.ink,
                color: hasSecret ? C.ink : C.paper,
                border: `1.5px solid ${C.ink}`,
              }}
            >
              {hasSecret ? "rotate secret" : "generate secret"}
            </button>
          </form>
        </div>

        <div className="mt-10">
          <Label>last 10 webhook events</Label>
          {events.length === 0 ? (
            <p
              className="mt-2 font-display italic text-lg"
              style={{ color: C.inkMute }}
            >
              Nothing received yet.
            </p>
          ) : (
            <div
              className="mt-3"
              style={{ border: `1.5px solid ${C.ink}` }}
            >
              <div
                className="grid grid-cols-[auto_auto_auto_auto_1fr] gap-4 px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase"
                style={{
                  background: C.paperAlt,
                  color: C.inkMute,
                  borderBottom: `1.5px solid ${C.ink}`,
                }}
              >
                <span>when</span>
                <span>ok</span>
                <span>matched</span>
                <span>pending</span>
                <span>error</span>
              </div>
              {events.map((e, i) => (
                <div
                  key={e.id}
                  className="grid grid-cols-[auto_auto_auto_auto_1fr] gap-4 px-4 py-2 items-center"
                  style={{
                    background: i % 2 ? C.paper : C.paperAlt,
                    borderBottom:
                      i < events.length - 1
                        ? `1px solid ${C.ink}22`
                        : undefined,
                  }}
                >
                  <span
                    className="font-mono text-[10px] tracking-wider"
                    style={{ color: C.inkMute }}
                  >
                    {datetimeFmt.format(new Date(e.received_at))}
                  </span>
                  <span
                    className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                    style={{ color: e.ok ? C.green : C.danger }}
                  >
                    {e.ok ? "200" : "fail"}
                  </span>
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: C.inkSoft }}
                  >
                    {e.matched_count}
                  </span>
                  <span
                    className="font-mono text-[11px]"
                    style={{ color: C.inkSoft }}
                  >
                    {e.pending_count}
                  </span>
                  <span
                    className="font-mono text-[11px] truncate"
                    style={{ color: e.error ? C.danger : C.inkMute }}
                    title={e.error ?? ""}
                  >
                    {e.error ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
