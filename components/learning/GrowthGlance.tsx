import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";

type Snapshot = { as_of: string; lines: string[] };

const asOfFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  year: "numeric",
});

function formatAsOf(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return asOfFmt.format(d);
}

export function GrowthGlance({
  before,
  now,
}: {
  before: Snapshot | null;
  now: Snapshot | null;
}) {
  return (
    <section className="mt-20">
      <SectionHead
        num="04"
        kicker="A glance at your growth"
        sub="Private. Not on your profile. Just for you to feel what's changed."
      >
        Six months <em style={{ color: C.coral }}>ago</em>, and{" "}
        <em style={{ color: C.green }}>now</em>
      </SectionHead>

      {!before || !now ? (
        <div
          className="p-6 text-sm italic"
          style={{
            background: C.paperAlt,
            border: `1.5px solid ${C.ink}`,
            color: C.inkSoft,
          }}
        >
          Growth glance will appear as your trail grows.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="p-6"
              style={{
                background: C.paperAlt,
                border: `1.5px solid ${C.ink}`,
              }}
            >
              <div className="flex items-baseline justify-between mb-4">
                <Label>as of {formatAsOf(before.as_of)}</Label>
                <span
                  className="font-mono text-[10px] tracking-wider uppercase font-bold"
                  style={{ color: C.inkMute }}
                >
                  then
                </span>
              </div>
              <ul className="space-y-3">
                {before.lines.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[15px]"
                    style={{ color: C.inkSoft }}
                  >
                    <span
                      className="font-mono shrink-0"
                      style={{ color: C.inkMute }}
                    >
                      ·
                    </span>
                    <span className="font-display italic">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="p-6"
              style={{
                background: C.ink,
                color: C.paper,
                border: `1.5px solid ${C.ink}`,
              }}
            >
              <div className="flex items-baseline justify-between mb-4">
                <Label color={C.paper}>as of {formatAsOf(now.as_of)}</Label>
                <span
                  className="font-mono text-[10px] tracking-wider uppercase font-bold"
                  style={{ color: C.green }}
                >
                  now
                </span>
              </div>
              <ul className="space-y-3">
                {now.lines.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-[15px]">
                    <span
                      className="font-mono shrink-0"
                      style={{ color: C.green }}
                    >
                      ·
                    </span>
                    <span className="font-display italic">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p
            className="mt-4 text-xs italic text-center"
            style={{ color: C.inkMute }}
          >
            The &ldquo;then&rdquo; is generated from what you hadn&apos;t done
            yet. The &ldquo;now&rdquo; is generated from your trail +
            milestones.
          </p>
        </>
      )}
    </section>
  );
}
