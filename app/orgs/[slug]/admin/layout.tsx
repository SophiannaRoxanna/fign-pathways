import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { Logo } from "@/components/ui/Logo";
import { OrgChip } from "@/components/org/OrgChip";
import { OrgAdminNav } from "@/components/admin/OrgAdminNav";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";

export default async function OrgAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { org, role, isUmbrella } = await requireOrgAdmin(slug);
  const displayRole = isUmbrella && role === "owner" ? "umbrella" : role;

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}>
      <header
        className="px-6 md:px-10 py-4 flex items-center justify-between"
        style={{ borderBottom: `1.5px solid ${C.ink}` }}
      >
        <div className="flex items-center gap-5 min-w-0">
          <Link
            href={`/orgs/${slug}/admin`}
            className="flex items-center gap-3 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold shrink-0"
            style={{ color: C.ink }}
            aria-label={`${org.name} — admin desk`}
          >
            <Logo height={28} priority />
            <span style={{ opacity: 0.3 }}>·</span>
            <span>Org admin</span>
          </Link>
          <span style={{ opacity: 0.3 }}>·</span>
          <OrgChip org={org} size="md" />
          <span
            className="font-mono text-[10px] tracking-[0.2em] uppercase font-semibold"
            style={{ color: C.inkMute }}
          >
            {displayRole}
          </span>
          <span style={{ opacity: 0.3 }}>·</span>
          <OrgAdminNav slug={slug} />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Link
            href={`/orgs/${slug}`}
            className="hidden md:inline font-mono text-[10px] tracking-[0.2em] uppercase font-semibold"
            style={{ color: C.inkMute }}
          >
            ← {org.short_name || org.name} public
          </Link>
        </div>
      </header>
      <main className="px-6 md:px-10 py-10 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
