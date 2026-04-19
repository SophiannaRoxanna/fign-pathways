"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

const OrgSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase-hyphen"),
  name: z.string().min(1),
  short_name: z.string().optional().nullable(),
  type: z.enum(["umbrella", "member_org", "partner", "chapter", "open"]),
  country_code: z
    .string()
    .length(2)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  language: z.enum(["en", "fr", "multi"]).default("en"),
  brand_color: z
    .string()
    .regex(/^#?[0-9a-fA-F]{6}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  logo_url: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  tagline: z.string().optional().nullable(),
  registration_pref: z.enum(["own_system", "fign_hosted", "either"]).default("either"),
  public_page_enabled: z.boolean().default(true),
});

function parseForm(formData: FormData) {
  const raw = {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    name: String(formData.get("name") ?? "").trim(),
    short_name: (formData.get("short_name") as string | null) || null,
    type: String(formData.get("type") ?? "member_org"),
    country_code: String(formData.get("country_code") ?? "")
      .trim()
      .toUpperCase(),
    language: String(formData.get("language") ?? "en"),
    brand_color: String(formData.get("brand_color") ?? "").trim(),
    logo_url: String(formData.get("logo_url") ?? "").trim(),
    tagline: (formData.get("tagline") as string | null) || null,
    registration_pref: String(formData.get("registration_pref") ?? "either"),
    public_page_enabled: formData.get("public_page_enabled") === "1",
  };
  return OrgSchema.parse(raw);
}

async function createOrg(formData: FormData) {
  const parsed = parseForm(formData);
  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("organisations")
    .insert({
      slug: parsed.slug,
      name: parsed.name,
      short_name: parsed.short_name,
      type: parsed.type,
      country_code: parsed.country_code || null,
      language: parsed.language,
      brand_color: parsed.brand_color || null,
      logo_url: parsed.logo_url || null,
      tagline: parsed.tagline,
      registration_pref: parsed.registration_pref,
      public_page_enabled: parsed.public_page_enabled,
    })
    .select("id")
    .single();
  if (error) throw new Error(`organisation insert failed: ${error.message}`);
  return data.id as string;
}

export async function createOrgAction(formData: FormData) {
  const id = await createOrg(formData);
  redirect(`/admin/orgs/${id}`);
}

// Phase-0 ship-criteria flow: save org, immediately hop into item-new
// with host preselected.
export async function createOrgAndNewItemAction(formData: FormData) {
  const id = await createOrg(formData);
  redirect(`/admin/items/new?host_org_id=${id}`);
}
