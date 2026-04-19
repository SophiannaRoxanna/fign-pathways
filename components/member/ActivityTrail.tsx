import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip, type OrgChipData } from "@/components/org/OrgChip";

export type ActivityRow = {
  id: string;
  what: string;
  host: OrgChipData;
  xp: number;
  kind_group: "doing" | "learning" | "reflection";
  created_at: string;
};

const trailFmt = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
});

export function ActivityTrail({ activities }: { activities: ActivityRow[] }) {
  return (
    <section className="mt-20 mb-20">
      <SectionHead
        num="08"
        kicker="Your trail · across every org"
        sub="Learning, doing, reflecting — one trail, many doors. Every host gets credit."
      >
        The <em style={{ color: C.coral }}>trail</em> behind you
      </SectionHead>

      {activities.length === 0 ? (
        <div
          className="p-6 text-sm italic"
          style={{
            background: C.paperAlt,
            border: `1.5px solid ${C.ink}`,
            color: C.inkSoft,
          }}
        >
          Your trail starts with your first lesson, event, or reflection.
        </div>
      ) : (
        <div
          className="p-6"
          style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
        >
          <ul className="space-y-4">
            {activities.map((a, i) => {
              const d = new Date(a.created_at);
              const date = Number.isNaN(d.getTime())
                ? ""
                : trailFmt.format(d);
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-5 pb-4"
                  style={{
                    borderBottom:
                      i < activities.length - 1
                        ? `1px solid ${C.ink}22`
                        : "none",
                  }}
                >
                  <div className="w-16 shrink-0">
                    <Label>{date}</Label>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[15px]" style={{ color: C.ink }}>
                        {a.what}
                      </span>
                      <OrgChip org={a.host} />
                      <span
                        className="font-mono text-[9px] tracking-wider uppercase"
                        style={{ color: C.inkMute }}
                      >
                        {a.kind_group}
                      </span>
                    </div>
                    <div
                      className="font-mono text-[10px] mt-1"
                      style={{ color: C.green }}
                    >
                      +{a.xp} XP
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
