"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";

const NEW_SECRET_COOKIE = "fign-new-webhook-secret";

const SettingsSchema = z.object({
  id: z.string().uuid(),
  current_slug: z.string().min(1),
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

export async function updateOrgSettingsAction(formData: FormData) {
  const raw = {
    id: String(formData.get("id") ?? ""),
    current_slug: String(formData.get("current_slug") ?? ""),
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
  const parsed = SettingsSchema.parse(raw);

  const { org, isUmbrella } = await requireOrgAdmin(parsed.current_slug);
  if (parsed.id !== org.id) throw new Error("org id mismatch");

  // Non-umbrella admins cannot change slug or type.
  const slugToWrite = isUmbrella ? parsed.slug : org.slug;
  const typeToWrite = isUmbrella ? parsed.type : org.type;

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("organisations")
    .update({
      slug: slugToWrite,
      name: parsed.name,
      short_name: parsed.short_name,
      type: typeToWrite,
      country_code: parsed.country_code || null,
      language: parsed.language,
      brand_color: parsed.brand_color || null,
      logo_url: parsed.logo_url || null,
      tagline: parsed.tagline,
      registration_pref: parsed.registration_pref,
      public_page_enabled: parsed.public_page_enabled,
    })
    .eq("id", parsed.id);
  if (error) throw new Error(`organisation update failed: ${error.message}`);

  revalidatePath(`/orgs/${slugToWrite}/admin/settings`);
  revalidatePath(`/orgs/${slugToWrite}/admin`);
  revalidatePath(`/orgs/${slugToWrite}`);
  // If the slug changed (umbrella admin only), the URL the browser is on is
  // now stale. Always redirect to the canonical settings URL so refreshes work.
  if (slugToWrite !== parsed.current_slug) {
    redirect(`/orgs/${slugToWrite}/admin/settings`);
  }
}

const SlugOnly = z.object({ slug: z.string().min(1) });

export async function rotateWebhookSecretAction(formData: FormData) {
  const parsed = SlugOnly.parse({ slug: String(formData.get("slug") ?? "") });
  const { org, role, isUmbrella } = await requireOrgAdmin(parsed.slug);
  if (!isUmbrella && role !== "owner" && role !== "coordinator") {
    throw new Error("only owners and coordinators can rotate the webhook secret");
  }

  // 32 random bytes → 64 hex chars. Safe for HMAC-SHA256.
  const secret = crypto.randomBytes(32).toString("hex");

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("organisations")
    .update({ webhook_secret: secret })
    .eq("id", org.id);
  if (error) throw new Error(`rotate failed: ${error.message}`);

  // Surface the new secret once via a short-lived httpOnly cookie. Never put
  // the secret in the URL — that ends up in access logs, browser history, and
  // referrer headers. The settings page reads (and clears) the cookie on next
  // render. Cookie scope is the settings path only so it doesn't leak into
  // other admin pages.
  const cookieStore = await cookies();
  cookieStore.set(NEW_SECRET_COOKIE, secret, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 120,
    path: `/orgs/${parsed.slug}/admin/settings`,
  });

  revalidatePath(`/orgs/${parsed.slug}/admin/settings`);
  redirect(`/orgs/${parsed.slug}/admin/settings`);
}

// Server action invoked by the "I copied it" button on the settings page.
// Deletes the cookie so a refresh no longer shows the secret.
export async function dismissNewWebhookSecretAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  await requireOrgAdmin(slug); // gate
  const cookieStore = await cookies();
  cookieStore.delete({ name: NEW_SECRET_COOKIE, path: `/orgs/${slug}/admin/settings` });
  revalidatePath(`/orgs/${slug}/admin/settings`);
}
