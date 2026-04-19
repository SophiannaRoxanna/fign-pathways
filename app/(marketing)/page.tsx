"use client";

import { useState } from "react";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { Door } from "@/components/landing/Door";
import { EvidenceStrip } from "@/components/landing/EvidenceStrip";
import { OrgsStrip } from "@/components/landing/OrgsStrip";
import { DOORS, type DoorKey } from "@/lib/copy/landing";

export default function LandingPage() {
  const [openDoor, setOpenDoor] = useState<DoorKey | null>("woman");

  return (
    <div
      style={{ background: C.canvasDark, color: C.inkOnDark, minHeight: "100vh" }}
      className="w-full"
    >
      {/* Top bar */}
      <header
        className="px-6 md:px-12 py-5 flex items-center justify-between"
        style={{ borderBottom: `1.5px solid ${C.hairlineDark}` }}
      >
        <div className="flex items-center gap-4 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold">
          <span style={{ color: C.coral }}>FIGN</span>
          <span style={{ opacity: 0.4, color: C.inkOnDarkMute }}>·</span>
          <span style={{ color: C.inkOnDark }}>Females in Gaming Network</span>
          <span
            className="hidden md:inline font-mono text-[9px] tracking-widest"
            style={{ color: C.inkOnDarkMute }}
          >
            pan-African umbrella · est. 2025
          </span>
        </div>
        <div
          className="hidden md:flex items-center gap-6 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold"
          style={{ color: C.inkOnDarkMute }}
        >
          <span>Events</span>
          <span>Orgs</span>
          <span>Impact</span>
          <a href="/signin" style={{ color: C.coral }}>Log in →</a>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-16 pb-10 max-w-7xl mx-auto drift-0">
        <Label color={C.inkOnDarkMute}>the point</Label>
        <h1
          className="mt-4 font-display text-6xl md:text-[104px] leading-[0.92]"
          style={{ color: C.inkOnDark }}
        >
          Africa won&apos;t stay a <br />
          <em style={{ color: C.coral }}>consumer</em> of gaming.
        </h1>
        <p
          className="mt-6 text-lg md:text-xl max-w-3xl leading-relaxed"
          style={{ color: C.inkOnDarkMute }}
        >
          FIGN is the pan-African umbrella for women and girls in gaming — players,
          creators, leaders, singers, streamers, artists, organisers. We don&apos;t
          replace what works. We federate the orgs already doing the work, and help
          every woman find her own shape.
        </p>

        {/* Chips */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Label color={C.inkOnDarkMute}>pick your door:</Label>
          {DOORS.map((d) => (
            <button
              key={d.key}
              onClick={() => setOpenDoor(d.key)}
              className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2 cursor-pointer"
              style={{
                background: openDoor === d.key ? d.color : "transparent",
                color: openDoor === d.key ? C.inkOnDark : C.inkOnDark,
                border: `1.5px solid ${openDoor === d.key ? d.color : C.hairlineDark}`,
              }}
            >
              {d.number} · {d.kicker.split(" ").slice(-3).join(" ")}
            </button>
          ))}
        </div>
      </section>

      {/* Doors */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto space-y-4 drift-1">
        {DOORS.map((d) => (
          <Door
            key={d.key}
            door={d}
            isOpen={openDoor === d.key}
            onOpen={() => setOpenDoor(d.key)}
            onClose={() => setOpenDoor(null)}
          />
        ))}
      </section>

      <EvidenceStrip />
      <OrgsStrip />

      {/* Founder + contact */}
      <section className="mt-20 px-6 md:px-12 max-w-7xl mx-auto pb-20 drift-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-8">
            <Label color={C.inkOnDarkMute}>a note from the founder</Label>
            <blockquote
              className="mt-4 font-display text-2xl md:text-3xl italic leading-snug max-w-3xl"
              style={{ color: C.inkOnDark }}
            >
              &ldquo;Most platforms ask women to fit a career they already picked.
              FIGN does the opposite — we start with what she loves, show her where
              it lives in gaming, and hold her hand while she finds her path. And
              we do it alongside the women already doing the work, not in
              competition with them.&rdquo;
            </blockquote>
            <div
              className="mt-4 font-mono text-[11px] tracking-[0.2em] uppercase font-bold"
              style={{ color: C.coral }}
            >
              Sophia Nei · founder
            </div>
          </div>
          <div className="md:col-span-4">
            <Label color={C.inkOnDarkMute}>get in</Label>
            <div className="mt-3 space-y-2 text-sm" style={{ color: C.inkOnDark }}>
              <div>
                <span style={{ color: C.inkOnDarkMute }}>email ·</span> sophia@fign.org
              </div>
              <div>
                <span style={{ color: C.inkOnDarkMute }}>web ·</span> fign.org
              </div>
              <div>
                <span style={{ color: C.inkOnDarkMute }}>whatsapp ·</span> community link
                on fign.org
              </div>
            </div>
            <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${C.hairlineDark}` }}>
              <Label color={C.inkOnDarkMute}>part of the broader journey</Label>
              <a
                href="https://esports-combine.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-sm"
                style={{ color: C.inkOnDark }}
              >
                esports-combine.vercel.app →
                <span
                  className="block text-xs italic mt-1"
                  style={{ color: C.inkOnDarkMute }}
                >
                  where every woman on the competitor track also begins.
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer
        className="px-6 md:px-12 py-6 flex items-center justify-between font-mono text-[10px] tracking-[0.22em] uppercase font-semibold"
        style={{ borderTop: `1.5px solid ${C.hairlineDark}`, color: C.inkOnDarkMute }}
      >
        <span>FIGN · Females in Gaming Network · landing v2</span>
        <span>PLAY · CREATE · LEAD</span>
      </footer>
    </div>
  );
}
