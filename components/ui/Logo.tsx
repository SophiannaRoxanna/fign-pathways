import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Intrinsic height in px. Nav default 28. Hero ≥ 80. */
  height?: number;
  /** Wrap in a Link to the given href. Omit for non-linking contexts. */
  href?: string;
  /** LCP hint — set true only for the first paint-critical usage on a page. */
  priority?: boolean;
  className?: string;
};

// Pink-to-purple wordmark + heart mark, transparent background.
// Reads on both dark (canvasDark) and light (paper) surfaces.
export function Logo({ height = 28, href, priority, className }: Props) {
  const img = (
    <Image
      src="/fignlogo.png"
      alt="FIGN"
      // Source is square-ish; width auto-derived from aspect ratio.
      width={height}
      height={height}
      sizes={`${height}px`}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
  if (href) {
    return (
      <Link href={href} aria-label="FIGN home">
        {img}
      </Link>
    );
  }
  return img;
}
