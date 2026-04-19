import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { ItemForm } from "@/components/admin/ItemForm";
import type { InterestTag, Item, Organisation } from "@/lib/supabase/types";
import { updateItemAction } from "./actions";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditItemPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const [{ data: item }, { data: orgs }, { data: tags }] = await Promise.all([
    supabase.from("items").select("*").eq("id", id).maybeSingle(),
    supabase.from("organisations").select("*").order("type").order("name"),
    supabase.from("interest_tags").select("slug, name_en").order("name_en"),
  ]);

  if (!item) notFound();
  const it = item as Item;

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
      <SectionHead num="02b" kicker="edit item">
        <em>{it.title}</em>
      </SectionHead>
      <ItemForm
        initial={it}
        orgs={(orgs ?? []) as Organisation[]}
        tags={(tags ?? []) as Pick<InterestTag, "slug" | "name_en">[]}
        action={updateItemAction}
        hiddenFields={{ id: it.id }}
        submitLabel="Save changes"
      />
    </div>
  );
}
