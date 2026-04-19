"use client";

import { useState } from "react";
import { C } from "@/lib/design/tokens";
import { inputStyle } from "./form";

// Lightweight multi-select for arrays of short values (tag slugs, org ids).
// Renders existing picks as toggleable chips + a hidden input carrying the
// comma-separated result for the server action to parse.
export function MultiSelect({
  name,
  options,
  initial = [],
  placeholder = "toggle to add",
  renderLabel,
  chipBgFor,
}: {
  name: string;
  options: { value: string; label: string }[];
  initial?: string[];
  placeholder?: string;
  renderLabel?: (v: string, label: string) => React.ReactNode;
  chipBgFor?: (value: string) => string;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set(initial));

  const toggle = (v: string) => {
    const next = new Set(picked);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setPicked(next);
  };

  return (
    <div>
      <input
        type="hidden"
        name={name}
        value={Array.from(picked).join(",")}
      />
      <div
        className="flex flex-wrap gap-1.5 p-2 min-h-[44px]"
        style={{
          background: C.paper,
          border: `1.5px solid ${C.ink}`,
        }}
      >
        {options.length === 0 ? (
          <span
            className="font-mono text-[10px]"
            style={{ color: C.inkMute, padding: 4 }}
          >
            {placeholder}
          </span>
        ) : (
          options.map((o) => {
            const isOn = picked.has(o.value);
            const bg = isOn ? (chipBgFor?.(o.value) ?? C.ink) : "transparent";
            const fg = isOn ? C.paper : C.ink;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className="font-mono text-[10px] tracking-[0.14em] uppercase font-bold"
                style={{
                  background: bg,
                  color: fg,
                  border: `1.5px solid ${isOn ? bg : C.ink}`,
                  padding: "3px 8px",
                }}
              >
                {renderLabel ? renderLabel(o.value, o.label) : o.label}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// Keep a matching style reference exported for parity.
export { inputStyle };
