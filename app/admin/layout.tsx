import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";

// Admin shell. Umbrella-admin only — anyone else bounces to /map.
export default async function AdminLayout({
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
    .select("id, name, handle, is_umbrella_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!me || !me.is_umbrella_admin) redirect("/map");

  const initials =
    (me.name ?? "")
      .split(" ")
      .map((p: string) => p[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "SN";

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}>
      <header
        className="px-6 md:px-10 py-4 flex items-center justify-between"
        style={{ borderBottom: `1.5px solid ${C.ink}` }}
      >
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold"
            style={{ color: C.ink }}
          >
            <span style={{ color: C.coral }}>FIGN</span>
            <span style={{ opacity: 0.3 }}>·</span>
            <span>Admin desk</span>
          </Link>
          <nav
            className="hidden md:flex items-center gap-5 font-mono text-[11px] tracking-[0.18em] uppercase font-semibold"
            style={{ color: C.inkSoft }}
          >
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/orgs">Orgs</Link>
            <Link href="/admin/items">Items</Link>
            <Link href="/admin/lessons">Lessons</Link>
            <Link href="/admin/members">Members</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/map"
            className="hidden md:inline font-mono text-[10px] tracking-[0.2em] uppercase font-semibold"
            style={{ color: C.inkMute }}
          >
            back to map →
          </Link>
          <span
            className="w-8 h-8 flex items-center justify-center text-xs font-bold font-mono"
            style={{ background: C.ink, color: C.paper }}
            title={me.handle ?? me.name ?? ""}
          >
            {initials}
          </span>
        </div>
      </header>
      <main className="px-6 md:px-10 py-10 max-w-[1280px] mx-auto">
        {children}
      </main>
    </div>
  );
}
