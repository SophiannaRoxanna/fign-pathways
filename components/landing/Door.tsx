"use client";

import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import type { Door as DoorType } from "@/lib/copy/landing";

type Props = {
  door: DoorType;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function Door({ door, isOpen, onOpen, onClose }: Props) {
  // Dark-theme landing: closed doors wear surfaceDark, opened doors fill with
  // their brand colour. Border steps from hairlineDark → door.color on open.
  return (
    <div
      className="relative transition-colors"
      style={{
        background: isOpen ? door.color : C.surfaceDark,
        color: C.inkOnDark,
        border: `2px solid ${isOpen ? door.color : C.hairlineDark}`,
      }}
    >
      <button
        onClick={isOpen ? onClose : onOpen}
        aria-expanded={isOpen}
        className="w-full text-left p-6 md:p-8 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4"
        style={{ color: "inherit", outlineColor: isOpen ? C.inkOnDark : door.color }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <span
              className="font-display text-4xl italic leading-none"
              style={{ color: isOpen ? C.inkOnDark : door.color }}
            >
              {door.number}
            </span>
            <div>
              <Label color={isOpen ? C.inkOnDark : C.inkOnDarkMute}>
                {door.kicker}
              </Label>
              <h2 className="mt-2 font-display text-2xl md:text-3xl leading-tight">
                {door.headline}
              </h2>
            </div>
          </div>
          <span
            className="font-mono text-xs tracking-[0.2em] uppercase font-bold shrink-0 mt-2"
            style={{ color: isOpen ? C.inkOnDark : C.inkOnDarkMute }}
          >
            {isOpen ? "— close" : "open →"}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="px-6 md:px-8 pb-8 -mt-2">
          <p
            className="text-[15px] md:text-base leading-relaxed max-w-2xl"
            style={{ opacity: 0.95 }}
          >
            {door.lede}
          </p>
          <ul className="mt-6 space-y-2">
            {door.bullets.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm md:text-[15px]"
                style={{ opacity: 0.95 }}
              >
                <span
                  className="font-mono mt-0.5"
                  style={{ color: C.inkOnDark, opacity: 0.55 }}
                >
                  ·
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <a
              href={door.href}
              className="font-mono text-[11px] tracking-[0.2em] uppercase font-bold px-5 py-3 inline-block transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: C.inkOnDark, color: door.color, outlineColor: C.inkOnDark }}
            >
              {door.cta} →
            </a>
            <span
              className="font-mono text-[10px] tracking-wider uppercase"
              style={{ color: C.inkOnDark, opacity: 0.75 }}
            >
              {door.subcta}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
