import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { Logo } from "@/components/ui/Logo";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data: me } = await supabase
    .from("members")
    .select("id, handle, name")
    .eq("id", user.id)
    .maybeSingle();

  if (!me) redirect("/onboarding/start");

  const initials =
    me.name
      ?.split(" ")
      .map((p: string) => p[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") ?? "??";

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}>
      <header
        className="px-6 md:px-10 py-4 flex items-center justify-between"
        style={{ borderBottom: `1.5px solid ${C.ink}` }}
      >
        <Link
          href="/map"
          className="flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold"
          style={{ color: C.ink }}
          aria-label="FIGN — your map"
        >
          <Logo height={28} priority />
          <span style={{ opacity: 0.3 }}>·</span>
          <span>Your map</span>
        </Link>
        <nav
          className="hidden md:flex items-center gap-6 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold"
          style={{ color: C.inkMute }}
        >
          <Link href="/map" style={{ color: C.ink }}>
            Map
          </Link>
          <Link href="/events">Events</Link>
          <Link href="/people">People</Link>
          <Link href="/orgs-follow">Orgs</Link>
          <Link href="/me">Trail</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/me"
            className="w-8 h-8 flex items-center justify-center text-xs font-bold font-mono"
            style={{ background: C.coral, color: C.paper }}
          >
            {initials}
          </Link>
          <span
            className="hidden md:inline font-mono text-[11px] tracking-wider"
            style={{ color: C.ink }}
          >
            {me.handle ?? ""}
          </span>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
