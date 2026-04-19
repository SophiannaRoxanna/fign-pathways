import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import { OrgChip, type OrgChipData } from "@/components/org/OrgChip";

export type PeopleCard = {
  name: string;
  city: string | null;
  country: string | null;
  handle: string | null;
  org?: OrgChipData | null;
  matching_tags: string[];
};

function locationLine(p: PeopleCard) {
  const parts = [p.city, p.country].filter(Boolean);
  return parts.join(", ");
}

export function PeoplePanel({ people }: { people: PeopleCard[] }) {
  return (
    <section className="mt-20">
      <SectionHead
        num="07"
        kicker="Women near your map"
        sub="Connected by what you love, not a recommendation algorithm."
      >
        You are <em style={{ color: C.coral }}>not alone</em>
      </SectionHead>

      {people.length === 0 ? (
        <div
          className="p-6 text-sm italic"
          style={{
            background: C.paperAlt,
            border: `1.5px solid ${C.ink}`,
            color: C.inkSoft,
          }}
        >
          Members near your map will show up here as the network grows.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {people.map((p) => (
            <div
              key={p.handle ?? p.name}
              className="p-5"
              style={{
                background: C.paperAlt,
                border: `1.5px solid ${C.ink}`,
              }}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <div>
                  <div
                    className="font-serif text-lg italic"
                    style={{ color: C.ink }}
                  >
                    {p.name}
                  </div>
                  <Label>{locationLine(p) || "—"}</Label>
                </div>
                {p.org ? <OrgChip org={p.org} /> : null}
              </div>
              {p.matching_tags.length > 0 && (
                <div
                  className="text-sm italic mt-2"
                  style={{ color: C.inkSoft }}
                >
                  &ldquo;overlaps on {p.matching_tags.slice(0, 3).join(", ")}&rdquo;
                </div>
              )}
              <button
                type="button"
                className="mt-3 font-mono text-[11px] tracking-[0.15em] uppercase font-bold"
                style={{ color: C.green }}
              >
                → Say hello
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
