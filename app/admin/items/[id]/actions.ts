"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

const ItemUpdateSchema = z.object({
  id: z.string().uuid(),
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
  };
  const parsed = ItemUpdateSchema.parse(raw);

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
    })
    .eq("id", parsed.id);
  if (error) throw new Error(`item update failed: ${error.message}`);

  revalidatePath(`/admin/items/${parsed.id}`);
  revalidatePath("/admin/items");
}
