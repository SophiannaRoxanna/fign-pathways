"use client";

import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import type { DoorCopy, DoorId } from "@/lib/copy/doorOptions";

export type LessonDoneCompletion = {
  id: string;
  lesson_title: string;
  host_org_name: string;
};

type Props = {
  completion: LessonDoneCompletion | null;
  options: DoorCopy[];
  onClose: () => void;
  onPick: (door: DoorId, payload?: Record<string, unknown>) => Promise<void>;
};

export function LessonDoneModal({ completion, options, onClose, onPick }: Props) {
  if (!completion) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26, 20, 16, 0.75)" }}
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        style={{ background: C.paper, border: `2px solid ${C.ink}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-7 pt-7 pb-4"
          style={{ borderBottom: `1.5px solid ${C.ink}` }}
        >
          <div className="flex items-center justify-between">
            <Label>§ lesson complete</Label>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
              style={{ color: C.inkSoft }}
            >
              close →
            </button>
          </div>
          <h2
            className="mt-3 font-display text-3xl md:text-4xl leading-tight"
            style={{ color: C.ink }}
          >
            You finished{" "}
            <em style={{ color: C.coral }}>&ldquo;{completion.lesson_title}&rdquo;</em>.
          </h2>
          <p
            className="mt-3 text-[15px] max-w-xl"
            style={{ color: C.inkSoft }}
          >
            What you do with it is yours. Here are some doors — none of them
            required. Pick one, pick three, pick none. Your growth isn&apos;t a
            checklist.
          </p>
        </div>

        <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                void onPick(o.id);
              }}
              className="p-4 text-left transition-all hover:-translate-y-0.5"
              style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <Label color={o.color}>{o.kind}</Label>
                <span
                  className="font-mono text-[10px]"
                  style={{ color: C.inkMute }}
                >
                  {o.commitment}
                </span>
              </div>
              <div
                className="font-display italic"
                style={{ color: C.ink, fontSize: "17px" }}
              >
                {o.title}
              </div>
              <div
                className="mt-1.5 text-xs italic"
                style={{ color: C.inkSoft }}
              >
                {o.why}
              </div>
            </button>
          ))}
        </div>

        <div
          className="px-7 py-4 flex items-center justify-between"
          style={{ background: C.paperDk, borderTop: `1.5px solid ${C.ink}` }}
        >
          <span className="text-xs italic" style={{ color: C.inkSoft }}>
            Lesson logged to your trail · {completion.host_org_name} credit
            recorded.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-[11px] tracking-[0.2em] uppercase font-bold"
            style={{ color: C.ink }}
          >
            → Back to map
          </button>
        </div>
      </div>
    </div>
  );
}
