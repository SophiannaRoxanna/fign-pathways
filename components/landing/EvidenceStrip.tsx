import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { EVIDENCE } from "@/lib/copy/landing";

export function EvidenceStrip() {
  return (
    <section className="mt-20 px-6 md:px-12 max-w-[1280px] mx-auto drift-2">
      <Label>not a pitch · the receipts</Label>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {EVIDENCE.map((e) => (
          <div
            key={e.label}
            className="p-4"
            style={{ background: C.ink, color: C.paper }}
          >
            <div className="font-serif text-4xl italic leading-none">{e.num}</div>
            <div
              className="mt-3 font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
              style={{ opacity: 0.9 }}
            >
              {e.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
