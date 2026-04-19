# FIGN — Claude context

## What this project is

The Females in Gaming Network (FIGN) platform — a **federation**, not a destination. FIGN is the umbrella. Member orgs (Femmes aux Consoles in Cameroon, Bambina pan-Africa) keep their brand. Partners (Nexal, Juju Games, Daimyo, Phygital NG, Ingage, IGDA Foundation) get a reach channel. Every item, activity, and lesson carries a `host_org_id` — FIGN is never the default host.

## Ground rules

1. **Read `reference/fign-build-plan.md` and the three `reference/fign-*.jsx` prototypes before changing visual direction.** The prototypes use the old v3 cream/coral palette; the live app now uses the v4 pink+purple palette — see Design Context below.
2. **Do not drift from the v4 pink+purple palette.** Sophia flagged the cream/coral direction as reading AI-default. The live tokens are in [`lib/design/tokens.ts`](lib/design/tokens.ts).
3. **Host attribution is the federation signal** — every card, trail entry, lesson must name its host org via `<OrgChip>`. Never let FIGN silently take credit for a member-org's or partner's work.
4. **Interests, not tracks.** No stages, no career ladders. Members pick tags or write their own words; the system draws the map.
5. **Before shipping any new surface, check that it works on a slow phone.** Mobile-first, 3G-friendly, SSR expensive bits.
6. **No side-stripe accents on cards** (impeccable banned pattern). Use leading numbered tokens, filled chips, or accent text.

## Environment notes

- Package manager: `pnpm`. Seed: `pnpm seed`. Dev: `pnpm dev`.
- Database: Supabase. Migrations in `supabase/migrations/*.sql`. Seed JSON in `supabase/seed/*.json`.
- Env file: `.env.local` (gitignored; see `.env.example`). Uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UMBRELLA_ADMIN_EMAIL`.
- Supabase free-tier SMTP is rate-limited; for local dev use `/api/dev-signin` (dev-only, 404 in prod) to bypass magic-link email.

---

# Design Context (v4 — brand palette)

*Supersedes the v3 editorial cream/coral direction. Source: FIGN logo (pink + purple wordmark on white), Sophia's build plan §1 + §9 + §12–17, and the colour migration in this repo. Mirrored in `.impeccable.md`.*

## Users

**Primary audience.** African women and girls in gaming — players, creators, leaders, singers, streamers, artists, organisers. Most discover FIGN through their existing home (Femmes aux Consoles in Cameroon, Bambina pan-Africa, FIGN chapters in Nigeria, Ghana, Kenya, South Africa). Phone-first, often on 3G.

**Secondary audiences.** Member-org coordinators and partners (studios, tournaments, sponsors).

**Context.** Phone-first, bandwidth-constrained. Bilingual (French + English). WhatsApp-native community; platform is async companion.

## Brand personality

Three words: **bold · federation-first · warm-but-direct.**

**Emotional goal.** A woman arrives and thinks *"this is for me, this is mine, I recognise the energy."*

## Aesthetic direction

### Palette — pink + purple + white + black

Source of truth: [`lib/design/tokens.ts`](lib/design/tokens.ts).

**Brand**
- `coral #FF2F92` — pink; FIGN umbrella; `<em>` on dark; primary CTAs
- `coralDk #CC1F74` — pink pressed + body `<em>` on light (AA-safe)
- `coralSoft #FFE0F0` — pink-wash surface
- `purple #6C4AB6` — member-org chips; secondary brand
- `purpleSoft #E9DFFF` — purple-wash surface
- `purpleDeep #4A2A8F` — partner chips (via `blue` alias); pressed states

**Light theme (authed app)**
- `paper #FEFCFD` canvas · `paperAlt #F7F2F9` cards · `paperDk #EFE9F0` insets · `hairline #E5DBEA` dividers
- `ink #120B17` text/borders · `inkSoft #3B3540` body · `inkMute #7D7686` captions

**Dark theme (marketing)**
- `canvasDark #140A1A` · `surfaceDark #221434` · `surfaceDarkAlt #1A0E25`
- `inkOnDark #F4EDF6` · `inkOnDarkMute #B8ACC5` · `hairlineDark #3A2050`

**System (minimal, a11y only)**
- `green #2D8653` success · `danger #B32A3C` error — always with text + icon

**Back-compat**: legacy `blue` and `gold` tokens resolve to `purpleDeep` and `purple` respectively, so v3 consumer code doesn't need rewriting.

### Typography (Google Fonts)
- **Display** (headings, hero, blockquotes): **Bricolage Grotesque**, italic axis
- **Body** (UI, forms): **Manrope**
- **Mono** (labels, numbers, timestamps): **Martian Mono**
- Use `.font-display` / `.font-mono` classes; body inherits Manrope

### Theme split
- **Dark**: `/` landing, `/signin`. Doors fill with their brand colour on `canvasDark`.
- **Light**: everything authed. `paper` canvas, `ink` text.
- Transition from dark `/signin` → light `/onboarding/start` is an intentional threshold cue.

### Compositional rules
- 1.5px ink borders. Never gray-500, never pure black.
- No border-radius above 2–3px except tag chips.
- **Host-colored top strip on every card is the federation signal** — non-negotiable.
- Grid-paper SVG on big canvases (interest map).
- Numbered section headers: `§ 02 · Matched to your map`.

## Design principles (pinned)

1. Host org is always visible.
2. Interests, not tracks.
3. Adaptation > standardisation.
4. Tailored options after a lesson, never prescription.
5. The brand *is* pink + purple. Don't drift toward editorial-muted.
6. Evidence over abstraction.
7. Own a core, federate the rest.
8. Public impact, private roster.
9. Consent is granular and reversible.
10. Mobile-first, 3G-friendly.
11. Language is not optional.
12. Deadlines are real, not gamified.
13. No side-stripe accents, no gradient text, no glassmorphism, no KPI-card grids.

## Accessibility

**WCAG 2.2 AA floor.** Verified combos:
- `ink` on `paper` → 15.8:1 ✓
- `coralDk` on `paper` → 5.2:1 ✓ (body `<em>` uses this on light)
- `coral` on `paper` → 3.8:1 — *below AA body*; use for display headings + chip backgrounds only
- `purple` on `paper` → 5.9:1 ✓
- `inkOnDark` on `canvasDark` → 14:1 ✓
- `coral` on `canvasDark` → 6.1:1 ✓
- `purple` on `canvasDark` → 3.2:1 — borderline; keep purple for backgrounds/chips on dark

## Motion

Keep current drift + pulse animations on; subtle enough not to gate behind `prefers-reduced-motion`. Anything more aggressive must be wrapped.

## Anti-references

Stay within FIGN's own aesthetic universe. The logo is the canonical brand reference.

Avoid: generic dashboard aesthetic; dark+neon esports cliché; editorial-cream "AI design"; Riot/Valorant angular chrome; LMS course-card grids; LinkedIn/Discord/FaceIt clones.

The previous fign.org (in `../old-fign-website/`) used `#FF2F92` + `#6C4AB6` — values now adopted here. The new design distils from that, not a copy.

## What's already built

- Scaffold: Next.js 15 + Tailwind v4, Bricolage + Manrope + Martian Mono via `next/font/google`.
- Shared primitives: `components/ui/{Label, Rule, SectionHead}.tsx`, `components/org/OrgChip.tsx`.
- Pages: `/` (dark landing), `/signin` (dark), `/onboarding/start`, `/map`, `/events`, `/people`, `/orgs-follow`, `/me`, `/lessons/[slug]`, `/orgs/[slug]` (public), `/admin/{orgs,items,lessons,members}`.
- Learning-layer components: `SkillsLab`, `LessonDoneModal`, `MilestonesPanel`, `GrowthGlance`, `SkillsBars`.
- Supabase: 5 migrations, 8 RPCs, RLS throughout.
