"use client";

import { useState } from "react";
import { C } from "@/lib/design/tokens";

export function PublicSkillsToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    const next = !enabled;
    setBusy(true);
    setEnabled(next);
    try {
      await fetch("/api/me/public-skills", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ is_public: next }),
      });
    } catch {
      setEnabled(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2 disabled:opacity-60"
      style={
        enabled
          ? { background: C.green, color: C.paper }
          : { color: C.ink, border: `1.5px solid ${C.ink}` }
      }
    >
      {enabled ? "Skills visible ✓" : "Show my skills publicly"}
    </button>
  );
}
