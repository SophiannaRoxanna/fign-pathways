# FIGN — Claude context

## What this project is

The Females in Gaming Network (FIGN) platform — a **federation**, not a destination. FIGN is the umbrella. Member orgs (Femmes aux Consoles in Cameroon, Bambina pan-Africa) keep their brand. Partners (Nexal, Juju Games, Daimyo, Phygital NG, Ingage, IGDA Foundation) get a reach channel. Every item, activity, and lesson carries a `host_org_id` — FIGN is never the default host.

## Ground rules

1. **Read `reference/fign-build-plan.md` and the three `reference/fign-*.jsx` prototypes before changing visual direction.** They are the spec.
2. **Do not drift from the v3 editorial palette** — cream paper, dark ink, coral / green / purple / blue / gold. See Design Context below.
3. **Host attribution is the federation signal** — every card, trail entry, lesson must name its host org via `<OrgChip>`. Never let FIGN silently take credit for a member-org's or partner's work.
4. **Interests, not tracks.** No stages, no career ladders. Members pick tags or write their own words; the system draws the map.
5. **Before shipping any new surface, check that it works on a slow phone.** Mobile-first, 3G-friendly, SSR the map SVG.

## Environment notes

- Package manager: `pnpm`. Seed: `pnpm seed`. Dev: `pnpm dev`.
- Database: Supabase. Migrations in `supabase/migrations/*.sql`. Seed JSON in `supabase/seed/*.json`.
- Env file: `.env.local` (gitignored; see `.env.example`). Uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UMBRELLA_ADMIN_EMAIL`.
- Supabase free-tier SMTP is rate-limited; for local dev use `/api/dev-signin` (dev-only, 404 in prod) to bypass magic-link email.

---

# Design Context

*Source: `reference/fign-build-plan.md` §1, §9, §12–17, the three visual prototypes in `reference/`, and the palette in `lib/design/tokens.ts`. Mirrored in `.impeccable.md`.*

## Users

**Primary audience.** African women and girls in gaming — players, creators, leaders, singers, streamers, artists, organisers. Many discover FIGN from their existing home (Femmes aux Consoles in Cameroon, Bambina pan-Africa, FIGN chapters in Nigeria, Ghana, Kenya, South Africa). Most open the platform on a phone, often on patchy connections.

**Secondary audiences.** Member-organisation coordinators (who need to amplify their org without feeling assimilated) and partners (studios, tournament operators, sponsors — Nexal, Juju Games, Daimyo Arena, IGDA Foundation — who need a reach channel).

**Context of use.** Phone-first, bandwidth-constrained. Bilingual reality: French from day one (Cameroon) alongside English; Swahili / Portuguese / Arabic later. WhatsApp-native community; the platform is async-companion to WhatsApp.

## Brand personality

Three words: **editorial · warm · federation-first.**

- **Editorial**, not product-design-system. The app looks like a thoughtfully-set field journal, not a SaaS dashboard.
- **Warm.** Coral for warmth, green for agency. Copy in Sophia's voice — "open your door," "in your own words," "a federation, not a funnel."
- **Federation-first.** Every card, trail entry, and lesson names its host org. FIGN is never the default host.

**Emotional goal.** A woman arrives and thinks: *"this was made for me, with care, by people who do the work."*

## Aesthetic direction

**Visual language: editorial / field-journal.**

Palette (all in `lib/design/tokens.ts`):
- `paper #f5ecdc` background, never white
- `ink #1a1410` text + borders, never pure black
- `coral #c94a2a` FIGN brand, warmth, `<em>` emphasis
- `green #1f7a3f` "here", agency, confirmation
- `purple #6b3a7a` member orgs (FAC, Bambina)
- `blue #2b5a8a` partners (Nexal, Juju, Daimyo, etc.)
- `gold #a67c1e` open-source / CC content
- `ink-soft #4a3d30` body · `ink-mute #8a7a68` captions
- `paper-alt #ece1cc` card surfaces · `paper-dk #ddcfb4` insets

Typography:
- **Cormorant Garamond italic** for headings, blockquotes, emphatic display.
- **JetBrains Mono** for labels, numbers, timestamps. All-caps with `tracking: 0.18–0.22em` for labels.
- No third family.

Compositional cues:
- 1.5px ink borders. Never gray-500, never pure black.
- No border-radius above 2–3px except tag chips.
- **Host-colored top strip on every card is the federation signal — non-negotiable.**
- Grid-paper SVG background on big canvases.
- Numbered section headers: `§ 02 · Matched to your map`.

## Design principles (pinned, from build plan §9 + §16)

1. Host org is always visible.
2. Interests, not tracks.
3. Adaptation > standardisation — platform bends to the org, not the reverse.
4. Tailored options after a lesson, never prescription (six doors, pick zero-to-many).
5. Editorial aesthetic everywhere; no neon, no gradients, no purple-gradient cliché.
6. Evidence over abstraction — skills are claims backed by real activity.
7. Own a core, federate the rest.
8. Public impact, private roster.
9. Consent is granular and reversible.
10. Mobile-first, 3G-friendly.
11. Language is not optional (French from day one).
12. Deadlines are real, not gamified.

## Theme

**Light only.** Cream paper. Deliberate, not a safe default — high-contrast for patchy bandwidth, editorial aesthetic, and differentiation from the already-saturated dark+neon women-in-gaming category.

## Accessibility

**WCAG 2.2 AA** minimum on every screen:
- 4.5:1 text contrast, 3:1 non-text.
- Full keyboard nav, visible focus rings.
- No colour-only meaning (host chips carry text labels too).
- Contrast-verified combos: ink-on-paper 15.8:1, coral-on-paper 4.9:1, green-on-paper 5.2:1. Verify new combos on paper-alt separately.

## Motion

Keep current motion on. Drift (700ms ease-out, staggered) and pulse are subtle enough to skip `prefers-reduced-motion` wrapping. Anything more aggressive than those must be wrapped.

## Anti-references

Stay within FIGN's own aesthetic universe — defined in the build plan §1 and the three prototypes. Explicitly rejected:
- Walled membership club aesthetics.
- Rigid career-track systems.
- Discord / LinkedIn / itch.io / FaceIt clones.
- KPI-card dashboards.
- Generic purple-gradient "women in gaming" aesthetic.

The previous fign.org (in `../old-fign-website/`) used `#6C4AB6` + `#FF2F92` — *explicitly replaced* by the v3 editorial palette above. "Similar to fign.org" means the spirit, not the old palette.

## What's already built

- Scaffold: Next.js 15 app router + Tailwind v4, Cormorant + JetBrains Mono via `next/font/google`.
- Shared primitives: `components/ui/{Label, Rule, SectionHead}.tsx`, `components/org/OrgChip.tsx`.
- Pages: `/` (three-door landing), `/signin`, `/onboarding/start`, `/map`, `/events`, `/people`, `/orgs-follow`, `/me`, `/lessons/[slug]`, `/orgs/[slug]` (public), `/admin/{orgs,items,lessons,members}`.
- Learning-layer components: `SkillsLab`, `LessonDoneModal`, `MilestonesPanel`, `GrowthGlance`, `SkillsBars`.
- Supabase: 5 migrations, 8 RPCs (`record_activity`, `complete_lesson`, `log_lesson_option`, `update_skills_from_activity`, `match_items_for_member`, `match_lessons_for_member`, `extract_tags_simple`, `onboard_member`), RLS throughout.
