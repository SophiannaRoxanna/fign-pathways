import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

// Supabase magic-link callback: exchanges the code and redirects onward.
// First-time users go to /onboarding/start; returning users go to /map (or `next`).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  // Open-redirect guard: only relative paths starting with "/" but NOT "//"
  // (protocol-relative URLs resolve to a foreign host in the browser).
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/map";

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?err=no_code`);
  }

  const supabase = await getSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/signin?err=${encodeURIComponent(error.message)}`,
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/signin?err=no_user`);

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.redirect(`${origin}/onboarding/start`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
