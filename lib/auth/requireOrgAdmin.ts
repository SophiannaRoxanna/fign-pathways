import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Organisation } from "@/lib/supabase/types";

export type OrgAdminRole = "owner" | "coordinator" | "poster";

export type OrgAdminContext = {
  user: { id: string; email?: string | null };
  org: Organisation;
  role: OrgAdminRole;
  isUmbrella: boolean;
};

// Gate for /orgs/[slug]/admin/* pages. Returns the user, the resolved org, and
// the caller's role. Redirects to /signin if signed-out; 404s when the org
// doesn't exist or the user isn't an org_admin (and isn't an umbrella admin).
//
// Wrapped in React `cache()` so the layout + page + nested components share
// one result per request — drops 4 Supabase queries per admin page load.
export const requireOrgAdmin = cache(async (slug: string): Promise<OrgAdminContext> => {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: orgData } = await supabase
    .from("organisations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const org = orgData as Organisation | null;
  if (!org) notFound();

  const { data: me } = await supabase
    .from("members")
    .select("is_umbrella_admin")
    .eq("id", user.id)
    .maybeSingle();
  const isUmbrella = !!me?.is_umbrella_admin;

  const { data: adminRow } = await supabase
    .from("org_admins")
    .select("role")
    .eq("member_id", user.id)
    .eq("org_id", org.id)
    .maybeSingle();

  if (!adminRow && !isUmbrella) notFound();

  const role = (adminRow?.role as OrgAdminRole | undefined) ?? "owner";
  return { user: { id: user.id, email: user.email }, org, role, isUmbrella };
});
