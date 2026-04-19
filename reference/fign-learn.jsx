import React, { useState, useMemo } from 'react';

// ============================================================================
// FIGN · /learn — the full Skills Lab
// Where she goes when she wants to learn intentionally (vs. the inline
// Skills Lab on her map home, which surfaces 3 matched lessons).
//
// Three pieces:
//   1. Browse — every lesson, filterable by interest / host / format / length
//   2. Curricula — ordered paths (like "Voice acting · from curiosity to reel")
//      that member orgs and FIGN authored together
//   3. Her skills graph — the fuller version of the bars on the map home
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
  blue:     '#2b5a8a',
  purple:   '#6b3a7a',
  gold:     '#a67c1e',
};

const ORGS = {
  fign:       { name: 'FIGN',                kind: 'umbrella',   color: C.coral,  brand: 'FIGN' },
  fac:        { name: 'Femmes aux Consoles', kind: 'member org', color: C.purple, brand: 'FAC' },
  bambina:    { name: 'Bambina',             kind: 'member org', color: C.purple, brand: 'Bambina' },
  nexal:      { name: 'Nexal Gaming',        kind: 'partner',    color: C.blue,   brand: 'Nexal' },
  juju:       { name: 'Juju Games',          kind: 'partner',    color: C.blue,   brand: 'Juju Games' },
  ingage:     { name: 'Ingage.gg',           kind: 'partner',    color: C.blue,   brand: 'Ingage' },
  igda:       { name: 'IGDA Foundation',     kind: 'partner',    color: C.blue,   brand: 'IGDA F.' },
  opensource: { name: 'Open source',         kind: 'open',       color: C.gold,   brand: 'Open · CC-BY' },
};

// --- Seed: the library (mix of FIGN-owned, partner-contributed, open-source)
const LESSONS = [
  { id: 'l1',  title: 'Voice acting for games · intro',              host: 'juju',       length: 14, format: 'video + script', tags: ['voice acting'],                 done: true  },
  { id: 'l2',  title: 'Cold-reading a script · practice',            host: 'fac',        length: 22, format: 'audio + drill',  tags: ['voice acting', 'voiceover'],    done: false },
  { id: 'l3',  title: 'Home voice booth on a budget',                host: 'opensource', length: 9,  format: 'text',           tags: ['voice acting', 'audio eng'],    done: false },
  { id: 'l4',  title: 'MK1 frame data under pressure',               host: 'opensource', length: 12, format: 'interactive',    tags: ['fighting games', 'MK1'],        done: true  },
  { id: 'l5',  title: 'Punish optimisation · MK1',                   host: 'fign',       length: 18, format: 'video',          tags: ['fighting games', 'MK1'],        done: false },
  { id: 'l6',  title: 'Mental game · losing without tilting',        host: 'fign',       length: 11, format: 'text + audio',   tags: ['fgc', 'mental game'],           done: false },
  { id: 'l7',  title: 'Shoutcasting 101',                            host: 'ingage',     length: 28, format: 'video',          tags: ['shoutcasting', 'streaming'],    done: false },
  { id: 'l8',  title: 'Reading a lobby · the three sentences',       host: 'ingage',     length: 14, format: 'audio',          tags: ['shoutcasting', 'commentary'],   done: false },
  { id: 'l9',  title: 'OBS for new streamers',                       host: 'opensource', length: 24, format: 'video',          tags: ['streaming'],                    done: true  },
  { id: 'l10', title: 'Unity · your first scene',                    host: 'igda',       length: 35, format: 'video + repo',   tags: ['game dev', 'unity'],            done: false },
  { id: 'l11', title: 'Godot · build a 2D platformer',               host: 'opensource', length: 42, format: 'video + repo',   tags: ['game dev', 'godot'],            done: false },
  { id: 'l12', title: 'Narrative design · the shape of a beat',      host: 'fign',       length: 20, format: 'text',           tags: ['narrative design', 'writing'],  done: false },
  { id: 'l13', title: 'Cosplay sewing · basic stitches',             host: 'bambina',    length: 16, format: 'video',          tags: ['cosplay'],                      done: false },
  { id: 'l14', title: 'Foam armour · starter pattern',               host: 'bambina',    length: 30, format: 'video',          tags: ['cosplay', 'character design'],  done: false },
  { id: 'l15', title: 'Hosting a play-night · the 2-hour run sheet', host: 'fign',       length: 15, format: 'text',           tags: ['community', 'event organising'], done: false },
  { id: 'l16', title: 'Digital safety · the essentials',             host: 'fign',       length: 12, format: 'video',          tags: ['safety'],                       done: true  },
  { id: 'l17', title: 'Welcoming newcomers · the first 10 minutes',  host: 'fign',       length: 8,  format: 'text',           tags: ['community'],                    done: false },
  { id: 'l18', title: 'Singing for games · the register difference', host: 'fac',        length: 18, format: 'audio',          tags: ['singing', 'voice acting'],       done: false },
];

// --- Curricula — ordered paths co-authored by FIGN + an org
const CURRICULA = [
  {
    id: 'cur-vo',
    title: 'Voice acting · from curiosity to reel',
    coAuthors: ['fac', 'fign'],
    lessons: ['l1', 'l18', 'l2', 'l3'],
    blurb: "Start curious, end with a 60-second reel. 4 lessons + 1 optional application.",
    tags: ['voice acting', 'singing'],
  },
  {
    id: 'cur-mk1',
    title: 'MK1 · from first match to ranked squad',
    coAuthors: ['fign', 'opensource'],
    lessons: ['l4', 'l5', 'l6'],
    blurb: "The three things you'll quietly regret not learning early.",
    tags: ['fighting games', 'MK1'],
  },
  {
    id: 'cur-host',
    title: 'Host your first play-night',
    coAuthors: ['fign'],
    lessons: ['l15', 'l17', 'l16'],
    blurb: "By the end: a run sheet, a welcome script, a safety checklist.",
    tags: ['community', 'event organising'],
  },
  {
    id: 'cur-dev',
    title: 'Make your first small game',
    coAuthors: ['igda', 'fign', 'opensource'],
    lessons: ['l10', 'l11', 'l12'],
    blurb: "Unity or Godot — pick one, ship something in a weekend.",
    tags: ['game dev', 'unity', 'godot'],
  },
];

const ME_SKILLS = [
  { name: 'MK1 fundamentals',       level: 3, from: '5 lessons · 8 matches',   months: 4 },
  { name: 'Reading frame data',     level: 2, from: '2 lessons · coach note',  months: 3 },
  { name: 'Cold-read a VO script',  level: 1, from: '1 lesson',                 months: 1 },
  { name: 'Stream setup · OBS',     level: 2, from: '3 lessons · 2 streams',   months: 2 },
  { name: 'Hosting a meetup',       level: 1, from: '1 event hosted',           months: 1 },
  { name: 'Cosplay sewing basics',  level: 1, from: 'self-declared',             months: 0 },
  { name: 'Digital safety',         level: 3, from: '1 lesson · 1 workshop',    months: 5 },
  { name: 'Welcoming newcomers',    level: 2, from: '2 newcomers welcomed',     months: 3 },
];

// -----------------------------------------------------------------------
function Label({ children, color }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.22em] uppercase font-semibold" style={{ color: color || C.inkMute }}>
      {children}
    </span>
  );
}

function OrgChip({ orgKey }) {
  const org = ORGS[orgKey];
  if (!org) return null;
  return (
    <span
      className="inline-block font-mono text-[10px] tracking-[0.12em] uppercase font-bold px-2 py-[2px]"
      style={{ color: C.paper, background: org.color }}
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
// BROWSE
// ===========================================================================
const ALL_TAGS = [...new Set(LESSONS.flatMap(l => l.tags))].sort();
const ALL_HOSTS = Object.keys(ORGS);
const ALL_FORMATS = [...new Set(LESSONS.map(l => l.format))];

function LessonCard({ lesson }) {
  const host = ORGS[lesson.host];
  return (
    <div
      className="p-5 relative transition-all hover:-translate-y-0.5"
      style={{ background: lesson.done ? C.paperAlt : C.paper, border: `1.5px solid ${C.ink}` }}
    >
      {lesson.done && (
        <div
          className="absolute -top-2 right-4 px-2 py-0.5 font-mono text-[9px] tracking-[0.18em] uppercase font-bold"
          style={{ background: C.green, color: C.paper }}
        >
          done
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <OrgChip orgKey={lesson.host} />
        <span className="font-mono text-[10px] tracking-wider" style={{ color: C.inkMute }}>
          {lesson.length} min · {lesson.format}
        </span>
      </div>
      <h3 className="text-lg italic leading-snug" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        {lesson.title}
      </h3>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {lesson.tags.map((t) => (
          <span key={t} className="font-mono text-[10px] tracking-wider px-2 py-0.5" style={{ color: C.ink, border: `1px solid ${C.ink}44` }}>
            {t}
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button className="font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2" style={{ background: lesson.done ? 'transparent' : C.ink, color: lesson.done ? C.ink : C.paper, border: lesson.done ? `1.5px solid ${C.ink}` : 'none' }}>
          {lesson.done ? 'Review' : 'Start →'}
        </button>
      </div>
    </div>
  );
}

function LibraryBrowse() {
  const [tagFilter, setTagFilter] = useState(null);
  const [hostFilter, setHostFilter] = useState(null);
  const [formatFilter, setFormatFilter] = useState(null);

  const filtered = useMemo(() => {
    return LESSONS.filter((l) => {
      if (tagFilter && !l.tags.includes(tagFilter)) return false;
      if (hostFilter && l.host !== hostFilter) return false;
      if (formatFilter && l.format !== formatFilter) return false;
      return true;
    });
  }, [tagFilter, hostFilter, formatFilter]);

  const clearAll = () => { setTagFilter(null); setHostFilter(null); setFormatFilter(null); };

  return (
    <section className="mt-10">
      <SectionHead num="02" kicker="Browse · the full library" sub={`${LESSONS.length} lessons · ${Object.keys(ORGS).length} sources · filter by interest, host, or format`}>
        Learn something <em style={{ color: C.coral }}>intentional</em>
      </SectionHead>

      {/* Filter row */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Label>interest</Label>
          {ALL_TAGS.slice(0, 10).map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
              className="font-mono text-[10px] tracking-wider uppercase font-semibold px-2 py-1"
              style={{
                background: tagFilter === t ? C.coral : 'transparent',
                color: tagFilter === t ? C.paper : C.ink,
                border: `1px solid ${tagFilter === t ? C.coral : C.ink + '44'}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label>host</Label>
          {ALL_HOSTS.map((h) => (
            <button
              key={h}
              onClick={() => setHostFilter(hostFilter === h ? null : h)}
              className="font-mono text-[10px] tracking-wider uppercase font-bold px-2 py-1"
              style={{
                background: hostFilter === h ? ORGS[h].color : 'transparent',
                color: hostFilter === h ? C.paper : C.ink,
                border: `1px solid ${hostFilter === h ? ORGS[h].color : C.ink + '44'}`,
              }}
            >
              {ORGS[h].brand}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label>format</Label>
          {ALL_FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => setFormatFilter(formatFilter === f ? null : f)}
              className="font-mono text-[10px] tracking-wider uppercase font-semibold px-2 py-1"
              style={{
                background: formatFilter === f ? C.ink : 'transparent',
                color: formatFilter === f ? C.paper : C.ink,
                border: `1px solid ${C.ink}44`,
              }}
            >
              {f}
            </button>
          ))}
          {(tagFilter || hostFilter || formatFilter) && (
            <button
              onClick={clearAll}
              className="font-mono text-[10px] tracking-wider uppercase font-bold px-2 py-1 ml-auto"
              style={{ color: C.coral }}
            >
              clear filters ×
            </button>
          )}
        </div>
      </div>

      <div className="text-sm mb-4" style={{ color: C.inkSoft }}>
        Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? 'lesson' : 'lessons'}.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((l) => <LessonCard key={l.id} lesson={l} />)}
      </div>
    </section>
  );
}

// ===========================================================================
// CURRICULA — ordered paths
// ===========================================================================
function Curricula({ curricula }) {
  return (
    <section className="mt-20">
      <SectionHead num="03" kicker="Curricula · ordered paths" sub="Co-authored with member orgs and partners. Not a forced track — a thoughtfully ordered sequence, if sequences help you.">
        A <em style={{ color: C.coral }}>shaped path</em>, if you want one
      </SectionHead>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {curricula.map((c) => {
          const lessonsInCur = c.lessons.map(id => LESSONS.find(l => l.id === id)).filter(Boolean);
          const doneCount = lessonsInCur.filter(l => l.done).length;
          const totalMin = lessonsInCur.reduce((s, l) => s + l.length, 0);

          return (
            <div key={c.id} className="p-6" style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Label>co-authored with</Label>
                {c.coAuthors.map(a => <OrgChip key={a} orgKey={a} />)}
              </div>
              <h3 className="text-2xl italic leading-tight" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                {c.title}
              </h3>
              <p className="mt-2 text-sm" style={{ color: C.inkSoft }}>{c.blurb}</p>

              {/* Mini progress */}
              <div className="mt-4">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="font-mono text-[10px] tracking-wider" style={{ color: C.inkMute }}>
                    {doneCount} of {lessonsInCur.length} done · {totalMin} min total
                  </span>
                  <span className="font-mono text-[10px] tracking-wider font-bold" style={{ color: C.coral }}>
                    {Math.round((doneCount / lessonsInCur.length) * 100)}%
                  </span>
                </div>
                <div className="h-2 relative" style={{ background: C.paper, border: `1px solid ${C.ink}22` }}>
                  <div className="absolute inset-y-0 left-0" style={{ width: `${(doneCount / lessonsInCur.length) * 100}%`, background: C.coral }} />
                </div>
              </div>

              {/* Lesson list */}
              <ol className="mt-4 space-y-2">
                {lessonsInCur.map((l, i) => (
                  <li key={l.id} className="flex items-baseline gap-3 text-sm" style={{ color: C.ink }}>
                    <span className="font-mono text-[10px] shrink-0" style={{ color: C.inkMute }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={`flex-1 ${l.done ? 'line-through opacity-60' : ''}`}>{l.title}</span>
                    <span className="font-mono text-[10px] shrink-0" style={{ color: C.inkMute }}>
                      {l.length}m
                    </span>
                    {l.done && <span className="font-mono text-[9px] tracking-wider uppercase font-bold" style={{ color: C.green }}>done</span>}
                  </li>
                ))}
              </ol>

              <button
                className="mt-5 font-mono text-[11px] tracking-[0.15em] uppercase font-bold px-3 py-2"
                style={{ background: C.ink, color: C.paper }}
              >
                {doneCount > 0 ? 'Continue →' : 'Begin →'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ===========================================================================
// SKILLS GRAPH (fuller version)
// ===========================================================================
function SkillsGraphFull({ skills }) {
  return (
    <section className="mt-20 mb-20">
      <SectionHead num="04" kicker="Your skills graph · with evidence" sub="Each skill is a claim backed by real activity. You choose which are visible on your public profile.">
        What you can <em style={{ color: C.coral }}>actually do</em>
      </SectionHead>

      <div className="p-6" style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
              <th className="text-left pb-3"><Label>Skill</Label></th>
              <th className="text-left pb-3"><Label>Level</Label></th>
              <th className="text-left pb-3"><Label>Evidence</Label></th>
              <th className="text-right pb-3"><Label>Months</Label></th>
              <th className="text-right pb-3"><Label>Visible</Label></th>
            </tr>
          </thead>
          <tbody>
            {skills.map((s, i) => (
              <tr key={i} style={{ borderBottom: i < skills.length - 1 ? `1px solid ${C.ink}22` : 'none' }}>
                <td className="py-3" style={{ color: C.ink }}>{s.name}</td>
                <td className="py-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className="h-3 w-5"
                        style={{
                          background: n <= s.level ? C.coral : 'transparent',
                          border: `1.5px solid ${C.ink}`,
                        }}
                      />
                    ))}
                  </div>
                </td>
                <td className="py-3 font-mono text-[11px]" style={{ color: C.inkSoft }}>
                  {s.from}
                </td>
                <td className="py-3 text-right font-mono text-[11px]" style={{ color: C.inkMute }}>
                  {s.months}
                </td>
                <td className="py-3 text-right">
                  <span
                    className="font-mono text-[10px] tracking-wider uppercase font-bold px-2 py-0.5"
                    style={{
                      background: i % 2 === 0 ? C.green : 'transparent',
                      color: i % 2 === 0 ? C.paper : C.inkMute,
                      border: i % 2 === 0 ? 'none' : `1px solid ${C.ink}44`,
                    }}
                  >
                    {i % 2 === 0 ? 'public' : 'private'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs italic" style={{ color: C.inkMute }}>
        No badges. No leaderboards. Evidence is the receipt.
      </p>
    </section>
  );
}

// ===========================================================================
// MAIN
// ===========================================================================
export default function FIGNLearn() {
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
          <span>Skills Lab</span>
          <span className="hidden md:inline font-mono text-[9px] tracking-widest" style={{ color: C.inkMute }}>
            /learn
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 font-mono text-[11px] tracking-[0.2em] uppercase font-semibold" style={{ color: C.inkMute }}>
          <span>Map</span>
          <span style={{ color: C.ink, textDecoration: 'underline', textUnderlineOffset: 6 }}>/learn</span>
          <span>Events</span>
          <span>Orgs</span>
          <span>Trail</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center text-xs font-bold font-mono" style={{ background: C.coral, color: C.paper }}>AO</div>
        </div>
      </header>

      <main className="px-6 md:px-10 py-10 max-w-[1280px] mx-auto">
        {/* Hero */}
        <Label>§ 01 · Skills Lab</Label>
        <h1 className="mt-3 text-5xl md:text-7xl leading-[0.95]" style={{ color: C.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          The <em style={{ color: C.coral }}>library</em>.
        </h1>
        <p className="mt-5 text-base md:text-lg max-w-2xl leading-relaxed" style={{ color: C.inkSoft }}>
          A growing collection of short lessons from FIGN, member orgs, partners,
          and the open web. Browse freely, or follow a curriculum. Every finished
          lesson gives you tailored options — you choose what to do with them.
        </p>

        {/* Library stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl">
          {[
            ['18',  'lessons live'],
            ['8',   'contributors'],
            ['4',   'curricula'],
            ['3',   'languages planned'],
          ].map(([n, l]) => (
            <div key={l} className="p-4" style={{ background: C.ink, color: C.paper }}>
              <div className="text-3xl italic leading-none" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{n}</div>
              <div className="mt-2 font-mono text-[10px] tracking-[0.2em] uppercase font-bold" style={{ opacity: 0.9 }}>{l}</div>
            </div>
          ))}
        </div>

        <LibraryBrowse />
        <Curricula curricula={CURRICULA} />
        <SkillsGraphFull skills={ME_SKILLS} />
      </main>

      <footer className="px-6 md:px-10 py-6 flex items-center justify-between font-mono text-[10px] tracking-[0.22em] uppercase font-semibold" style={{ borderTop: `1.5px solid ${C.ink}`, color: C.inkSoft }}>
        <span>FIGN · /learn · prototype v1</span>
        <span>own library · open collaborations</span>
      </footer>
    </div>
  );
}
