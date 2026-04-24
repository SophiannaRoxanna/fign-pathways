import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { importRegistrations } from "@/lib/registrations/import";

const BodySchema = z.object({
  external_item_ref: z.string().min(1).optional(),
  item_id: z.string().uuid().optional(),
  attendees: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional().nullable(),
        attended: z.boolean().optional(),
        verified: z.boolean().optional(),
      }),
    )
    .min(1),
});

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function verifySignature(
  secret: string,
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;
  const provided = signatureHeader.replace(/^sha256=/i, "").trim();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(provided, expected);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const admin = getSupabaseAdmin();

  const { data: orgData } = await admin
    .from("organisations")
    .select("id, webhook_secret")
    .eq("slug", slug)
    .maybeSingle();
  const org = orgData as { id: string; webhook_secret: string | null } | null;
  if (!org) return NextResponse.json({ error: "org not found" }, { status: 404 });
  if (!org.webhook_secret) {
    return NextResponse.json(
      { error: "webhook not configured; rotate secret in org settings" },
      { status: 409 },
    );
  }

  const rawBody = await req.text();
  const sig = req.headers.get("x-fign-signature");
  if (!verifySignature(org.webhook_secret, rawBody, sig)) {
    await admin.from("webhook_events").insert({
      org_id: org.id,
      ok: false,
      error: "invalid signature",
    });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let parsed;
  try {
    const json = JSON.parse(rawBody) as unknown;
    parsed = BodySchema.parse(json);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid json";
    await admin
      .from("webhook_events")
      .insert({ org_id: org.id, ok: false, error: msg.slice(0, 500) });
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Resolve item by either external_ref (scoped to this org) or direct id.
  let itemId: string | null = null;
  if (parsed.item_id) {
    const { data: item } = await admin
      .from("items")
      .select("id, host_org_id")
      .eq("id", parsed.item_id)
      .maybeSingle();
    if (!item || (item as { host_org_id: string }).host_org_id !== org.id) {
      await admin.from("webhook_events").insert({
        org_id: org.id,
        ok: false,
        error: "item_id does not belong to this org",
      });
      return NextResponse.json(
        { error: "item_id does not belong to this org" },
        { status: 404 },
      );
    }
    itemId = (item as { id: string }).id;
  } else if (parsed.external_item_ref) {
    const { data: item } = await admin
      .from("items")
      .select("id")
      .eq("host_org_id", org.id)
      .eq("external_ref", parsed.external_item_ref)
      .maybeSingle();
    if (!item) {
      await admin.from("webhook_events").insert({
        org_id: org.id,
        ok: false,
        error: `unknown external_item_ref: ${parsed.external_item_ref}`,
      });
      return NextResponse.json(
        {
          error: `unknown external_item_ref "${parsed.external_item_ref}". Set it on the item's admin page first.`,
        },
        { status: 404 },
      );
    }
    itemId = (item as { id: string }).id;
  } else {
    await admin.from("webhook_events").insert({
      org_id: org.id,
      ok: false,
      error: "missing item_id and external_item_ref",
    });
    return NextResponse.json(
      { error: "must include either item_id or external_item_ref" },
      { status: 400 },
    );
  }

  // No acting member for webhook path; verified stays false on rows marked
  // verified by the caller (member-level verification requires a known admin).
  // We still respect the `verified` flag as a source-of-truth from the org.
  let summary;
  try {
    summary = await importRegistrations({
      itemId,
      hostOrgId: org.id,
      rows: parsed.attendees.map((a) => ({
        email: a.email,
        name: a.name ?? undefined,
        attended: a.attended,
        verified: a.verified,
      })),
      source: "external_webhook",
      actingMemberId: org.id, // placeholder; verified_by is only set if row has verified=true
      sourcePayload: { external_item_ref: parsed.external_item_ref ?? null },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "import failed";
    await admin.from("webhook_events").insert({
      org_id: org.id,
      item_id: itemId,
      ok: false,
      error: msg.slice(0, 500),
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await admin.from("webhook_events").insert({
    org_id: org.id,
    item_id: itemId,
    ok: true,
    matched_count: summary.matched,
    pending_count: summary.pending,
  });

  return NextResponse.json({
    ok: true,
    item_id: itemId,
    matched: summary.matched,
    attended_marked: summary.attendedMarked,
    pending: summary.pending,
    skipped_duplicate: summary.skippedDuplicate,
  });
}
