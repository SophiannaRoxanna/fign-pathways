import Link from "next/link";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip } from "@/components/org/OrgChip";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Organisation } from "@/lib/supabase/types";

const followSchema = z.object({
  org_id: z.string().uuid(),
  op: z.enum(["follow", "unfollow"]),
});

async function toggleFollow(formData: FormData) {
  "use server";
  const parsed = followSchema.safeParse({
    org_id: formData.get("org_id"),
    op: formData.get("op"),
  });
  if (!parsed.success) return;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (parsed.data.op === "follow") {
    await supabase
      .from("follows")
      .insert({ member_id: user.id, org_id: parsed.data.org_id });
  } else {
    await supabase
      .from("follows")
      .delete()
      .eq("member_id", user.id)
      .eq("org_id", parsed.data.org_id);
  }
  revalidatePath("/orgs-follow");
}

export default async function OrgsFollowPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: orgsData } = await supabase
    .from("organisations")
    .select("*")
    .eq("public_page_enabled", true)
    .order("name");
  const orgs = (orgsData as Organisation[] | null) ?? [];

  const { data: followsData } = await supabase
    .from("follows")
    .select("org_id")
    .eq("member_id", user.id);
  const followed = new Set((followsData ?? []).map((r) => r.org_id as string));

  return (
    <div className="px-6 md:px-10 py-10 md:py-14 max-w-6xl mx-auto">
      <SectionHead
        num="03"
        kicker="Organisations · the federation"
        sub="Member orgs, chapters, partners. Follow any of them to see their items in your feed."
      >
        Pick the <em>houses</em> you want updates from.
      </SectionHead>

      {orgs.length === 0 ? (
        <div
          className="p-8 text-center"
          style={{ border: `1.5px dashed ${C.ink}55`, color: C.inkSoft }}
        >
          <p className="italic font-serif text-lg">No orgs published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((o) => {
            const isFollowing = followed.has(o.id);
            const bg = o.brand_color || C.ink;
            return (
              <article
                key={o.id}
                className="flex flex-col"
                style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
              >
                <div
                  className="h-2"
                  style={{ background: bg }}
                  aria-hidden="true"
                />
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <OrgChip
                      org={{
                        id: o.id,
                        slug: o.slug,
                        name: o.name,
                        short_name: o.short_name,
                        type: o.type,
                        brand_color: o.brand_color,
                      }}
                      size="md"
                    />
                    {o.country_code && (
                      <Label>{o.country_code}</Label>
                    )}
                  </div>
                  <h3
                    className="mt-3 font-serif italic text-xl leading-tight"
                    style={{ color: C.ink }}
                  >
                    {o.name}
                  </h3>
                  {o.tagline && (
                    <p className="mt-2 text-sm italic" style={{ color: C.inkSoft }}>
                      {o.tagline}
                    </p>
                  )}

                  <div className="mt-auto pt-4 flex items-center gap-2">
                    <form action={toggleFollow}>
                      <input type="hidden" name="org_id" value={o.id} />
                      <input
                        type="hidden"
                        name="op"
                        value={isFollowing ? "unfollow" : "follow"}
                      />
                      <button
                        type="submit"
                        className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
                        style={
                          isFollowing
                            ? {
                                color: C.ink,
                                border: `1.5px solid ${C.ink}`,
                              }
                            : { background: C.ink, color: C.paper }
                        }
                      >
                        {isFollowing ? "Following ✓" : "Follow →"}
                      </button>
                    </form>
                    <Link
                      href={`/orgs/${o.slug}`}
                      className="font-mono text-[11px] tracking-[0.14em] uppercase"
                      style={{ color: C.inkSoft }}
                    >
                      View page →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
