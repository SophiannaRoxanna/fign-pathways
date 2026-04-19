import { C } from "@/lib/design/tokens";
import { Label } from "./Label";

export function SectionHead({
  num,
  kicker,
  children,
  sub,
}: {
  num: string;
  kicker: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <Label>§ {num} · {kicker}</Label>
      <h2
        className="mt-2 font-display text-3xl md:text-4xl leading-[1.05]"
        style={{ color: C.ink }}
      >
        {children}
      </h2>
      {sub && (
        <p className="mt-2 max-w-2xl text-[15px]" style={{ color: C.inkSoft }}>
          {sub}
        </p>
      )}
    </div>
  );
}
