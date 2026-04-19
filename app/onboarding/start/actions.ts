"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(1).max(120),
  handle: z.string().min(2).max(40).regex(/^@?[a-zA-Z0-9._-]+$/),
  country: z.string().length(2),
  city: z.string().min(1).max(80),
  language_pref: z.enum(["en", "fr"]).default("en"),
  description: z.string().max(2000).optional(),
  declared_slugs: z.array(z.string()).default([]),
  first_milestone: z.string().max(400).optional(),
  primary_org_id: z.string().uuid().nullable().optional(),
});

export type OnboardFormInput = z.infer<typeof schema>;

export async function completeOnboarding(input: OnboardFormInput) {
  const parsed = schema.parse(input);
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not signed in");

  const handle = parsed.handle.startsWith("@") ? parsed.handle : `@${parsed.handle}`;

  const { error } = await supabase.rpc("onboard_member", {
    p_member: user.id,
    p_name: parsed.name,
    p_handle: handle,
    p_country: parsed.country,
    p_city: parsed.city,
    p_language_pref: parsed.language_pref,
    p_email: user.email ?? null,
    p_phone: null,
    p_description: parsed.description ?? null,
    p_declared_slugs: parsed.declared_slugs,
    p_first_milestone: parsed.first_milestone ?? null,
    p_primary_org: parsed.primary_org_id ?? null,
  });

  if (error) throw error;

  redirect("/map");
}

export async function extractTagsAction(text: string): Promise<string[]> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.rpc("extract_tags_simple", { p_text: text });
  return Array.isArray(data) ? data : [];
}
