"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { importRegistrations } from "@/lib/registrations/import";
import { parseAttendeeCsv } from "@/lib/registrations/csv";

async function siteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "fign-pathways.vercel.app";
  return `${proto}://${host}`;
}

const ImportSchema = z.object({
  slug: z.string().min(1),
  item_id: z.string().uuid(),
});

export async function importCsvAction(formData: FormData) {
  const parsed = ImportSchema.parse({
    slug: String(formData.get("slug") ?? ""),
    item_id: String(formData.get("item_id") ?? ""),
  });

  const { org, user, isUmbrella } = await requireOrgAdmin(parsed.slug);

  const admin = getSupabaseAdmin();
  const { data: item } = await admin
    .from("items")
    .select("host_org_id")
    .eq("id", parsed.item_id)
    .maybeSingle();
  if (!item) throw new Error("item not found");
  if ((item as { host_org_id: string }).host_org_id !== org.id && !isUmbrella) {
    throw new Error("not permitted");
  }

  let text = String(formData.get("csv_text") ?? "").trim();
  if (!text) {
    const file = formData.get("csv_file");
    if (file && file instanceof File && file.size > 0) {
      text = (await file.text()).trim();
    }
  }
  if (!text) {
    redirect(
      `/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations/import?err=${encodeURIComponent("Paste CSV text or upload a file.")}`,
    );
  }

  let rows;
  try {
    rows = parseAttendeeCsv(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "parse failed";
    redirect(
      `/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations/import?err=${encodeURIComponent(msg)}`,
    );
  }

  if (rows.length === 0) {
    redirect(
      `/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations/import?err=${encodeURIComponent("No email rows found in CSV.")}`,
    );
  }

  const summary = await importRegistrations({
    itemId: parsed.item_id,
    hostOrgId: org.id,
    rows,
    source: "csv_upload",
    actingMemberId: user.id,
  });

  revalidatePath(`/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations`);
  revalidatePath(`/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations/import`);
  redirect(
    `/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations/import?matched=${summary.matched}&attended=${summary.attendedMarked}&pending=${summary.pending}&skipped=${summary.skippedDuplicate}`,
  );
}

const ResolveSchema = z.object({
  slug: z.string().min(1),
  item_id: z.string().uuid(),
  pending_id: z.string().uuid(),
  action: z.enum(["invite", "dismiss"]),
});

export async function resolvePendingAction(formData: FormData) {
  const parsed = ResolveSchema.parse({
    slug: String(formData.get("slug") ?? ""),
    item_id: String(formData.get("item_id") ?? ""),
    pending_id: String(formData.get("pending_id") ?? ""),
    action: String(formData.get("action") ?? ""),
  });

  const { org, isUmbrella } = await requireOrgAdmin(parsed.slug);
  const admin = getSupabaseAdmin();

  const { data: pending } = await admin
    .from("pending_registrations")
    .select("id, host_org_id, item_id, email, name, attended")
    .eq("id", parsed.pending_id)
    .maybeSingle();
  if (!pending) return;
  const p = pending as {
    id: string;
    host_org_id: string;
    item_id: string;
    email: string;
    name: string | null;
    attended: boolean;
  };
  if (p.host_org_id !== org.id && !isUmbrella) {
    throw new Error("not permitted");
  }

  if (parsed.action === "dismiss") {
    await admin
      .from("pending_registrations")
      .update({ resolved_at: new Date().toISOString(), resolved_action: "dismissed" })
      .eq("id", p.id);
    revalidatePath(
      `/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations/import`,
    );
    return;
  }

  // Invite: create (or find) member, then upsert registration, record activity, mark resolved.
  const { data: existingMember } = await admin
    .from("members")
    .select("id")
    .eq("email", p.email)
    .maybeSingle();

  let memberId = existingMember?.id as string | undefined;
  if (!memberId) {
    const origin = await siteOrigin();
    const { data: invite, error: invErr } =
      await admin.auth.admin.inviteUserByEmail(p.email, {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
          "/onboarding/start",
        )}`,
      });
    if (invErr || !invite?.user) {
      throw new Error(`invite failed: ${invErr?.message ?? "no user returned"}`);
    }
    memberId = invite.user.id;
    const { error: insErr } = await admin
      .from("members")
      .upsert(
        { id: memberId, email: p.email, name: p.name ?? null },
        { onConflict: "id" },
      );
    if (insErr) throw new Error(`seed member failed: ${insErr.message}`);
  }

  await admin.from("item_registrations").upsert(
    {
      item_id: p.item_id,
      member_id: memberId,
      source: "csv_upload",
      status: "registered",
      attended: p.attended,
    },
    { onConflict: "item_id,member_id" },
  );

  if (p.attended) {
    const { data: itemRow } = await admin
      .from("items")
      .select("title")
      .eq("id", p.item_id)
      .maybeSingle();
    await admin.rpc("record_activity", {
      p_member: memberId,
      p_kind: "event_attended",
      p_host_org: p.host_org_id,
      p_payload: {
        title: (itemRow as { title: string } | null)?.title ?? "Event",
        related_entity_id: p.item_id,
        related_entity_type: "item",
      },
    });
  }

  await admin
    .from("pending_registrations")
    .update({ resolved_at: new Date().toISOString(), resolved_action: "invited" })
    .eq("id", p.id);

  revalidatePath(
    `/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations`,
  );
  revalidatePath(
    `/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations/import`,
  );
}
