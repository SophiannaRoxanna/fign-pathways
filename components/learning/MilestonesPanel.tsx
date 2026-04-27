"use client";

import { useState } from "react";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { SectionHead } from "@/components/ui/SectionHead";
import type { Milestone } from "@/lib/supabase/types";

const dateFmt = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
});

async function postMilestone(body: Record<string, unknown>) {
  const res = await fetch("/api/milestone", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("milestone request failed");
  return (await res.json()) as { milestone?: Milestone; ok?: boolean };
}

export function MilestonesPanel({ initial }: { initial: Milestone[] }) {
  const [milestones, setMilestones] = useState<Milestone[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [addingOpen, setAddingOpen] = useState(false);
  const [newText, setNewText] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (newText.trim().length < 3) return;
    setBusy(true);
    try {
      const { milestone } = await postMilestone({
        op: "create",
        text: newText.trim(),
      });
      if (milestone) setMilestones((prev) => [milestone, ...prev]);
      setNewText("");
      setAddingOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(id: string) {
    if (editText.trim().length < 3) return;
    setBusy(true);
    try {
      const { milestone } = await postMilestone({
        op: "update",
        id,
        text: editText.trim(),
      });
      if (milestone) {
        setMilestones((prev) =>
          prev.map((m) => (m.id === id ? milestone : m)),
        );
      }
      setEditingId(null);
      setEditText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-20">
      <SectionHead
        num="03"
        kicker="Milestones · in your own words"
        sub="You wrote these. Not us. The platform quietly tracks toward them. Edit any time."
      >
        What <em style={{ color: C.coral }}>you said</em> growth looks like
      </SectionHead>

      <div className="space-y-3">
        {milestones.map((m, i) => {
          const isEditing = editingId === m.id;
          const setLabel = dateFmt.format(new Date(m.set_at));
          return (
            <div
              key={m.id}
              className="p-5 flex items-start gap-5"
              style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
            >
              <div className="shrink-0 pt-1">
                <Label>
                  {String(i + 1).padStart(2, "0")} · set {setLabel}
                </Label>
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      className="w-full p-2 font-display italic text-lg"
                      style={{
                        background: C.paper,
                        border: `1.5px solid ${C.ink}`,
                        color: C.ink,
                      }}
                    />
                    <div className="mt-2 flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditText("");
                        }}
                        className="font-mono text-[10px] tracking-wider uppercase font-bold"
                        style={{ color: C.inkSoft }}
                      >
                        cancel
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleUpdate(m.id)}
                        className="font-mono text-[10px] tracking-wider uppercase font-bold px-3 py-1"
                        style={{ background: C.ink, color: C.paper }}
                      >
                        save →
                      </button>
                    </div>
                  </div>
                ) : (
                  <blockquote
                    className="font-display text-lg italic leading-snug"
                    style={{ color: C.ink }}
                  >
                    &ldquo;{m.text}&rdquo;
                  </blockquote>
                )}
                <div
                  role="progressbar"
                  aria-valuenow={Math.round(m.progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress on milestone: ${Math.round(m.progress * 100)}%`}
                  className="mt-3 relative h-2"
                  style={{
                    background: C.paper,
                    border: `1px solid ${C.ink}22`,
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: `${Math.round(m.progress * 100)}%`,
                      background: C.coral,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className="font-mono text-[10px] tracking-wider"
                    style={{ color: C.inkMute }}
                  >
                    {Math.round(m.progress * 100)}% of the way there — by your
                    own reckoning
                  </span>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(m.id);
                        setEditText(m.text);
                      }}
                      className="font-mono text-[10px] tracking-wider uppercase font-bold"
                      style={{ color: C.coral }}
                    >
                      edit →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {addingOpen ? (
          <div
            className="w-full p-5"
            style={{
              background: "transparent",
              border: `1.5px dashed ${C.ink}55`,
            }}
          >
            <Label color={C.coral}>+ new milestone</Label>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={3}
              placeholder="I'll know I've grown when…"
              className="w-full mt-2 p-2 font-display italic"
              style={{
                background: C.paper,
                border: `1.5px solid ${C.ink}`,
                color: C.ink,
                fontSize: "16px",
              }}
            />
            <div className="mt-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setAddingOpen(false);
                  setNewText("");
                }}
                className="font-mono text-[10px] tracking-wider uppercase font-bold"
                style={{ color: C.inkSoft }}
              >
                cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleCreate}
                className="font-mono text-[10px] tracking-wider uppercase font-bold px-3 py-1"
                style={{ background: C.ink, color: C.paper }}
              >
                save →
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingOpen(true)}
            className="w-full p-5 text-left"
            style={{
              background: "transparent",
              border: `1.5px dashed ${C.ink}55`,
              color: C.inkSoft,
            }}
          >
            <Label color={C.coral}>+ new milestone</Label>
            <div
              className="mt-1 font-display italic"
              style={{ fontSize: "16px" }}
            >
              &ldquo;I&apos;ll know I&apos;ve grown when…&rdquo;
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
