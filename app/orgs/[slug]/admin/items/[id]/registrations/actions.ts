"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";

const ToggleSchema = z.object({
  slug: z.string().min(1),
  item_id: z.string().uuid(),
  member_id: z.string().uuid(),
  next: z.enum(["0", "1"]),
});

async function assertOrgOwnsItem(slug: string, itemId: string) {
  const { org, user, isUmbrella } = await requireOrgAdmin(slug);
  const supabase = await getSupabaseServer();
  const { data: item } = await supabase
    .from("items")
    .select("host_org_id, kind, title, id")
    .eq("id", itemId)
    .maybeSingle();
  if (!item) throw new Error("item not found");
  const it = item as {
    id: string;
    host_org_id: string;
    kind: string;
    title: string;
  };
  if (it.host_org_id !== org.id && !isUmbrella) {
    throw new Error("not permitted to modify this item's registrations");
  }
  return { org, item: it, supabase, user };
}

export async function toggleAttendedAction(formData: FormData) {
  const parsed = ToggleSchema.parse({
    slug: String(formData.get("slug") ?? ""),
    item_id: String(formData.get("item_id") ?? ""),
    member_id: String(formData.get("member_id") ?? ""),
    next: String(formData.get("next") ?? "1"),
  });
  const nextAttended = parsed.next === "1";
  const { org, item, supabase } = await assertOrgOwnsItem(
    parsed.slug,
    parsed.item_id,
  );

  const { data: existing } = await supabase
    .from("item_registrations")
    .select("attended")
    .eq("item_id", parsed.item_id)
    .eq("member_id", parsed.member_id)
    .maybeSingle();
  if (!existing) throw new Error("registration not found");
  const wasAttended = !!(existing as { attended: boolean }).attended;

  const { error: updErr } = await supabase
    .from("item_registrations")
    .update({ attended: nextAttended })
    .eq("item_id", parsed.item_id)
    .eq("member_id", parsed.member_id);
  if (updErr) throw new Error(`attendance update failed: ${updErr.message}`);

  // On false → true transition, credit the member's trail under this org.
  if (!wasAttended && nextAttended) {
    const { error: rpcErr } = await supabase.rpc("record_activity", {
      p_member: parsed.member_id,
      p_kind: "event_attended",
      p_host_org: org.id,
      p_payload: {
        title: item.title,
        related_entity_id: parsed.item_id,
        related_entity_type: "item",
      },
    });
    if (rpcErr) throw new Error(`record_activity failed: ${rpcErr.message}`);
  }

  revalidatePath(
    `/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations`,
  );
  revalidatePath(`/orgs/${parsed.slug}/admin`);
}

export async function toggleVerifiedAction(formData: FormData) {
  const parsed = ToggleSchema.parse({
    slug: String(formData.get("slug") ?? ""),
    item_id: String(formData.get("item_id") ?? ""),
    member_id: String(formData.get("member_id") ?? ""),
    next: String(formData.get("next") ?? "1"),
  });
  const { supabase, user } = await assertOrgOwnsItem(
    parsed.slug,
    parsed.item_id,
  );

  const verifiedBy = parsed.next === "1" ? user.id : null;
  const { error } = await supabase
    .from("item_registrations")
    .update({ verified_by: verifiedBy })
    .eq("item_id", parsed.item_id)
    .eq("member_id", parsed.member_id);
  if (error) throw new Error(`verify update failed: ${error.message}`);

  revalidatePath(
    `/orgs/${parsed.slug}/admin/items/${parsed.item_id}/registrations`,
  );
}
