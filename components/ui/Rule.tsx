import { C } from "@/lib/design/tokens";

export function Rule({ opacity = 0.15 }: { opacity?: number }) {
  return <div className="h-px w-full" style={{ background: C.ink, opacity }} />;
}
