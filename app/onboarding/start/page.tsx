import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingStartPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) redirect("/map");

  const [{ data: tags }, { data: orgs }] = await Promise.all([
    supabase
      .from("interest_tags")
      .select('slug, name_en, "group", color')
      .order("group"),
    supabase
      .from("organisations")
      .select("id, name, type, short_name")
      .in("type", ["member_org", "chapter", "umbrella"])
      .order("name"),
  ]);

  return (
    <OnboardingForm
      email={user.email ?? ""}
      tags={(tags ?? []) as Array<{ slug: string; name_en: string; group: string; color: string | null }>}
      orgs={(orgs ?? []) as Array<{ id: string; name: string; type: string; short_name: string | null }>}
    />
  );
}
