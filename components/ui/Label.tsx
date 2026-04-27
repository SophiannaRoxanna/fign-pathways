import { C } from "@/lib/design/tokens";

// Renders an HTML <label> when `htmlFor` is provided (so screen readers can
// associate it with an input), otherwise a <span> for non-form-control labels
// (section labels, badges, etc.).
export function Label({
  children,
  color,
  htmlFor,
}: {
  children: React.ReactNode;
  color?: string;
  htmlFor?: string;
}) {
  const className =
    "font-mono text-[10px] tracking-[0.22em] uppercase font-semibold";
  const style = { color: color ?? C.inkMute };
  if (htmlFor) {
    return (
      <label className={className} style={style} htmlFor={htmlFor}>
        {children}
      </label>
    );
  }
  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
}
