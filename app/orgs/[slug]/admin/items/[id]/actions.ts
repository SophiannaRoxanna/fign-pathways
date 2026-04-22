"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";

const ItemUpdateSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  host_org_id: z.string().uuid(),
  co_host_org_ids: z.array(z.string().uuid()).default([]),
  endorsed_org_ids: z.array(z.string().uuid()).default([]),
  kind: z.enum([
    "tournament",
    "workshop",
    "game_night",
    "stream_challenge",
    "hackathon",
    "school_tour",
    "opportunity",
    "scholarship",
    "mentor_call",
    "circle",
    "announcement",
  ]),
  title: z.string().min(1),
  hook: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  country: z
    .string()
    .length(2)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  city: z.string().optional().nullable(),
  language: z.enum(["en", "fr", "multi"]).default("en"),
  when_start: z.string().optional().nullable(),
  when_end: z.string().optional().nullable(),
  rolling: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  capacity: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v !== "" ? Number(v) : null)),
  registration_url: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  registration_preference: z
    .enum(["own_system", "fign_hosted", "either"])
    .default("either"),
  visibility: z
    .enum(["fign_network", "host_members_only", "public"])
    .default("fign_network"),
  external_ref: z.string().optional().nullable(),
});

function csv(v: FormDataEntryValue | null): string[] {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function updateItemAction(formData: FormData) {
  const raw = {
    id: String(formData.get("id") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    host_org_id: String(formData.get("host_org_id") ?? ""),
    co_host_org_ids: csv(formData.get("co_host_org_ids")),
    endorsed_org_ids: csv(formData.get("endorsed_org_ids")),
    kind: String(formData.get("kind") ?? "workshop"),
    title: String(formData.get("title") ?? "").trim(),
    hook: (formData.get("hook") as string | null) || null,
    body: (formData.get("body") as string | null) || null,
    country: String(formData.get("country") ?? "").trim().toUpperCase(),
    city: (formData.get("city") as string | null) || null,
    language: String(formData.get("language") ?? "en"),
    when_start: (formData.get("when_start") as string | null) || null,
    when_end: (formData.get("when_end") as string | null) || null,
    rolling: formData.get("rolling") === "1",
    tags: csv(formData.get("tags")),
    capacity: (formData.get("capacity") as string | null) || null,
    registration_url: String(formData.get("registration_url") ?? "").trim(),
    registration_preference: String(
      formData.get("registration_preference") ?? "either",
    ),
    visibility: String(formData.get("visibility") ?? "fign_network"),
    external_ref:
      String(formData.get("external_ref") ?? "").trim() || null,
  };
  const parsed = ItemUpdateSchema.parse(raw);
  const { org, isUmbrella } = await requireOrgAdmin(parsed.slug);
  if (parsed.host_org_id !== org.id && !isUmbrella) {
    throw new Error("host_org_id does not match admin scope");
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("items")
    .update({
      host_org_id: parsed.host_org_id,
      co_host_org_ids: parsed.co_host_org_ids,
      endorsed_org_ids: parsed.endorsed_org_ids,
      kind: parsed.kind,
      title: parsed.title,
      hook: parsed.hook,
      body: parsed.body,
      country: parsed.country || null,
      city: parsed.city,
      language: parsed.language,
      when_start: parsed.when_start
        ? new Date(parsed.when_start).toISOString()
        : null,
      when_end: parsed.when_end ? new Date(parsed.when_end).toISOString() : null,
      rolling: parsed.rolling,
      tags: parsed.tags,
      capacity: parsed.capacity,
      registration_url: parsed.registration_url || null,
      registration_preference: parsed.registration_preference,
      visibility: parsed.visibility,
      external_ref: parsed.external_ref,
    })
    .eq("id", parsed.id);
  if (error) throw new Error(`item update failed: ${error.message}`);

  revalidatePath(`/orgs/${parsed.slug}/admin/items/${parsed.id}`);
  revalidatePath(`/orgs/${parsed.slug}/admin/items`);
  revalidatePath(`/orgs/${parsed.slug}`);
}

const DeleteSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
});

export async function deleteItemAction(formData: FormData) {
  const parsed = DeleteSchema.parse({
    id: formData.get("id"),
    slug: formData.get("slug"),
  });
  const { org, isUmbrella } = await requireOrgAdmin(parsed.slug);

  const supabase = await getSupabaseServer();
  const { data: row } = await supabase
    .from("items")
    .select("host_org_id")
    .eq("id", parsed.id)
    .maybeSingle();
  if (!row) return;
  if ((row as { host_org_id: string }).host_org_id !== org.id && !isUmbrella) {
    throw new Error("cannot delete an item you don't host");
  }

  const { error } = await supabase.from("items").delete().eq("id", parsed.id);
  if (error) throw new Error(`item delete failed: ${error.message}`);

  revalidatePath(`/orgs/${parsed.slug}/admin/items`);
  revalidatePath(`/orgs/${parsed.slug}`);
  redirect(`/orgs/${parsed.slug}/admin/items`);
}
