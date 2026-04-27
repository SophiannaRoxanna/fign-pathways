"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";

// Resolve the absolute base URL for invite redirects. NEXT_PUBLIC_SITE_URL
// wins when set; otherwise we rebuild it from the incoming request headers
// (works for Vercel preview URLs + localhost).
async function siteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "fign-pathways.vercel.app";
  return `${proto}://${host}`;
}

const InviteSchema = z.object({
  slug: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["coordinator", "poster"]).default("coordinator"),
});

export async function inviteTeamAdminAction(formData: FormData) {
  const parsed = InviteSchema.parse({
    slug: String(formData.get("slug") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    role: String(formData.get("role") ?? "coordinator"),
  });

  const { org, role: myRole, isUmbrella } = await requireOrgAdmin(parsed.slug);
  if (!isUmbrella && myRole !== "owner" && myRole !== "coordinator") {
    throw new Error("only owners and coordinators can invite team members");
  }

  const admin = getSupabaseAdmin();

  const { data: existingMember } = await admin
    .from("members")
    .select("id")
    .eq("email", parsed.email)
    .maybeSingle();

  let memberId = existingMember?.id as string | undefined;
  if (!memberId) {
    const origin = await siteOrigin();
    const { data: invite, error: invErr } =
      await admin.auth.admin.inviteUserByEmail(parsed.email, {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
          `/orgs/${parsed.slug}/admin`,
        )}`,
      });
    if (invErr || !invite?.user) {
      throw new Error(`invite failed: ${invErr?.message ?? "no user returned"}`);
    }
    memberId = invite.user.id;
    const { error: insErr } = await admin
      .from("members")
      .upsert({ id: memberId, email: parsed.email }, { onConflict: "id" });
    if (insErr) throw new Error(`could not seed member row: ${insErr.message}`);
  }

  // First admin of this org defaults to owner. Migration 0008 adds a partial
  // unique index `(org_id) where role='owner'` so concurrent invites can't
  // both win owner; if the index rejects us, fall back to the requested role.
  const { count } = await admin
    .from("org_admins")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id);
  const wantsOwner = (count ?? 0) === 0;
  const effectiveRole = wantsOwner ? "owner" : parsed.role;

  let { error: linkErr } = await admin
    .from("org_admins")
    .upsert(
      { org_id: org.id, member_id: memberId, role: effectiveRole },
      { onConflict: "org_id,member_id" },
    );

  // Postgres unique-violation = code 23505. The owner-uniqueness index trips
  // here when two invites race; retry as a coordinator.
  if (linkErr && wantsOwner && (linkErr as { code?: string }).code === "23505") {
    const retry = await admin
      .from("org_admins")
      .upsert(
        { org_id: org.id, member_id: memberId, role: parsed.role },
        { onConflict: "org_id,member_id" },
      );
    linkErr = retry.error;
  }
  if (linkErr) throw new Error(`team link failed: ${linkErr.message}`);

  revalidatePath(`/orgs/${parsed.slug}/admin/team`);
}

const ChangeRoleSchema = z.object({
  slug: z.string().min(1),
  member_id: z.string().uuid(),
  role: z.enum(["owner", "coordinator", "poster"]),
});

export async function changeTeamRoleAction(formData: FormData) {
  const parsed = ChangeRoleSchema.parse({
    slug: String(formData.get("slug") ?? ""),
    member_id: String(formData.get("member_id") ?? ""),
    role: String(formData.get("role") ?? ""),
  });

  const { org, role: myRole, isUmbrella } = await requireOrgAdmin(parsed.slug);
  if (!isUmbrella && myRole !== "owner" && myRole !== "coordinator") {
    throw new Error("not permitted");
  }
  if (parsed.role === "owner" && !isUmbrella) {
    throw new Error("only umbrella can assign owner");
  }

  const admin = getSupabaseAdmin();
  // Prevent demoting the last owner.
  if (!isUmbrella) {
    const { data: target } = await admin
      .from("org_admins")
      .select("role")
      .eq("org_id", org.id)
      .eq("member_id", parsed.member_id)
      .maybeSingle();
    if ((target as { role: string } | null)?.role === "owner") {
      throw new Error("only umbrella can modify the owner role");
    }
  }

  const { error } = await admin
    .from("org_admins")
    .update({ role: parsed.role })
    .eq("org_id", org.id)
    .eq("member_id", parsed.member_id);
  if (error) throw new Error(`role update failed: ${error.message}`);

  revalidatePath(`/orgs/${parsed.slug}/admin/team`);
}

const RemoveSchema = z.object({
  slug: z.string().min(1),
  member_id: z.string().uuid(),
});

export async function removeTeamAdminAction(formData: FormData) {
  const parsed = RemoveSchema.parse({
    slug: String(formData.get("slug") ?? ""),
    member_id: String(formData.get("member_id") ?? ""),
  });

  const { org, role: myRole, isUmbrella, user } = await requireOrgAdmin(
    parsed.slug,
  );
  if (!isUmbrella && myRole !== "owner" && myRole !== "coordinator") {
    throw new Error("not permitted");
  }
  if (parsed.member_id === user.id) {
    throw new Error("cannot remove yourself; contact umbrella");
  }

  const admin = getSupabaseAdmin();
  if (!isUmbrella) {
    const { data: target } = await admin
      .from("org_admins")
      .select("role")
      .eq("org_id", org.id)
      .eq("member_id", parsed.member_id)
      .maybeSingle();
    if ((target as { role: string } | null)?.role === "owner") {
      throw new Error("only umbrella can remove an owner");
    }
  }

  const { error } = await admin
    .from("org_admins")
    .delete()
    .eq("org_id", org.id)
    .eq("member_id", parsed.member_id);
  if (error) throw new Error(`remove failed: ${error.message}`);

  revalidatePath(`/orgs/${parsed.slug}/admin/team`);
}
