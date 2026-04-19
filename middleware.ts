import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Keeps the Supabase auth cookies fresh across SSR requests and redirects
// unauthenticated users away from protected surfaces.
export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // In environments without Supabase env vars (e.g. first local run before
  // .env.local is set up), let pages render so Sophia can still see the landing.
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(all) {
        all.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const isProtected =
    path.startsWith("/map") ||
    path.startsWith("/events") ||
    path.startsWith("/people") ||
    path.startsWith("/orgs-follow") ||
    path.startsWith("/me") ||
    path.startsWith("/lessons") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/admin");

  if (!user && isProtected) {
    const signin = req.nextUrl.clone();
    signin.pathname = "/signin";
    signin.searchParams.set("next", path);
    return NextResponse.redirect(signin);
  }

  // Already-authenticated users visiting /signin bounce to /map.
  if (user && path === "/signin") {
    const map = req.nextUrl.clone();
    map.pathname = "/map";
    return NextResponse.redirect(map);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
