"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

const ToggleSchema = z.object({
  org_id: z.string().uuid(),
  org_slug: z.string().min(1),
  next: z.enum(["0", "1"]),
});

export async function toggleRosterVisibilityAction(formData: FormData) {
  const parsed = ToggleSchema.parse({
    org_id: String(formData.get("org_id") ?? ""),
    org_slug: String(formData.get("org_slug") ?? ""),
    next: String(formData.get("next") ?? "1"),
  });

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");

  const visible = parsed.next === "1";
  const { error } = await supabase.from("org_roster_visibility").upsert(
    {
      member_id: user.id,
      org_id: parsed.org_id,
      visible_in_public_roster: visible,
    },
    { onConflict: "member_id,org_id" },
  );
  if (error) throw new Error(`visibility update failed: ${error.message}`);

  revalidatePath("/me");
  revalidatePath(`/orgs/${parsed.org_slug}`);
}
