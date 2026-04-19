import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

const schema = z.object({
  lesson_completion_id: z.string().uuid(),
  door: z.enum([
    "make_something",
    "reflect",
    "go_further",
    "take_it_live",
    "bring_someone",
    "bookmark",
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { data, error } = await supabase.rpc("log_lesson_option", {
    p_member: user.id,
    p_completion: parsed.data.lesson_completion_id,
    p_door: parsed.data.door,
    p_payload: parsed.data.payload ?? {},
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data });
}
