import React, { useState } from 'react';

// ============================================================================
// FIGN — The three-sided landing page.
// Three front doors: Woman · Member Organization · Partner
// The landing routes, it doesn't funnel.
// ============================================================================

const C = {
  paper:    '#f5ecdc',
  paperAlt: '#ece1cc',
  paperDk:  '#ddcfb4',
  ink:      '#1a1410',
  inkSoft:  '#4a3d30',
  inkMute:  '#8a7a68',
  coral:    '#c94a2a',
  green:    '#1f7a3f',
  blue:     '#2b5a8a',
  purple:   '#6b3a7a',
};

const DOORS = [
  {
    key: 'woman',
    number: 'I',
    kicker: 'for a woman finding her way',
    headline: 'I want to find my shape in gaming.',
    lede:
      "Whether you sing, compete, cosplay, stream, code, draw, write, or you're still figuring it out — FIGN connects you to the orgs, events, and women already doing it across Africa.",
    bullets: [
      'Pick interests · no forced career path',
      'See events from FIGN, Femmes aux Consoles, Bambina, Nexal, and others — in one place',
      'Find a mentor, a squad, a first gig, a scholarship',
      'Your growth tracked across every org you join',
    ],
    cta: 'Start exploring',
    subcta: '2 min · pick a few tags · no profile needed yet',
    color: C.coral,
  },
  {
    key: 'org',
    number: 'II',
    kicker: 'for a women-in-gaming organization',
    headline: 'I run an org. FIGN should amplify us, not absorb us.',
    lede:
      "You keep your brand, your programs, your members. FIGN gives you pan-African reach, a shared talent pool, and tools to run events without rebuilding them from scratch. Femmes aux Consoles and Bambina already operate this way.",
    bullets: [
      'Your page · your branding · your members',
      'Post events to the FIGN network · get qualified signups',
      'Shared toolkit: registrations, attendance, recap pages',
      'Your work counts toward FIGN-wide impact (and your own)',
    ],
    cta: 'Join the network',
    subcta: 'Free · reviewed by Sophia · onboarded in under a week',
    color: C.purple,
  },
  {
    key: 'partner',
    number: 'III',
    kicker: 'for a studio · event · sponsor',
    headline: 'I need qualified African women in gaming.',
    lede:
      "Studios hiring, tournaments filling slots, scholarships looking for recipients, sponsors funding impact. FIGN is a reach channel to an engaged, filtered audience across 7+ countries — Nexal, Juju Games, Garden City Esports, Daimyo Arena, Phygital Nigeria already work this way.",
    bullets: [
      'Post a tournament, gig, role, or scholarship',
      'Filter by country, interest, experience level',
      'Live impact page showing your attribution',
      'No transaction fees · no paywall for members',
    ],
    cta: 'Open a partner account',
    subcta: 'Quick call with Sophia · tier assigned based on fit',
    color: C.blue,
  },
];

const EVIDENCE = [
  { num: '7+', label: 'Countries live' },
  { num: '12',  label: 'Partners + member orgs' },
  { num: '640+',label: 'Event attendance' },
  { num: '300+',label: 'Launch event · Port Harcourt' },
  { num: '120+',label: 'Game Over GBV · youth' },
  { num: '64',  label: 'MK1 slots · May 8' },
];

const ORGS_STRIP = [
  'Femmes aux Consoles · CM',
  'Bambina',
  'Nexal Gaming',
  'Juju Games',
  'Garden City Esports',
  'Daimyo Arena',
  'Phygital Nigeria',
  'Gameverse',
  'IGDA Foundation',
  'Ingage.gg',
  'Alliance Française PH',
  'Renaissance Innov. Labs',
  'French Embassy, NG',
  'FutureSphere BIHub',
];

// ---------------------------------------------------------------------------
function Label({ children, color }) {
  return (
    <span
      className="font-mono text-[10px] tracking-[0.22em] uppercase font-semibold"
      style={{ color: color || C.inkMute }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
function Door({ door, isOpen, onOpen, onClose }) {
  return (
    <div
      className="relative transition-all"
      style={{
        background: isOpen ? door.color : C.paperAlt,
        color: isOpen ? C.paper : C.ink,
        border: `2px solid ${C.ink}`,
      }}
    >
      {/* Closed-door header (always visible) */}
      <button
        onClick={isOpen ? onClose : onOpen}
        className="w-full text-left p-6 md:p-8"
        style={{ color: 'inherit' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <span
              className="font-mono text-4xl italic leading-none"
              style={{
                color: isOpen ? C.paper : door.color,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
              }}
            >
              {door.number}
            </span>
            <div>
              <Label color={isOpen ? C.paper : C.inkMute}>{door.kicker}</Label>
              <h2
                className="mt-2 text-2xl md:text-3xl leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {door.headline}
              </h2>
            </div>
          </div>
          <span
            className="font-mono text-xs tracking-[0.2em] uppercase font-bold shrink-0 mt-2"
            style={{ opacity: 0.75 }}
          >
            {isOpen ? '— close' : 'open →'}
          </span>
        </div>
      </button>

      {/* Opened content */}
      {isOpen && (
        <div className="px-6 md:px-8 pb-8 -mt-2">
          <p className="text-[15px] md:text-base leading-relaxed max-w-2xl" style={{ opacity: 0.95 }}>
            {door.lede}
          </p>
          <ul className="mt-6 space-y-2">
            {door.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 text-sm md:text-[15px]" style={{ opacity: 0.95 }}>
                <span className="font-mono mt-0.5" style={{ color: C.paper, opacity: 0.55 }}>
                  ·
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button
              className="font-mono text-[11px] tracking-[0.2em] uppercase font-bold px-5 py-3"
              style={{ background: C.paper, color: door.color }}
            >
              {door.cta} →
            </button>
            <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: C.paper, opacity: 0.75 }}>
              {door.subcta}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function FIGNLanding() {
  const [openDoor, setOpenDoor] = useState('woman');

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        @keyframes drift { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .drift-0 { animation: drift .7s ease-out 0.00s both; }
        .drift-1 { animation: drift .7s ease-out 0.12s both; }
        .drift-2 { animation: drift .7s ease-out 0.24s both; }
        .drift-3 { animation: drift .7s ease-out 0.36s both; }
        .drift-4 { animation: drift .7s ease-out 0.48s both; }
      `}</style>

      {/* Top bar */}
      <header
        className="px-6 md:px-12 py-5 flex items-center justify-between"
        style={{ borderBottom: `1.5px solid ${C.ink}` }}
      >
        <div className="flex items-center gap-4 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold">
          <span style={{ color: C.coral }}>FIGN</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>Females in Gaming Network</span>
          <span className="hidden md:inline font-mono text-[9px] tracking-widest" style={{ color: C.inkMute }}>
            pan-African umbrella · est. 2025
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold" style={{ color: C.inkSoft }}>
          <span>Events</span>
          <span>Orgs</span>
          <span>Impact</span>
          <span>Log in →</span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 md:px-12 pt-16 pb-10 max-w-7xl mx-auto drift-0">
        <Label>the point</Label>
        <h1
          className="mt-4 text-6xl md:text-[104px] leading-[0.92]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Africa won't stay a <br />
          <em style={{ color: C.coral }}>consumer</em> of gaming.
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-3xl leading-relaxed" style={{ color: C.inkSoft }}>
          FIGN is the pan-African umbrella for women and girls in gaming — players, creators,
          leaders, singers, streamers, artists, organisers. We don't replace what works.
          We federate the orgs already doing the work, and help every woman find her own shape.
        </p>

        {/* Three chips */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Label>pick your door:</Label>
          {DOORS.map((d) => (
            <button
              key={d.key}
              onClick={() => setOpenDoor(d.key)}
              className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2"
              style={{
                background: openDoor === d.key ? d.color : 'transparent',
                color: openDoor === d.key ? C.paper : C.ink,
                border: `1.5px solid ${openDoor === d.key ? d.color : C.ink}`,
              }}
            >
              {d.number} · {d.kicker.split(' ').slice(-3).join(' ')}
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

      {/* Evidence strip */}
      <section className="mt-20 px-6 md:px-12 max-w-7xl mx-auto drift-2">
        <Label>not a pitch · the receipts</Label>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {EVIDENCE.map((e) => (
            <div key={e.label} className="p-4" style={{ background: C.ink, color: C.paper }}>
              <div
                className="text-4xl italic leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {e.num}
              </div>
              <div className="mt-3 font-mono text-[10px] tracking-[0.2em] uppercase font-bold" style={{ opacity: 0.9 }}>
                {e.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Federation strip — the orgs under the umbrella */}
      <section className="mt-16 px-6 md:px-12 max-w-7xl mx-auto drift-3">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <Label>who's already under the umbrella</Label>
            <h3
              className="mt-2 text-2xl md:text-3xl italic"
              style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Member organisations &amp; partners
            </h3>
          </div>
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase font-bold" style={{ color: C.coral }}>
            + your org →
          </span>
        </div>
        <div className="p-6" style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {ORGS_STRIP.map((name, i) => (
              <span key={i} className="text-sm md:text-[15px]" style={{ color: C.ink }}>
                <strong>{name}</strong>
                {i < ORGS_STRIP.length - 1 && <span style={{ color: C.inkMute }}> ·</span>}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm italic" style={{ color: C.inkSoft }}>
            Each member organisation keeps its own brand, programs, and members. FIGN gives them
            pan-African reach. Partners get a curated channel to women already engaged. Women get
            one map across everything.
          </p>
        </div>
      </section>

      {/* Founder line + contact */}
      <section className="mt-20 px-6 md:px-12 max-w-7xl mx-auto pb-20 drift-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-8">
            <Label>a note from the founder</Label>
            <blockquote
              className="mt-4 text-2xl md:text-3xl italic leading-snug max-w-3xl"
              style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              "Most platforms ask women to fit a career they already picked.
              FIGN does the opposite — we start with what she loves,
              show her where it lives in gaming,
              and hold her hand while she finds her path.
              And we do it alongside the women already doing the work,
              not in competition with them."
            </blockquote>
            <div className="mt-4 font-mono text-[11px] tracking-[0.2em] uppercase font-bold" style={{ color: C.coral }}>
              Sophia Nei · founder
            </div>
          </div>
          <div className="md:col-span-4">
            <Label>get in</Label>
            <div className="mt-3 space-y-2 text-sm" style={{ color: C.ink }}>
              <div><span style={{ color: C.inkMute }}>email ·</span> sophia@fign.org</div>
              <div><span style={{ color: C.inkMute }}>web ·</span> fign.org</div>
              <div><span style={{ color: C.inkMute }}>whatsapp ·</span> community link on fign.org</div>
            </div>
          </div>
        </div>
      </section>

      <footer
        className="px-6 md:px-12 py-6 flex items-center justify-between font-mono text-[10px] tracking-[0.22em] uppercase font-semibold"
        style={{ borderTop: `1.5px solid ${C.ink}`, color: C.inkSoft }}
      >
        <span>FIGN · Females in Gaming Network · landing v1</span>
        <span>PLAY · CREATE · LEAD</span>
      </footer>
    </div>
  );
}
