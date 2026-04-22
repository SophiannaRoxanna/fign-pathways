import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { ItemForm } from "@/components/admin/ItemForm";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";
import type { InterestTag, Organisation } from "@/lib/supabase/types";
import { createItemAction } from "./actions";

export default async function OrgAdminNewItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { org } = await requireOrgAdmin(slug);
  const supabase = await getSupabaseServer();

  const [{ data: orgs }, { data: tags }] = await Promise.all([
    supabase.from("organisations").select("*").order("type").order("name"),
    supabase.from("interest_tags").select("slug, name_en").order("name_en"),
  ]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/orgs/${slug}/admin/items`}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          ← items
        </Link>
      </div>
      <SectionHead
        num="02a"
        kicker="new item"
        sub={
          <span>
            Hosted by <em>{org.name}</em>. Co-host with partners and endorse peer orgs below.
          </span>
        }
      >
        Post an <em>item</em>.
      </SectionHead>
      <ItemForm
        orgs={(orgs ?? []) as Organisation[]}
        tags={(tags ?? []) as Pick<InterestTag, "slug" | "name_en">[]}
        action={createItemAction}
        preselectHostOrgId={org.id}
        hostLocked
        hiddenFields={{ slug }}
        submitLabel="Save & publish"
      />
    </div>
  );
}
