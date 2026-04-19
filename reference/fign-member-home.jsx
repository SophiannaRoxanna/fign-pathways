import React, { useState, useMemo } from 'react';

// ============================================================================
// FIGN · Member home v2
// Adds the learning layer:
//   - Skills Lab strip inline (2-3 matched micro-lessons)
//   - The "what next?" moment when a lesson finishes (see LessonDoneModal)
//   - Self-set milestones the member writes herself
//   - Narrative "six months ago / today" growth glance
// Attribution stays federation-first: every lesson carries its creator org.
// ============================================================================

const C = {
  paper:    '#f5ecdc',
  paperAlt: '#ece1cc',
  paperDk:  '#ddcfb4',
  ink:      '#1a1410',
  inkSoft:  '#4a3d30',
  inkMute:  '#8a7a68',
  coral:    '#c94a2a',
  coralDk:  '#8a2e14',
  green:    '#1f7a3f',
  greenLt:  '#e8f4ec',
  blue:     '#2b5a8a',
  purple:   '#6b3a7a',
  gold:     '#a67c1e',
};

// --- Host organizations (federation-first) ---------------------------------
const ORGS = {
  fign:       { key: 'fign',       name: 'FIGN',                kind: 'umbrella',    color: C.coral,  brand: 'FIGN' },
  fac:        { key: 'fac',        name: 'Femmes aux Consoles', kind: 'member org',  color: C.purple, brand: 'FAC' },
  bambina:    { key: 'bambina',    name: 'Bambina',             kind: 'member org',  color: C.purple, brand: 'Bambina' },
  nexal:      { key: 'nexal',      name: 'Nexal Gaming',        kind: 'partner',     color: C.blue,   brand: 'Nexal' },
  daimyo:     { key: 'daimyo',     name: 'Daimyo Arena',        kind: 'partner',     color: C.blue,   brand: 'Daimyo' },
  gardencity: { key: 'gardencity', name: 'Garden City Esports', kind: 'partner',     color: C.blue,   brand: 'GC Esports' },
  juju:       { key: 'juju',       name: 'Juju Games',          kind: 'partner',     color: C.blue,   brand: 'Juju Games' },
  ingage:     { key: 'ingage',     name: 'Ingage.gg',           kind: 'partner',     color: C.blue,   brand: 'Ingage' },
  opensource: { key: 'opensource', name: 'Open source',         kind: 'open',        color: C.gold,   brand: 'Open · CC-BY' },
};

// --- Member --------------------------------------------------------------
const ME = {
  name: 'Amara Okonkwo',
  handle: '@amara.plays',
  city: 'Port Harcourt',
  country: 'Nigeria',
  joined: 'Nov 2025',
  interests: ['fighting games', 'singing', 'streaming', 'cosplay'],
  description:
    "I compete in MK1, sing on weekends, and love dressing up as characters. Curious whether voice acting in games is a real career.",
  derivedTags: ['voice acting', 'MK1', 'fgc'],
  following: ['fac', 'nexal', 'daimyo'],

  // NEW: self-set milestones — she writes these herself, no templates
  milestones: [
    { text: "I'll know I've grown when I can cast an MK1 match without freezing up.",        set: 'Jan 12', progress: 0.55 },
    { text: "I'll know I've grown when I've recorded my first real voice-acting reel.",       set: 'Feb 02', progress: 0.20 },
    { text: "I'll know I've grown when I've helped someone else find her first gig.",         set: 'Feb 20', progress: 0.00 },
  ],

  // NEW: skills — extracted from her completed lessons + verified activities.
  // This feeds the skills-graph growth view.
  skills: [
    { name: 'MK1 fundamentals',       level: 3, from: '5 lessons · 8 matches', months: 4 },
    { name: 'Reading frame data',     level: 2, from: '2 lessons · coach note', months: 3 },
    { name: 'Cold-read a VO script',  level: 1, from: '1 lesson',             months: 1 },
    { name: 'Stream setup · OBS',     level: 2, from: '3 lessons · 2 streams', months: 2 },
    { name: 'Hosting a meetup',       level: 1, from: '1 event hosted',       months: 1 },
    { name: 'Cosplay sewing basics',  level: 1, from: 'self-declared',         months: 0 },
  ],

  activity: [
    { date: 'Feb 11', what: 'Scrim leader · 6 sessions',              host: 'fign',    xp: 60, kind: 'doing' },
    { date: 'Jan 24', what: 'Finished: "Reading the mini-map"',       host: 'ingage',  xp: 30, kind: 'learning' },
    { date: 'Jan 08', what: 'Welcomed 2 newcomers to Port Harcourt',   host: 'fign',    xp: 40, kind: 'doing' },
    { date: 'Dec 19', what: 'Wrote: "Finding my main"',                 host: 'fign',    xp: 30, kind: 'reflection' },
    { date: 'Dec 05', what: 'Competed · Game Over GBV',                host: 'nexal',   xp: 60, kind: 'doing' },
    { date: 'Nov 14', what: 'FIGN Launch Event · attended',             host: 'fign',    xp: 20, kind: 'doing' },
  ],

  // For the six-months-ago view
  sixMonthsAgo: {
    asOf: 'Nov 2025',
    snapshot: [
      "Had never competed in a tournament.",
      "Didn't know voice acting in games was a career.",
      "Had never welcomed a newcomer to anything.",
      "Couldn't name three African women in gaming.",
    ],
  },
  today: {
    asOf: 'Apr 2026',
    snapshot: [
      "Competed at Game Over GBV (120+ youth).",
      "Two voice-acting lessons done; audition reel in progress.",
      "Welcomed 2 newcomers; one came back and brought 3 more.",
      "On first-name basis with women in Jo'burg, Accra, Douala.",
    ],
  },
};

// --- Skills Lab library --------------------------------------------------
// Matched to her tags. Mix of FIGN-owned, partner, and open-source.
const LESSONS = [
  {
    id: 'vo-intro',
    title: 'Voice acting for games · intro',
    host: 'juju',
    length: '14 min',
    format: 'video + script',
    tags: ['voice acting', 'voiceover'],
    match: 'you asked about voice acting in your description',
    hook: "Cold-read a real script from Vodou: A Space Odyssey.",
  },
  {
    id: 'mk1-frames',
    title: 'Reading MK1 frame data under pressure',
    host: 'opensource',
    length: '12 min',
    format: 'interactive',
    tags: ['fighting games', 'MK1', 'fgc'],
    match: "you tagged fighting games + you're at stage 3 in MK1",
    hook: "Drill the frames until they feel like muscle memory.",
  },
  {
    id: 'cast-basics',
    title: 'Shoutcasting 101 · for newcomers',
    host: 'ingage',
    length: '28 min',
    format: 'video',
    tags: ['shoutcasting', 'streaming'],
    match: "you wrote one of your milestones is casting MK1",
    hook: "The three sentences every caster masters first.",
  },
];

// --- Feed items (events, opportunities) - unchanged from v1 --------------
const ITEMS = [
  {
    id: 'mk1-tourney', kind: 'tournament',
    title: 'Mortal Kombat 1 · Garden City Grand Champion',
    host: 'daimyo', coHosts: ['nexal'], endorsed: ['fign'],
    when: 'May 8, 2026', where: 'Port Harcourt, NG',
    tags: ['fighting games', 'MK1', 'fgc'],
    hook: '64 slots · ₦300,000 · registration on Daimyo',
    note: "Matches you: you play MK1 + PH local.",
    action: 'Register on Daimyo →', external: true,
  },
  {
    id: 'fac-voice', kind: 'workshop',
    title: 'Voice acting for games · cohort',
    host: 'fac', coHosts: [], endorsed: ['fign', 'bambina'],
    when: 'April 27, 2026 · 4 weeks', where: 'Online · French + English',
    tags: ['voice acting', 'game audio'],
    hook: '4-week cohort by Femmes aux Consoles · applications open',
    note: "Follows naturally from the VO intro lesson.",
    action: 'Apply to cohort →', external: false,
  },
  {
    id: 'juju-gig', kind: 'opportunity',
    title: 'Paid VO audition · Vodou: A Space Odyssey',
    host: 'juju', coHosts: [], endorsed: ['fign'],
    when: 'Open · rolling', where: 'Remote',
    tags: ['voice acting', 'voiceover', 'singing'],
    hook: 'Afro-fantasy title · paid · Sophia can introduce',
    note: "Your voice + singing + intro through Sophia.",
    action: 'Request intro →', external: false,
  },
];

const PEOPLE = [
  { name: 'Marie K.',  city: 'Douala, CM',     org: 'fac',     tags: ['voice acting'],          note: 'did VO for 2 indie games · FAC mentor' },
  { name: 'Ngozi V.',  city: 'Port Harcourt',  org: 'fign',    tags: ['MK1', 'singing'],        note: 'same city · wanna duo?' },
  { name: 'Thando M.', city: "Jo'burg, ZA",    org: 'fign',    tags: ['casting', 'streaming'], note: 'casting Phygital · could mentor' },
];

// ===========================================================================
// UI atoms
// ===========================================================================
function Label({ children, color }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.22em] uppercase font-semibold" style={{ color: color || C.inkMute }}>
      {children}
    </span>
  );
}

function OrgChip({ orgKey, size = 'sm' }) {
  const org = ORGS[orgKey];
  if (!org) return null;
  const px = size === 'sm' ? 'px-2 py-[2px]' : 'px-2.5 py-1';
  const fs = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  return (
    <span
      className={`inline-block font-mono ${fs} tracking-[0.12em] uppercase font-bold ${px}`}
      style={{ color: C.paper, background: org.color }}
      title={`${org.name} · ${org.kind}`}
    >
      {org.brand}
    </span>
  );
}

function SectionHead({ num, kicker, children, sub }) {
  return (
    <div className="mb-7">
      <Label>§ {num} · {kicker}</Label>
      <h2 className="mt-2 text-3xl md:text-4xl leading-[1.05]" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        {children}
      </h2>
      {sub && <p className="mt-2 max-w-2xl text-[15px]" style={{ color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

// ===========================================================================
// INTEREST MAP (unchanged)
// ===========================================================================
function InterestMap({ me }) {
  const W = 1100, H = 420;
  const cx = W / 2, cy = H / 2;
  const declared = me.interests;
  const derived  = me.derivedTags;
  const adjacent = ['lore', 'narrative design', 'shoutcasting', 'character design', 'FGC community'];

  const placeRing = (arr, r, startAngle = -Math.PI / 2) =>
    arr.map((t, i) => {
      const a = startAngle + (i / arr.length) * Math.PI * 2;
      return { tag: t, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });

  const decNodes = placeRing(declared, 120, -Math.PI / 2);
  const derNodes = placeRing(derived, 210, Math.PI / 6);
  const adjNodes = placeRing(adjacent, 295, Math.PI / 2.5);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" preserveAspectRatio="xMidYMid meet" style={{ minHeight: 420 }}>
      <defs>
        <pattern id="grid-paper-map" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke={C.ink} strokeOpacity="0.05" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={W} height={H} fill="url(#grid-paper-map)" />
      {[120, 210, 295].map((r) => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={C.ink} strokeOpacity="0.12" strokeDasharray="3 8" />)}
      {decNodes.map((n, i) => <line key={i} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={C.coral} strokeWidth="1.5" opacity="0.5" />)}
      {derNodes.map((n, i) => <line key={i} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={C.green} strokeWidth="1" opacity="0.35" strokeDasharray="2 3" />)}
      <circle cx={cx} cy={cy} r="42" fill={C.ink} />
      <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="18" fontStyle="italic" fill={C.paper}>you</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill={C.paper} letterSpacing="0.15em" opacity="0.75">
        {ME.name.split(' ')[0].toUpperCase()}
      </text>
      {decNodes.map((n) => (
        <g key={n.tag}>
          <rect x={n.x - 65} y={n.y - 16} width="130" height="32" fill={C.coral} stroke={C.ink} strokeWidth="1.5" />
          <text x={n.x} y={n.y + 5} textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontSize="16" fill={C.paper}>{n.tag}</text>
        </g>
      ))}
      {derNodes.map((n) => (
        <g key={n.tag}>
          <rect x={n.x - 65} y={n.y - 14} width="130" height="28" fill={C.paper} stroke={C.green} strokeWidth="1.5" />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontStyle="italic" fontSize="14" fill={C.green}>{n.tag}</text>
        </g>
      ))}
      {adjNodes.map((n) => (
        <g key={n.tag}>
          <rect x={n.x - 70} y={n.y - 13} width="140" height="26" fill="transparent" stroke={C.ink} strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />
          <text x={n.x} y={n.y + 4} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fill={C.inkSoft} letterSpacing="0.05em">+ {n.tag}</text>
        </g>
      ))}
    </svg>
  );
}

// ===========================================================================
// NEW: SKILLS LAB — inline section on the map home
// ===========================================================================
function SkillsLab({ lessons, onPick }) {
  return (
    <section className="mt-20">
      <SectionHead
        num="02"
        kicker="Skills Lab · short, matched lessons"
        sub="Inline here; the full library lives on /learn. Every lesson is attributed to its creator — FIGN, partners, member orgs, open source."
      >
        Learn <em style={{ color: C.coral }}>something small</em> today
      </SectionHead>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lessons.map((l) => (
          <div
            key={l.id}
            className="p-5 relative flex flex-col"
            style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <OrgChip orgKey={l.host} />
              <span className="font-mono text-[10px] tracking-wider" style={{ color: C.inkMute }}>
                {l.length} · {l.format}
              </span>
            </div>
            <h3 className="text-xl italic leading-tight" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {l.title}
            </h3>
            <div className="mt-2 text-sm" style={{ color: C.inkSoft }}>{l.hook}</div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {l.tags.map((t) => (
                <span key={t} className="font-mono text-[10px] tracking-wider px-2 py-0.5" style={{ color: C.ink, border: `1px solid ${C.ink}44` }}>
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-3 pt-3 text-xs italic" style={{ borderTop: `1px solid ${C.ink}22`, color: C.inkSoft }}>
              <span style={{ color: C.green, fontStyle: 'normal', fontWeight: 600 }}>Why this: </span>
              {l.match}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => onPick(l)}
                className="font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2"
                style={{ background: C.ink, color: C.paper }}
              >
                Start →
              </button>
              <button className="font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2" style={{ color: C.ink, border: `1.5px solid ${C.ink}` }}>
                Save
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: C.inkMute }}>
          · 42 more lessons matched to your map
        </span>
        <button className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: C.coral }}>
          Browse the full library · /learn →
        </button>
      </div>
    </section>
  );
}

// ===========================================================================
// NEW: LESSON-DONE MOMENT — "tailored options, no prescription"
// This is the design philosophy the user wrote: "each woman with a mind of
// their own." After a lesson, we OFFER options. She picks. Or she leaves.
// ===========================================================================
function LessonDoneModal({ lesson, onClose }) {
  if (!lesson) return null;

  // Tailored options based on lesson tags — each is a door, not a push.
  const options = [
    {
      kind: 'Make something',
      title: 'Record a 60-second cold read',
      why: 'Try it while the script is fresh',
      commitment: 'about 10 min',
      color: C.coral,
    },
    {
      kind: 'Reflect',
      title: 'Write 3 sentences: what surprised you?',
      why: 'Your words feed your growth trail',
      commitment: '2 min',
      color: C.ink,
    },
    {
      kind: 'Go further',
      title: "Apply to FAC's 4-week voice cohort",
      why: 'The natural next step, if you want it',
      commitment: 'application · 20 min',
      color: C.purple,
    },
    {
      kind: 'Take it live',
      title: 'Request intro to Juju Games VO audition',
      why: "Paid work, because you're already here",
      commitment: 'intro via Sophia',
      color: C.blue,
    },
    {
      kind: 'Bring someone',
      title: 'Tag a friend who might like this lesson',
      why: 'Growth compounds when shared',
      commitment: '30 sec',
      color: C.green,
    },
    {
      kind: 'Just bookmark it',
      title: 'Save it for when the moment is right',
      why: 'Rest is valid. Come back when ready.',
      commitment: 'one tap',
      color: C.inkMute,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26, 20, 16, 0.75)' }}
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        style={{ background: C.paper, border: `2px solid ${C.ink}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-7 pt-7 pb-4" style={{ borderBottom: `1.5px solid ${C.ink}` }}>
          <div className="flex items-center justify-between">
            <Label>§ lesson complete</Label>
            <button
              onClick={onClose}
              className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
              style={{ color: C.inkSoft }}
            >
              close →
            </button>
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl leading-tight" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            You finished <em style={{ color: C.coral }}>"{lesson.title}"</em>.
          </h2>
          <p className="mt-3 text-[15px] max-w-xl" style={{ color: C.inkSoft }}>
            What you do with it is yours. Here are some doors — none of them required.
            Pick one, pick three, pick none. Your growth isn't a checklist.
          </p>
        </div>

        <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((o, i) => (
            <button
              key={i}
              className="p-4 text-left transition-all hover:-translate-y-0.5"
              style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <Label color={o.color}>{o.kind}</Label>
                <span className="font-mono text-[10px]" style={{ color: C.inkMute }}>{o.commitment}</span>
              </div>
              <div className="text-[15px]" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '17px', fontStyle: 'italic' }}>
                {o.title}
              </div>
              <div className="mt-1.5 text-xs italic" style={{ color: C.inkSoft }}>
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
            Lesson logged to your trail · {lesson.host && ORGS[lesson.host]?.name} credit recorded.
          </span>
          <button
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

// ===========================================================================
// NEW: MILESTONES — she writes them herself. No templates.
// ===========================================================================
function MilestonesPanel({ milestones }) {
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
        {milestones.map((m, i) => (
          <div key={i} className="p-5 flex items-center gap-5" style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}>
            <div className="shrink-0">
              <Label>{String(i + 1).padStart(2, '0')} · set {m.set}</Label>
            </div>
            <div className="flex-1">
              <blockquote
                className="text-lg italic leading-snug"
                style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                "{m.text}"
              </blockquote>
              {/* Progress bar - honest, simple */}
              <div className="mt-3 relative h-2" style={{ background: C.paper, border: `1px solid ${C.ink}22` }}>
                <div
                  className="absolute inset-y-0 left-0"
                  style={{ width: `${m.progress * 100}%`, background: C.coral }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="font-mono text-[10px] tracking-wider" style={{ color: C.inkMute }}>
                  {Math.round(m.progress * 100)}% of the way there — by your own reckoning
                </span>
                <button className="font-mono text-[10px] tracking-wider uppercase font-bold" style={{ color: C.coral }}>
                  edit →
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          className="w-full p-5 text-left"
          style={{ background: 'transparent', border: `1.5px dashed ${C.ink}55`, color: C.inkSoft }}
        >
          <Label color={C.coral}>+ new milestone</Label>
          <div className="mt-1 text-sm italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '16px' }}>
            "I'll know I've grown when…"
          </div>
        </button>
      </div>
    </section>
  );
}

// ===========================================================================
// NEW: GROWTH GLANCE — the narrative "six months ago / today"
// ===========================================================================
function GrowthGlance({ before, now }) {
  return (
    <section className="mt-20">
      <SectionHead num="04" kicker="A glance at your growth" sub="Private. Not on your profile. Just for you to feel what's changed.">
        Six months <em style={{ color: C.coral }}>ago</em>, and <em style={{ color: C.green }}>now</em>
      </SectionHead>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6" style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}>
          <div className="flex items-baseline justify-between mb-4">
            <Label>as of {before.asOf}</Label>
            <span className="font-mono text-[10px] tracking-wider uppercase font-bold" style={{ color: C.inkMute }}>
              then
            </span>
          </div>
          <ul className="space-y-3">
            {before.snapshot.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px]" style={{ color: C.inkSoft }}>
                <span className="font-mono shrink-0" style={{ color: C.inkMute }}>·</span>
                <span className="italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6" style={{ background: C.ink, color: C.paper, border: `1.5px solid ${C.ink}` }}>
          <div className="flex items-baseline justify-between mb-4">
            <Label color={C.paper}>as of {now.asOf}</Label>
            <span className="font-mono text-[10px] tracking-wider uppercase font-bold" style={{ color: C.green }}>
              now
            </span>
          </div>
          <ul className="space-y-3">
            {now.snapshot.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px]">
                <span className="font-mono shrink-0" style={{ color: C.green }}>·</span>
                <span className="italic" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-4 text-xs italic text-center" style={{ color: C.inkMute }}>
        The "then" is generated from what you hadn't done yet. The "now" is generated from your trail + milestones.
      </p>
    </section>
  );
}

// ===========================================================================
// NEW: SKILLS GRAPH (compact, shown inline; fuller version lives on /learn)
// ===========================================================================
function SkillsBars({ skills }) {
  return (
    <section className="mt-20">
      <SectionHead num="05" kicker="Your skills · visible when you want them" sub="Each skill is backed by evidence — lessons you finished, activity you did, notes from people who watched you work.">
        What you can <em style={{ color: C.coral }}>actually do</em> now
      </SectionHead>

      <div className="p-6" style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}>
        <ul className="space-y-4">
          {skills.map((s, i) => (
            <li key={i} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-12 md:col-span-4">
                <div className="text-[15px]" style={{ color: C.ink }}>{s.name}</div>
                <div className="font-mono text-[10px] tracking-wider" style={{ color: C.inkMute }}>
                  {s.from}
                </div>
              </div>
              <div className="col-span-8 md:col-span-6">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="h-3 flex-1"
                      style={{
                        background: n <= s.level ? C.coral : 'transparent',
                        border: `1.5px solid ${C.ink}`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="col-span-4 md:col-span-2 text-right">
                <Label>{s.months} {s.months === 1 ? 'month' : 'months'}</Label>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs italic" style={{ color: C.inkMute }}>
          Your profile shows only the skills you choose to make visible.
        </span>
        <button className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold" style={{ color: C.coral }}>
          See full graph on /learn →
        </button>
      </div>
    </section>
  );
}

// ===========================================================================
// FEED + PEOPLE + TRAIL (kept from v1, condensed)
// ===========================================================================
function MatchedFeed({ items, me }) {
  return (
    <section className="mt-20">
      <SectionHead num="06" kicker="Matched to your map" sub="Events, workshops, gigs, circles — from FIGN, member orgs, and partners. Register where the host prefers.">
        What's <em style={{ color: C.coral }}>for you</em> right now
      </SectionHead>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const host = ORGS[item.host];
          return (
            <div key={item.id} className="p-6 relative" style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}>
              <div className="-mx-6 -mt-6 px-4 py-2 flex items-center justify-between" style={{ background: host.color, color: C.paper, borderBottom: `1.5px solid ${C.ink}` }}>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold">hosted by</span>
                  <span className="font-mono text-[11px] font-bold">{host.name}</span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-80">
                  {item.external ? "register on their site" : "register via FIGN"}
                </span>
              </div>
              <h3 className="mt-4 text-xl italic" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                {item.title}
              </h3>
              <div className="mt-1 text-sm" style={{ color: C.inkSoft }}>{item.hook}</div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div><Label>When</Label><div style={{ color: C.ink }}>{item.when}</div></div>
                <div><Label>Where</Label><div style={{ color: C.ink }}>{item.where}</div></div>
              </div>
              <div className="mt-3 pt-3 text-sm italic" style={{ borderTop: `1px solid ${C.ink}22`, color: C.inkSoft }}>
                <span style={{ color: C.green, fontStyle: 'normal', fontWeight: 600 }}>Why you: </span>{item.note}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2" style={{ background: C.ink, color: C.paper }}>
                  {item.action}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PeoplePanel({ people }) {
  return (
    <section className="mt-20">
      <SectionHead num="07" kicker="Women near your map" sub="Connected by what you love, not a recommendation algorithm.">
        You are <em style={{ color: C.coral }}>not alone</em>
      </SectionHead>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {people.map((p) => (
          <div key={p.name} className="p-5" style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-lg italic" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{p.name}</div>
                <Label>{p.city}</Label>
              </div>
              <OrgChip orgKey={p.org} />
            </div>
            <div className="text-sm italic mt-2" style={{ color: C.inkSoft }}>"{p.note}"</div>
            <button className="mt-3 font-mono text-[11px] tracking-[0.15em] uppercase font-bold" style={{ color: C.green }}>
              → Say hello
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivityTrail({ activity }) {
  return (
    <section className="mt-20 mb-20">
      <SectionHead num="08" kicker="Your trail · across every org" sub="Learning, doing, reflecting — one trail, many doors. Every host gets credit.">
        The <em style={{ color: C.coral }}>trail</em> behind you
      </SectionHead>
      <div className="p-6" style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}>
        <ul className="space-y-4">
          {activity.map((a, i) => (
            <li key={i} className="flex items-start gap-5 pb-4" style={{ borderBottom: i < activity.length - 1 ? `1px solid ${C.ink}22` : 'none' }}>
              <div className="w-16 shrink-0"><Label>{a.date}</Label></div>
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[15px]" style={{ color: C.ink }}>{a.what}</span>
                  <OrgChip orgKey={a.host} />
                  <span className="font-mono text-[9px] tracking-wider uppercase" style={{ color: C.inkMute }}>
                    {a.kind}
                  </span>
                </div>
                <div className="font-mono text-[10px] mt-1" style={{ color: C.green }}>+{a.xp} XP</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ===========================================================================
// MAIN
// ===========================================================================
export default function FIGNMemberHome() {
  const [doneLesson, setDoneLesson] = useState(null);

  // Simulates: she tapped "Start →" on a lesson. For the prototype we open
  // the post-lesson moment right away so you can see it.
  const simulateFinish = (lesson) => setDoneLesson(lesson);

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      `}</style>

      <header className="px-6 md:px-10 py-4 flex items-center justify-between" style={{ borderBottom: `1.5px solid ${C.ink}` }}>
        <div className="flex items-center gap-4 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold">
          <span style={{ color: C.coral }}>FIGN</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>Your map</span>
        </div>
        <div className="hidden md:flex items-center gap-6 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold" style={{ color: C.inkMute }}>
          <span style={{ color: C.ink, textDecoration: 'underline', textUnderlineOffset: 6 }}>Map</span>
          <span>/learn</span>
          <span>Events</span>
          <span>Orgs</span>
          <span>Trail</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center text-xs font-bold font-mono" style={{ background: C.coral, color: C.paper }}>AO</div>
          <span className="hidden md:inline font-mono text-[11px] tracking-wider" style={{ color: C.ink }}>{ME.handle}</span>
        </div>
      </header>

      <main className="px-6 md:px-10 py-10 max-w-7xl mx-auto">
        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          <div className="md:col-span-8">
            <Label>§ 01 · Your map · joined {ME.joined}</Label>
            <h1 className="mt-3 text-5xl md:text-7xl leading-[0.95]" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Hello, <em style={{ color: C.coral }}>{ME.name.split(' ')[0]}</em>.
            </h1>
            <p className="mt-5 text-base md:text-lg max-w-xl leading-relaxed" style={{ color: C.inkSoft }}>
              Your map is built from what you love + what you've done. Below:
              three short lessons matched to it, three milestones in your own words,
              and the six-month glance back.
            </p>
          </div>
          <div className="md:col-span-4">
            <Label>in your own words</Label>
            <blockquote className="mt-2 text-sm italic leading-relaxed p-4" style={{ color: C.ink, background: C.paperAlt, border: `1.5px solid ${C.ink}`, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '15px' }}>
              "{ME.description}"
            </blockquote>
          </div>
        </div>

        {/* Interest map */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <Label>your map · {ME.interests.length} picked · {ME.derivedTags.length} found in your words</Label>
            <button className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: C.green }}>
              + Add more interests
            </button>
          </div>
          <div className="p-4 md:p-8" style={{ background: C.paperAlt, border: `2px solid ${C.ink}` }}>
            <InterestMap me={ME} />
          </div>
        </div>

        <SkillsLab lessons={LESSONS} onPick={simulateFinish} />
        <MilestonesPanel milestones={ME.milestones} />
        <GrowthGlance before={ME.sixMonthsAgo} now={ME.today} />
        <SkillsBars skills={ME.skills} />
        <MatchedFeed items={ITEMS} me={ME} />
        <PeoplePanel people={PEOPLE} />
        <ActivityTrail activity={ME.activity} />
      </main>

      <footer className="px-6 md:px-10 py-6 flex items-center justify-between font-mono text-[10px] tracking-[0.22em] uppercase font-semibold" style={{ borderTop: `1.5px solid ${C.ink}`, color: C.inkSoft }}>
        <span>FIGN · member home · prototype v5</span>
        <span>a federation · not a funnel</span>
      </footer>

      {/* The "what next?" moment */}
      <LessonDoneModal lesson={doneLesson} onClose={() => setDoneLesson(null)} />
    </div>
  );
}
