import { C } from "@/lib/design/tokens";

export function Label({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="font-mono text-[10px] tracking-[0.22em] uppercase font-semibold"
      style={{ color: color ?? C.inkMute }}
    >
      {children}
    </span>
  );
}
