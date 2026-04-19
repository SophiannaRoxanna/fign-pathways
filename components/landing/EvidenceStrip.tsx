import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { EVIDENCE } from "@/lib/copy/landing";

export function EvidenceStrip() {
  return (
    <section className="mt-20 px-6 md:px-12 max-w-7xl mx-auto drift-2">
      <Label color={C.inkOnDarkMute}>not a pitch · the receipts</Label>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {EVIDENCE.map((e) => (
          <div
            key={e.label}
            className="p-4"
            style={{
              background: C.surfaceDark,
              color: C.inkOnDark,
              border: `1.5px solid ${C.hairlineDark}`,
            }}
          >
            <div
              className="font-display text-4xl italic leading-none"
              style={{ color: C.coral }}
            >
              {e.num}
            </div>
            <div
              className="mt-3 font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
              style={{ color: C.inkOnDarkMute }}
            >
              {e.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
