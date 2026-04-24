"use client";

import { C } from "@/lib/design/tokens";

type Props = {
  declared: string[];
  derived: string[];
  adjacent: string[];
  memberFirstName: string;
};

export function InterestMap({
  declared,
  derived,
  adjacent,
  memberFirstName,
}: Props) {
  const W = 1100;
  const H = 420;
  const cx = W / 2;
  const cy = H / 2;

  // Round to integer pixels: Math.cos / Math.sin are NOT bit-identical across
  // V8 implementations (Node SSR vs Chrome hydration), and IEEE 754 doesn't
  // require transcendental functions to be deterministic. Without rounding,
  // the SVG coordinate strings differ in their final digits between server
  // and client, triggering a hydration warning. Math.round IS deterministic.
  const placeRing = (arr: string[], r: number, startAngle: number) =>
    arr.map((t, i) => {
      const a = startAngle + (i / Math.max(arr.length, 1)) * Math.PI * 2;
      return {
        tag: t,
        x: Math.round(cx + Math.cos(a) * r),
        y: Math.round(cy + Math.sin(a) * r),
      };
    });

  const decNodes = placeRing(declared, 120, -Math.PI / 2);
  const derNodes = placeRing(derived, 210, Math.PI / 6);
  const adjNodes = placeRing(adjacent, 295, Math.PI / 2.5);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto overflow-visible"
      preserveAspectRatio="xMidYMid meet"
      style={{ minHeight: 420 }}
    >
      <defs>
        <pattern
          id="grid-paper-map"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 48 0 L 0 0 0 48"
            fill="none"
            stroke={C.ink}
            strokeOpacity="0.05"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#grid-paper-map)" />
      {[120, 210, 295].map((r) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={C.ink}
          strokeOpacity="0.12"
          strokeDasharray="3 8"
        />
      ))}
      {decNodes.map((n, i) => (
        <line
          key={`dec-line-${i}`}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke={C.coral}
          strokeWidth="1.5"
          opacity="0.5"
        />
      ))}
      {derNodes.map((n, i) => (
        <line
          key={`der-line-${i}`}
          x1={cx}
          y1={cy}
          x2={n.x}
          y2={n.y}
          stroke={C.green}
          strokeWidth="1"
          opacity="0.35"
          strokeDasharray="2 3"
        />
      ))}
      <circle cx={cx} cy={cy} r="42" fill={C.ink} />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="font-display"
        fontSize="18"
        fontStyle="italic"
        fill={C.paper}
      >
        you
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="9"
        fill={C.paper}
        letterSpacing="0.15em"
        opacity="0.75"
      >
        {memberFirstName.toUpperCase()}
      </text>
      {decNodes.map((n) => (
        <g key={`dec-${n.tag}`}>
          <rect
            x={n.x - 65}
            y={n.y - 16}
            width="130"
            height="32"
            fill={C.coral}
            stroke={C.ink}
            strokeWidth="1.5"
          />
          <text
            x={n.x}
            y={n.y + 5}
            textAnchor="middle"
            className="font-display"
            fontStyle="italic"
            fontSize="16"
            fill={C.paper}
          >
            {n.tag}
          </text>
        </g>
      ))}
      {derNodes.map((n) => (
        <g key={`der-${n.tag}`}>
          <rect
            x={n.x - 65}
            y={n.y - 14}
            width="130"
            height="28"
            fill={C.paper}
            stroke={C.green}
            strokeWidth="1.5"
          />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            className="font-display"
            fontStyle="italic"
            fontSize="14"
            fill={C.green}
          >
            {n.tag}
          </text>
        </g>
      ))}
      {adjNodes.map((n) => (
        <g key={`adj-${n.tag}`}>
          <rect
            x={n.x - 70}
            y={n.y - 13}
            width="140"
            height="26"
            fill="transparent"
            stroke={C.ink}
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.55"
          />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize="11"
            fill={C.inkSoft}
            letterSpacing="0.05em"
          >
            + {n.tag}
          </text>
        </g>
      ))}
    </svg>
  );
}
