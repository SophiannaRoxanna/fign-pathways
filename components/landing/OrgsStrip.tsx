import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { ORGS_STRIP } from "@/lib/copy/landing";

export function OrgsStrip() {
  return (
    <section className="mt-16 px-6 md:px-12 max-w-[1280px] mx-auto drift-3">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <Label>who&apos;s already under the umbrella</Label>
          <h3
            className="mt-2 font-serif text-2xl md:text-3xl italic"
            style={{ color: C.ink }}
          >
            Member organisations &amp; partners
          </h3>
        </div>
        <a
          href="mailto:sophia@fign.org?subject=FIGN%20Org%20Inquiry"
          className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold"
          style={{ color: C.coral }}
        >
          + your org →
        </a>
      </div>
      <div
        className="p-6"
        style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
      >
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {ORGS_STRIP.map((name, i) => (
            <span key={i} className="text-sm md:text-[15px]" style={{ color: C.ink }}>
              <strong>{name}</strong>
              {i < ORGS_STRIP.length - 1 && (
                <span style={{ color: C.inkMute }}> ·</span>
              )}
            </span>
          ))}
        </div>
        <p className="mt-5 text-sm italic" style={{ color: C.inkSoft }}>
          Each member organisation keeps its own brand, programs, and members. FIGN
          gives them pan-African reach. Partners get a curated channel to women
          already engaged. Women get one map across everything.
        </p>
      </div>
    </section>
  );
}
