"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

const LessonSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase-hyphen"),
  title: z.string().min(1),
  host_org_id: z.string().uuid(),
  length_min: z.coerce.number().int().min(1),
  format: z.enum([
    "text",
    "audio",
    "video",
    "video_plus_script",
    "audio_plus_drill",
    "video_plus_repo",
    "interactive",
  ]),
  tags: z.array(z.string()).default([]),
  hook: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  content_url: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  visibility: z
    .enum(["fign_network", "host_members_only", "public"])
    .default("fign_network"),
  status: z.enum(["draft", "published", "retired"]).default("published"),
});

function csv(v: FormDataEntryValue | null): string[] {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createLessonAction(formData: FormData) {
  const raw = {
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    title: String(formData.get("title") ?? "").trim(),
    host_org_id: String(formData.get("host_org_id") ?? ""),
    length_min: String(formData.get("length_min") ?? ""),
    format: String(formData.get("format") ?? "video"),
    tags: csv(formData.get("tags")),
    hook: (formData.get("hook") as string | null) || null,
    body: (formData.get("body") as string | null) || null,
    content_url: String(formData.get("content_url") ?? "").trim(),
    visibility: String(formData.get("visibility") ?? "fign_network"),
    status: String(formData.get("status") ?? "published"),
  };
  const parsed = LessonSchema.parse(raw);

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("lessons")
    .insert({
      slug: parsed.slug,
      title: parsed.title,
      host_org_id: parsed.host_org_id,
      length_min: parsed.length_min,
      format: parsed.format,
      tags: parsed.tags,
      hook: parsed.hook,
      body: parsed.body,
      content_url: parsed.content_url || null,
      visibility: parsed.visibility,
      status: parsed.status,
    })
    .select("id")
    .single();
  if (error) throw new Error(`lesson insert failed: ${error.message}`);
  redirect(`/admin/lessons/${data.id}`);
}
