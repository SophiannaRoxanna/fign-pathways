import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { Label } from "@/components/ui/Label";
import { OrgChip } from "@/components/org/OrgChip";
import { OrgForm } from "@/components/admin/OrgForm";
import { inputStyle, PrimaryButton } from "@/components/admin/form";
import type { Organisation } from "@/lib/supabase/types";
import {
  gotoNewItemForOrg,
  inviteOrgAdminAction,
  updateOrgAction,
} from "./actions";

type PageProps = { params: Promise<{ id: string }> };

type OrgAdminRow = {
  role: string;
  added_at: string;
  members: { id: string; email: string | null; name: string | null; handle: string | null } | null;
};

export default async function EditOrgPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const { data: org } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!org) notFound();
  const o = org as Organisation;

  const { data: adminsRaw } = await supabase
    .from("org_admins")
    .select("role, added_at, members(id, email, name, handle)")
    .eq("org_id", id)
    .order("added_at");
  const admins = (adminsRaw ?? []) as unknown as OrgAdminRow[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/orgs"
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          ← organisations
        </Link>
        <div className="flex items-center gap-3">
          <OrgChip org={o} size="md" />
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase"
            style={{ color: C.inkMute }}
          >
            {o.type}
          </span>
        </div>
      </div>

      <SectionHead num="01b" kicker={o.slug}>
        <em>{o.name}</em>
      </SectionHead>

      <form action={gotoNewItemForOrg} className="mb-8">
        <input type="hidden" name="org_id" value={o.id} />
        <PrimaryButton>+ post an item as this org</PrimaryButton>
      </form>

      <OrgForm
        initial={o}
        action={updateOrgAction}
        hiddenFields={{ id: o.id }}
        submitLabel="Save changes"
      />

      <div className="mt-3" style={{ color: C.inkMute }}>
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
          org id · {o.id}
        </span>
      </div>

      {/* Admins panel */}
      <div className="mt-14">
        <Label>org admins</Label>
        <h3
          className="mt-2 font-display text-2xl italic"
          style={{ color: C.ink }}
        >
          Who can post for <em>{o.short_name ?? o.name}</em>?
        </h3>

        <div
          className="mt-5"
          style={{ border: `1.5px solid ${C.ink}` }}
        >
          {admins.length === 0 ? (
            <div
              className="px-5 py-6 italic font-display"
              style={{ color: C.inkMute }}
            >
              No admins yet. Invite someone below — the first person becomes
              owner.
            </div>
          ) : (
            admins.map((a, i) => (
              <div
                key={a.members?.id ?? i}
                className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3"
                style={{
                  background: i % 2 ? C.paper : C.paperAlt,
                  borderBottom:
                    i < admins.length - 1 ? `1px solid ${C.ink}22` : undefined,
                }}
              >
                <div>
                  <div
                    className="font-display text-[17px]"
                    style={{ color: C.ink }}
                  >
                    {a.members?.name ?? a.members?.handle ?? "—"}
                  </div>
                  <div
                    className="font-mono text-[11px]"
                    style={{ color: C.inkSoft }}
                  >
                    {a.members?.email ?? "(no email)"}
                  </div>
                </div>
                <span
                  className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
                  style={{
                    color: C.paper,
                    background: a.role === "owner" ? C.coral : C.ink,
                    padding: "3px 8px",
                  }}
                >
                  {a.role}
                </span>
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ color: C.inkMute }}
                >
                  {new Date(a.added_at).toLocaleDateString("en", {
                    timeZone: "UTC",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))
          )}
        </div>

        <form
          action={inviteOrgAdminAction}
          className="mt-6 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="org_id" value={o.id} />
          <div className="flex flex-col gap-1.5 flex-1 min-w-65">
            <Label>invite admin by email</Label>
            <input
              name="email"
              type="email"
              required
              placeholder="maya@femmesauxconsoles.cm"
              style={inputStyle}
            />
          </div>
          <PrimaryButton>send invite →</PrimaryButton>
        </form>
      </div>
    </div>
  );
}
