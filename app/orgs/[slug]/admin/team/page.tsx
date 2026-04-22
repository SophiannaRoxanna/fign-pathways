import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { Label } from "@/components/ui/Label";
import { inputStyle, PrimaryButton } from "@/components/admin/form";
import { requireOrgAdmin } from "@/lib/auth/requireOrgAdmin";
import {
  inviteTeamAdminAction,
  changeTeamRoleAction,
  removeTeamAdminAction,
} from "./actions";

type AdminRow = {
  role: "owner" | "coordinator" | "poster";
  added_at: string;
  members: {
    id: string;
    email: string | null;
    name: string | null;
    handle: string | null;
  } | null;
};

const dateFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default async function OrgAdminTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { org, role: myRole, isUmbrella, user } = await requireOrgAdmin(slug);
  const supabase = await getSupabaseServer();

  const { data: adminsRaw } = await supabase
    .from("org_admins")
    .select("role, added_at, members(id, email, name, handle)")
    .eq("org_id", org.id)
    .order("added_at");
  const admins = (adminsRaw ?? []) as unknown as AdminRow[];

  const canManage = isUmbrella || myRole === "owner" || myRole === "coordinator";

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/orgs/${slug}/admin`}
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          ← home
        </Link>
      </div>
      <SectionHead
        num="04"
        kicker="team"
        sub={
          <span>
            Coordinators can invite others and post items. Posters can post items
            only. Owner is <em>{org.short_name || org.name}</em>&rsquo;s primary
            contact — only umbrella can change owner.
          </span>
        }
      >
        Who can act for <em>{org.short_name || org.name}</em>.
      </SectionHead>

      <div style={{ border: `1.5px solid ${C.ink}` }}>
        <div
          className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] tracking-[0.2em] uppercase items-center"
          style={{
            background: C.paperAlt,
            color: C.inkMute,
            borderBottom: `1.5px solid ${C.ink}`,
          }}
        >
          <span>person</span>
          <span>role</span>
          <span>since</span>
          <span>change</span>
          <span>remove</span>
        </div>
        {admins.length === 0 ? (
          <div
            className="px-5 py-8 italic font-display text-lg text-center"
            style={{ color: C.inkMute }}
          >
            No admins yet. Invite someone below — the first joiner becomes owner.
          </div>
        ) : (
          admins.map((a, i) => {
            const isSelf = a.members?.id === user.id;
            const isOwner = a.role === "owner";
            const canEditThis = canManage && (!isOwner || isUmbrella);
            return (
              <div
                key={a.members?.id ?? i}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3"
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
                    {isSelf ? (
                      <span
                        className="ml-2 font-mono text-[10px] tracking-[0.2em] uppercase"
                        style={{ color: C.inkMute }}
                      >
                        (you)
                      </span>
                    ) : null}
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
                    background:
                      a.role === "owner"
                        ? C.coral
                        : a.role === "coordinator"
                          ? C.ink
                          : C.inkSoft,
                    padding: "3px 8px",
                  }}
                >
                  {a.role}
                </span>
                <span
                  className="font-mono text-[10px] tracking-wider"
                  style={{ color: C.inkMute }}
                >
                  {dateFmt.format(new Date(a.added_at))}
                </span>
                {canEditThis && a.members ? (
                  <form action={changeTeamRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="member_id" value={a.members.id} />
                    <select
                      name="role"
                      defaultValue={a.role}
                      style={{ ...inputStyle, padding: "4px 6px" }}
                      disabled={!isUmbrella && a.role === "owner"}
                    >
                      {isUmbrella ? <option value="owner">owner</option> : null}
                      <option value="coordinator">coordinator</option>
                      <option value="poster">poster</option>
                    </select>
                    <button
                      type="submit"
                      className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                      style={{ color: C.coralDk }}
                    >
                      set →
                    </button>
                  </form>
                ) : (
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: C.inkMute }}
                  >
                    —
                  </span>
                )}
                {canEditThis && a.members && !isSelf ? (
                  <form action={removeTeamAdminAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="member_id" value={a.members.id} />
                    <button
                      type="submit"
                      className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
                      style={{ color: C.danger }}
                    >
                      remove
                    </button>
                  </form>
                ) : (
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: C.inkMute }}
                  >
                    —
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {canManage ? (
        <form
          action={inviteTeamAdminAction}
          className="mt-8 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="slug" value={slug} />
          <div className="flex flex-col gap-1.5 flex-1 min-w-[260px]">
            <Label>invite by email</Label>
            <input
              name="email"
              type="email"
              required
              placeholder="maya@femmesauxconsoles.cm"
              style={inputStyle}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>role</Label>
            <select name="role" defaultValue="coordinator" style={inputStyle}>
              <option value="coordinator">coordinator</option>
              <option value="poster">poster</option>
            </select>
          </div>
          <PrimaryButton>send invite →</PrimaryButton>
        </form>
      ) : null}
    </div>
  );
}
