import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import type { MemberSkill } from "@/lib/supabase/types";

export function SkillsBars({ skills }: { skills: MemberSkill[] }) {
  return (
    <section className="mt-20">
      <SectionHead
        num="05"
        kicker="Your skills · visible when you want them"
        sub="Each skill is backed by evidence — lessons you finished, activity you did, notes from people who watched you work."
      >
        What you can <em style={{ color: C.coral }}>actually do</em> now
      </SectionHead>

      {skills.length === 0 ? (
        <div
          className="p-6 text-sm italic"
          style={{
            background: C.paperAlt,
            border: `1.5px solid ${C.ink}`,
            color: C.inkSoft,
          }}
        >
          Your skills graph will fill as you complete lessons and activities.
        </div>
      ) : (
        <div
          className="p-6"
          style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
        >
          <ul className="space-y-4">
            {skills.map((s) => (
              <li
                key={s.id}
                className="grid grid-cols-12 gap-4 items-center"
              >
                <div className="col-span-12 md:col-span-4">
                  <div className="text-[15px]" style={{ color: C.ink }}>
                    {s.skill_name}
                  </div>
                  <div
                    className="font-mono text-[10px] tracking-wider"
                    style={{ color: C.inkMute }}
                  >
                    {s.evidence_summary ?? `${s.evidence_count} pieces of evidence`}
                  </div>
                </div>
                <div className="col-span-8 md:col-span-6">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className="h-3 flex-1"
                        style={{
                          background: n <= s.level ? C.coral : "transparent",
                          border: `1.5px solid ${C.ink}`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-4 md:col-span-2 text-right">
                  <Label>
                    {s.months_active}{" "}
                    {s.months_active === 1 ? "month" : "months"}
                  </Label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs italic" style={{ color: C.inkMute }}>
          Your profile shows only the skills you choose to make visible.
        </span>
        <span
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold"
          style={{ color: C.coral }}
        >
          See full graph on /learn →
        </span>
      </div>
    </section>
  );
}
