import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { ItemForm } from "@/components/admin/ItemForm";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { InterestTag, Organisation } from "@/lib/supabase/types";
import { createItemAction } from "./actions";

type PageProps = { searchParams: Promise<{ host_org_id?: string }> };

export default async function NewItemPage({ searchParams }: PageProps) {
  const { host_org_id } = await searchParams;
  const supabase = await getSupabaseServer();

  const [{ data: orgs }, { data: tags }] = await Promise.all([
    supabase.from("organisations").select("*").order("type").order("name"),
    supabase.from("interest_tags").select("slug, name_en").order("name_en"),
  ]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/items"
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          ← items
        </Link>
      </div>
      <SectionHead
        num="02a"
        kicker="new item"
        sub="Tournament, workshop, gig, scholarship, circle — anything that belongs in the feed."
      >
        Post an <em>item</em>.
      </SectionHead>
      <ItemForm
        orgs={(orgs ?? []) as Organisation[]}
        tags={(tags ?? []) as Pick<InterestTag, "slug" | "name_en">[]}
        action={createItemAction}
        preselectHostOrgId={host_org_id}
        submitLabel="Save & publish"
      />
    </div>
  );
}
