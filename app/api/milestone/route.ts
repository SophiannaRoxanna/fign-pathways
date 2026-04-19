import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

const schema = z.object({
  op: z.enum(["create", "update", "retire", "mark_met", "bump_progress"]),
  id: z.string().uuid().optional(),
  text: z.string().min(3).max(400).optional(),
  progress: z.number().min(0).max(1).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });

  const { op, id, text, progress } = parsed.data;

  if (op === "create") {
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
    const { data, error } = await supabase
      .from("milestones")
      .insert({ member_id: user.id, text })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ milestone: data });
  }

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (op === "update") {
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
    const { data, error } = await supabase
      .from("milestones")
      .update({ text, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("member_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ milestone: data });
  }

  if (op === "retire") {
    const { error } = await supabase
      .from("milestones")
      .update({ status: "retired" })
      .eq("id", id)
      .eq("member_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (op === "mark_met") {
    const { error } = await supabase
      .from("milestones")
      .update({ status: "met", progress: 1 })
      .eq("id", id)
      .eq("member_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (op === "bump_progress") {
    if (progress === undefined) {
      return NextResponse.json({ error: "progress required" }, { status: 400 });
    }
    const { error } = await supabase
      .from("milestones")
      .update({ progress })
      .eq("id", id)
      .eq("member_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown op" }, { status: 400 });
}
