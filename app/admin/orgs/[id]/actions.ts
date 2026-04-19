"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const UpdateSchema = z.object({
  id: z.string().uuid(),
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

export async function updateOrgAction(formData: FormData) {
  const raw = {
    id: String(formData.get("id") ?? ""),
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
  const parsed = UpdateSchema.parse(raw);

  const supabase = await getSupabaseServer();
  const { error } = await supabase
    .from("organisations")
    .update({
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
    .eq("id", parsed.id);
  if (error) throw new Error(`organisation update failed: ${error.message}`);

  revalidatePath(`/admin/orgs/${parsed.id}`);
  revalidatePath("/admin/orgs");
}

const InviteSchema = z.object({
  org_id: z.string().uuid(),
  email: z.string().email(),
});

export async function inviteOrgAdminAction(formData: FormData) {
  const parsed = InviteSchema.parse({
    org_id: String(formData.get("org_id") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });

  // members.id FKs auth.users, so we create (or find) the auth user first,
  // then ensure a members row exists.
  const admin = getSupabaseAdmin();

  const { data: existingMember } = await admin
    .from("members")
    .select("id")
    .eq("email", parsed.email)
    .maybeSingle();

  let memberId = existingMember?.id as string | undefined;

  if (!memberId) {
    // Invite by email — creates an auth.users row and dispatches a magic link.
    const { data: invite, error: invErr } =
      await admin.auth.admin.inviteUserByEmail(parsed.email);
    if (invErr || !invite?.user) {
      throw new Error(
        `invite failed: ${invErr?.message ?? "no user returned"}`,
      );
    }
    memberId = invite.user.id;
    const { error: insErr } = await admin
      .from("members")
      .upsert(
        { id: memberId, email: parsed.email },
        { onConflict: "id" },
      );
    if (insErr)
      throw new Error(`could not seed member row: ${insErr.message}`);
  }

  // First admin for this org = owner, everyone else = coordinator.
  const { count } = await admin
    .from("org_admins")
    .select("*", { count: "exact", head: true })
    .eq("org_id", parsed.org_id);

  const role = (count ?? 0) === 0 ? "owner" : "coordinator";

  const { error: linkErr } = await admin
    .from("org_admins")
    .upsert(
      { org_id: parsed.org_id, member_id: memberId, role },
      { onConflict: "org_id,member_id" },
    );
  if (linkErr)
    throw new Error(`org_admins link failed: ${linkErr.message}`);

  revalidatePath(`/admin/orgs/${parsed.org_id}`);
}

export async function gotoNewItemForOrg(formData: FormData) {
  const id = String(formData.get("org_id") ?? "");
  redirect(`/admin/items/new?host_org_id=${id}`);
}
