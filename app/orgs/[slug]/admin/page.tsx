import Link from "next/link";
import { notFound } from "next/navigation";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Organisation } from "@/lib/supabase/types";

export default async function OrgAdminPlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await getSupabaseServer();

  const { data: orgData } = await supabase
    .from("organisations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  const org = orgData as Organisation | null;
  if (!org) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: admin } = await supabase
    .from("org_admins")
    .select("role")
    .eq("member_id", user.id)
    .eq("org_id", org.id)
    .maybeSingle();
  if (!admin) notFound();

  return (
    <div
      style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}
      className="px-6 md:px-10 py-14"
    >
      <div className="max-w-2xl mx-auto">
        <Label>§ org admin · phase 2</Label>
        <h1
          className="mt-3 font-serif italic text-4xl md:text-5xl leading-[1.05]"
          style={{ color: C.ink }}
        >
          Org admin coming in <em>Phase 2</em>.
        </h1>
        <p
          className="mt-5 font-serif italic text-xl leading-snug"
          style={{ color: C.inkSoft }}
        >
          For now, ask Sophia — she&rsquo;ll post items, add co-hosts, and wire
          up registrations for {org.name} by hand. The tooling lands soon.
        </p>
        <div className="mt-8">
          <Link
            href={`/orgs/${org.slug}`}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
            style={{ background: C.ink, color: C.paper }}
          >
            ← Back to {org.short_name || org.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
