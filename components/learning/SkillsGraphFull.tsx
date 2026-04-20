import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import type { MemberSkill } from "@/lib/supabase/types";

type Props = { skills: MemberSkill[] };

// Fuller version of SkillsBars: adds evidence text, months-active column,
// public/private visibility badge. No badges, no leaderboards — just receipts.
export function SkillsGraphFull({ skills }: Props) {
  return (
    <section className="mt-20 mb-20">
      <SectionHead
        num="04"
        kicker="Your skills graph · with evidence"
        sub="Each skill is a claim backed by real activity. You choose which are visible on your public profile."
      >
        What you can <em style={{ color: C.coral }}>actually do</em>
      </SectionHead>

      {skills.length === 0 ? (
        <div
          className="p-8 text-center"
          style={{ border: `1.5px dashed ${C.ink}55`, color: C.inkSoft }}
        >
          <p className="font-display italic text-lg">
            Finish a lesson, host an event, get an endorsement — your skills graph
            fills from real activity.
          </p>
        </div>
      ) : (
        <div
          className="p-6 overflow-x-auto"
          style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
        >
          <table className="w-full text-sm" style={{ minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
                <th className="text-left pb-3"><Label>Skill</Label></th>
                <th className="text-left pb-3 pl-4"><Label>Level</Label></th>
                <th className="text-left pb-3 pl-4"><Label>Evidence</Label></th>
                <th className="text-right pb-3 pl-4"><Label>Months</Label></th>
                <th className="text-right pb-3 pl-4"><Label>Visible</Label></th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s, i) => (
                <tr
                  key={s.id}
                  style={{
                    borderBottom:
                      i < skills.length - 1 ? `1px solid ${C.ink}22` : "none",
                  }}
                >
                  <td className="py-3" style={{ color: C.ink }}>
                    {s.skill_name}
                  </td>
                  <td className="py-3 pl-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className="h-3 w-5"
                          style={{
                            background: n <= s.level ? C.coral : "transparent",
                            border: `1.5px solid ${C.ink}`,
                          }}
                        />
                      ))}
                    </div>
                  </td>
                  <td
                    className="py-3 pl-4 font-mono text-[11px]"
                    style={{ color: C.inkSoft }}
                  >
                    {s.evidence_summary ?? `${s.evidence_count} entries`}
                  </td>
                  <td
                    className="py-3 pl-4 text-right font-mono text-[11px]"
                    style={{ color: C.inkMute }}
                  >
                    {s.months_active}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <span
                      className="font-mono text-[10px] tracking-wider uppercase font-bold px-2 py-0.5"
                      style={{
                        background: s.is_public ? C.green : "transparent",
                        color: s.is_public ? C.paper : C.inkMute,
                        border: s.is_public
                          ? "none"
                          : `1px solid ${C.ink}44`,
                      }}
                    >
                      {s.is_public ? "public" : "private"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs italic" style={{ color: C.inkMute }}>
        No badges. No leaderboards. Evidence is the receipt.
      </p>
    </section>
  );
}
