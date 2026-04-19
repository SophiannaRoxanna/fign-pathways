# FIGN — Phase 0 + 1

The Females in Gaming Network platform, built as a **federation**. FIGN is the
umbrella. Member orgs (Femmes aux Consoles, Bambina) keep their brand.
Partners (Nexal, Juju Games, Daimyo, Garden City, Phygital NG, Ingage.gg,
IGDA Foundation, Alliance Française PH) get a reach channel. Every item,
activity, and lesson carries a `host_org_id` — FIGN is never the default host.

The visual + spec reference for this build lives in [`reference/`](./reference):
- `fign-build-plan.md` — v3 federation spec + v4 learning layer (§12–17)
- `fign-landing.jsx` — three-door landing prototype
- `fign-member-home.jsx` — the `/map` home with interest map, Skills Lab, milestones, growth glance, skills bars
- `fign-learn.jsx` — the Phase 2.5 `/learn` library (prototype only — not implemented in this phase)

The approved build plan is at `~/.claude/plans/using-the-files-available-fizzy-mccarthy.md`.

---

## What's shipped

### Front-end
- **Three-door landing** at `/` — Woman / Member Org / Partner, with evidence strip, federation strip, founder note, cross-link to [esports-combine.vercel.app](https://esports-combine.vercel.app).
- **Email magic-link sign-in** at `/signin` (WhatsApp deferred to Phase 4).
- **5-step onboarding** at `/onboarding/start` — basics → interests → own-words → first milestone → confirm.
- **`/map` member home** — hero, interest map SVG, Skills Lab strip, milestones panel, growth glance, skills bars, matched feed, people panel, activity trail.
- **Lesson reader** at `/lessons/[slug]` — host-colored strip, serif hero, body, "mark as finished" → LessonDoneModal with 6 tailored "what next?" doors.
- **Shell pages** — `/events`, `/people`, `/orgs-follow`, `/me`.
- **Public org pages** — `/orgs/[slug]` (works logged-out; follow button if logged in).
- **Umbrella admin** — `/admin/{orgs,items,lessons,members}` CRUD, gated by `members.is_umbrella_admin`.

### Back-end
- **Supabase schema** — 5 migrations in `supabase/migrations/`:
  - `0001_schema_federation.sql` — organisations, members, interest_tags, member_tags, activities, items, item_registrations, follows, xp_awards.
  - `0002_schema_learning.sql` — lessons, lesson_completions, curricula, curriculum_lessons, member_skills, milestones, growth_snapshots, lesson_option_events.
  - `0003_rls.sql` — row-level security; umbrella-admin bypass via `is_umbrella_admin()` helper.
  - `0004_functions.sql` — `record_activity`, `complete_lesson`, `log_lesson_option`, `update_skills_from_activity`, `match_items_for_member`, `match_lessons_for_member`, `extract_tags_simple`, `onboard_member`.
  - `0005_seed_core.sql` — XP awards lookup table.
- **Seed data** in `supabase/seed/*.json` — 12 organisations, 43 interest tags across 7 groups, 20 lessons, 4 curricula, 12 items, 20 members.
- **API routes** — `/api/milestone`, `/api/complete-lesson`, `/api/lesson-option`, `/auth/callback`.

### What's deferred (per plan)
- `/learn` full library + curricula browser — Phase 2.5
- Org-admin panel + webhook/CSV registration ingestion — Phase 2
- Partner admin panel + public `/impact` with live rollups — Phase 3
- French surface + LLM-assisted tag extraction + granular consent UI — Phase 4
- iCal/RSS feeds + open-source chapter toolkit — Phase 5
- WhatsApp OTP auth — Phase 4

---

## Setup — from zero to seeded locally

### 1. Prerequisites

- Node 20+ and pnpm (check: `node -v` and `pnpm -v`)
- A Supabase project — create one free at [supabase.com](https://supabase.com)

### 2. Install deps

```bash
cd "Females in Gaming Network/Dashboard"
pnpm install
```

### 3. Create your Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Name it `fign` (region: closest to your users).
3. Wait ~1 minute to provision.
4. In **Project Settings → API**, copy the Project URL, the `anon public` key, and the `service_role` key (keep that one secret).

### 4. Write `.env.local`

```bash
cp .env.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
UMBRELLA_ADMIN_EMAIL=sophia@fign.org
```

### 5. Apply migrations

In your Supabase project's **SQL Editor**, paste and run each file in order:

1. `supabase/migrations/0001_schema_federation.sql`
2. `supabase/migrations/0002_schema_learning.sql`
3. `supabase/migrations/0003_rls.sql`
4. `supabase/migrations/0004_functions.sql`
5. `supabase/migrations/0005_seed_core.sql`

Or via Supabase CLI:
```bash
brew install supabase/tap/supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 6. Seed data

```bash
pnpm seed
```

Inserts 12 organisations, 43 interest tags, 20 lessons, 4 curricula, 12 items, 20 seed members (with declared tags + "then" growth snapshots), and flips `is_umbrella_admin=true` on the `UMBRELLA_ADMIN_EMAIL` address.

### 7. Run locally

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000). The landing page renders without any Supabase calls, so it works even before step 5. Everything under `/map`, `/events`, `/people`, `/admin`, `/orgs/[slug]` needs the DB.

### 8. Sign in

1. Open `/signin`.
2. Enter `sophia@fign.org` (or whatever `UMBRELLA_ADMIN_EMAIL` you set).
3. Click the magic link in your inbox.
4. First sign-in → `/onboarding/start` (5 steps) → `/map`.
5. `/admin` is now accessible because `is_umbrella_admin=true`.

---

## Verify the Phase 0 ship criterion

> **"Sophia onboards Femmes aux Consoles in under 20 minutes — their page is live with their branding, they post one event, it shows on a test member's map with correct attribution."**

The seed already inserts FAC as a placeholder. To do the full flow from scratch:

1. `/admin/orgs/new` → Create `Femmes aux Consoles`, type=`member_org`, color=`#6b3a7a`, country=`CM`, language=`fr`. Click **"Save & post first item →"**.
2. The redirect lands at `/admin/items/new?host_org_id=[FAC id]` with host pre-filled. Post a workshop item with voice-acting tags.
3. Sign in as a seed member (e.g. `amara.plays@fign.example`). Her `/map` now shows the FAC workshop with a purple host strip.

---

## Verify the Phase 1 ship criterion

> **"20 members onboard; each sees ≥4 matched items (≥1 member org, ≥1 partner). 10 finish their first lesson and pick ≥1 'what next?' door. 50% set ≥1 milestone."**

- `pnpm seed` creates 20 members and drops them onto their maps.
- Visit any seed member's `/map` (sign in as them) — you should see matched items and Skills Lab lessons pulled by `match_items_for_member` and `match_lessons_for_member`.
- End-to-end lesson walkthrough: `/lessons/voice-acting-for-games-intro` → "I did this" → LessonDoneModal opens → pick "Make something" → trail shows it on the next `/map` refresh.

---

## Project structure

```
app/
  (marketing)/                     three-door landing
  (auth)/signin/                   magic-link sign-in
  (onboarding)/start/              5-step flow
  (member)/                        auth-gated member surface
    layout.tsx                     top nav + auth guard
    map/                           the home
    lessons/[slug]/                reader + LessonFinisher client component
    events/                        full matched feed
    people/                        full people directory
    orgs-follow/                   org directory + follow button
    me/                            own profile view
  orgs/[slug]/                     public org page
  admin/                           Sophia's umbrella admin
  api/                             thin server wrappers around RPCs
  auth/callback/                   magic-link callback

components/
  landing/                         Door, EvidenceStrip, OrgsStrip
  member/                          InterestMap, MatchedFeed, PeoplePanel, ActivityTrail
  learning/                        SkillsLab, LessonDoneModal, MilestonesPanel, GrowthGlance, SkillsBars
  org/OrgChip.tsx
  ui/                              Label, Rule, SectionHead
  admin/                           shared form primitives

lib/
  design/tokens.ts                 palette (paper/ink/coral/green/blue/purple/gold)
  copy/                            DOORS, EVIDENCE, interest groups, doorOptions
  supabase/                        server/client/admin clients, TS types

supabase/
  migrations/                      5 SQL files, run in order
  seed/                            JSON seed files + run.ts runner

reference/                         the three prototypes + build plan
```

---

## Design language — don't drift

Pinned here so every future page keeps the feel:

- **Cream paper `#f5ecdc`**, not white. **Dark ink `#1a1410`**, not pure black.
- Borders are **1.5px ink**, never gray-500 or pure black.
- Headings in **Cormorant Garamond italic** (via `font-serif` class).
- Labels, numbers, coordinates in **JetBrains Mono** (via `font-mono`).
- `<em>` always in coral `#c94a2a`.
- Host-colored top strip on every card is the federation signal — do not dilute.
  - Member orgs wear purple `#6b3a7a`, partners wear blue `#2b5a8a`, FIGN wears coral, open source wears gold `#a67c1e`.
- No gradients. No rounded corners above 2–3px except tag chips.
- Grid-paper SVG background pattern on big surfaces (interest map).

---

## Open items

- **Evidence numbers** on the landing (640+, 300+, 120+, 64) are historical. Confirm current or add "as of [date]" before public launch. Edit `lib/copy/landing.ts`.
- **WhatsApp auth** (Phase 4): decide between Twilio WhatsApp Business / MessageBird / a Nigerian SMS gateway.
- **LLM-assisted tag extraction** (Phase 4): today's `extract_tags_simple` is regex + synonyms; works, will get stale.
- **Skill aggregation rules**: `update_skills_from_activity` maps tag slugs → skill names via title-casing. Reasonable starting point; curate rules after real usage.
- **Middleware → proxy** rename: Next.js 16 now prefers `proxy.ts` over `middleware.ts`. Cosmetic warning only.

---

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Run the dev server on :3000 |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `pnpm seed` | Seed / re-seed the database from JSON files |
| `pnpm tsc --noEmit` | Type-check without emitting |

---

Built alongside Sophia Nei. Federation, not a funnel.
