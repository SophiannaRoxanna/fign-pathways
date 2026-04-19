import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// DEV-ONLY bypass for the magic-link flow when Supabase's SMTP is rate-limited
// (free tier caps at ~2/hour). Mints a session for the umbrella admin without
// hitting the email gate.
//
// Guarded so it can never run in production. Delete this file before deploying
// or rely on NODE_ENV !== 'development' block.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const email =
    new URL(req.url).searchParams.get("email") ??
    process.env.UMBRELLA_ADMIN_EMAIL;
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Generate a magic-link token (doesn't actually send an email — the admin
  // API returns the raw token we can exchange server-side).
  const { data: linkData, error: genErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (genErr || !linkData?.properties?.hashed_token) {
    return NextResponse.json(
      {
        error: "generateLink failed",
        detail: genErr?.message ?? "no token returned",
      },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(all) {
          all.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: linkData.properties.hashed_token,
  });
  if (verifyErr) {
    return NextResponse.json(
      { error: "verifyOtp failed", detail: verifyErr.message },
      { status: 500 },
    );
  }

  // Let /auth/callback's logic decide onboarding vs /map by redirecting there.
  // We already have a session cookie at this point.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "no session after verify" }, { status: 500 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const origin = new URL(req.url).origin;
  return NextResponse.redirect(
    member ? `${origin}/map` : `${origin}/onboarding/start`,
  );
}
