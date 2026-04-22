import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { Rule } from "@/components/ui/Rule";
import { Label } from "@/components/ui/Label";
import { ItemForm } from "@/components/admin/ItemForm";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";
import type { InterestTag, Item, Organisation } from "@/lib/supabase/types";
import { updateItemAction, deleteItemAction } from "./actions";

type PageProps = { params: Promise<{ slug: string; id: string }> };

export default async function OrgAdminEditItemPage({ params }: PageProps) {
  const { slug, id } = await params;
  const { org, isUmbrella } = await requireOrgAdmin(slug);
  const supabase = await getSupabaseServer();

  const [{ data: item }, { data: orgs }, { data: tags }] = await Promise.all([
    supabase.from("items").select("*").eq("id", id).maybeSingle(),
    supabase.from("organisations").select("*").order("type").order("name"),
    supabase.from("interest_tags").select("slug, name_en").order("name_en"),
  ]);

  if (!item) notFound();
  const it = item as Item;
  if (it.host_org_id !== org.id && !isUmbrella) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href={`/orgs/${slug}/admin/items`}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          ← items
        </Link>
        <Link
          href={`/orgs/${slug}/admin/items/${id}/registrations`}
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold"
          style={{ color: C.coralDk }}
        >
          registrations →
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
        hiddenFields={{ id: it.id, slug }}
        hostLocked
        submitLabel="Save changes"
      />

      <div className="mt-16">
        <Rule />
        <div className="mt-6">
          <Label color={C.danger}>danger zone</Label>
          <form action={deleteItemAction} className="mt-3 flex items-center gap-4">
            <input type="hidden" name="id" value={it.id} />
            <input type="hidden" name="slug" value={slug} />
            <button
              type="submit"
              className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
              style={{
                background: "transparent",
                color: C.danger,
                border: `1.5px solid ${C.danger}`,
              }}
            >
              delete item
            </button>
            <span
              className="font-display italic text-[14px]"
              style={{ color: C.inkMute }}
            >
              registrations cascade.
            </span>
          </form>
        </div>
      </div>
    </div>
  );
}
