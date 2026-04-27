"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { C } from "@/lib/design/tokens";
import {
  LessonDoneModal,
  type LessonDoneCompletion,
} from "@/components/learning/LessonDoneModal";
import type { DoorCopy, DoorId } from "@/lib/copy/doorOptions";

type Props = {
  lessonId: string;
  lessonTitle: string;
  hostName: string;
  options: DoorCopy[];
  pickPayloads: Partial<Record<DoorId, Record<string, unknown>>>;
};

export function LessonFinisher({
  lessonId,
  lessonTitle,
  hostName,
  options,
  pickPayloads,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [completion, setCompletion] = useState<LessonDoneCompletion | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  async function markDone() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/complete-lesson", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId }),
      });
      if (!res.ok) throw new Error("complete-lesson failed");
      const { completion: row } = (await res.json()) as {
        completion: { id: string; lesson_slug: string; host_org_id: string };
      };
      setCompletion({
        id: row.id,
        lesson_title: lessonTitle,
        host_org_name: hostName,
      });
    } catch (err) {
      console.error(err);
      setError("Couldn't save right now. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePick(door: DoorId) {
    if (!completion) return;
    const payload = pickPayloads[door];
    try {
      await fetch("/api/lesson-option", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lesson_completion_id: completion.id,
          door,
          ...(payload ? { payload } : {}),
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setCompletion(null);
      router.refresh();
    }
  }

  function handleClose() {
    setCompletion(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-2 items-start">
        <button
          type="button"
          onClick={markDone}
          disabled={busy}
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-4 py-2 disabled:opacity-60"
          style={{ background: C.ink, color: C.paper }}
        >
          {busy ? "saving..." : "I did this · mark as finished →"}
        </button>
        {error ? (
          <p
            role="alert"
            className="font-display italic text-[14px]"
            style={{ color: C.danger }}
          >
            {error}
          </p>
        ) : null}
      </div>
      <LessonDoneModal
        completion={completion}
        options={options}
        onClose={handleClose}
        onPick={handlePick}
      />
    </>
  );
}
