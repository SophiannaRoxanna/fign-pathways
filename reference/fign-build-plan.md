# FIGN — Build Plan v3

*A federation platform for the pan-African women-in-gaming movement. FIGN is the umbrella. Femmes aux Consoles, Bambina, and future peer orgs keep their identity. Partners get a reach channel. Women get one map across all of it.*

Prepared for Sophia Nei · rewritten against the federation model (April 2026)

---

## 1. What this plan is NOT building

Before anything: a list of things we deliberately do not build. Each of these would have made FIGN worse.

- **A walled membership club** that asks women to join *FIGN* instead of their existing home (Femmes aux Consoles, Bambina, Nexal's community). We're not a destination, we're connective tissue.
- **A rigid career-track system** that forces a singer-turned-voice-actor or cosplayer-turned-community-manager to pick "Play / Create / Lead" on day one.
- **A replacement for Discord, LinkedIn, itch.io, or FaceIt.** We aggregate from what works; we don't try to out-compete tools that already have network effects.
- **A host for events we don't run.** When Daimyo Arena runs an MK1 tournament, they run it. FIGN surfaces it, links out, and receives the receipts — we do not rebuild Daimyo's registration flow inside our product.
- **A dashboard with four KPI cards.** The home screen is a map, not metrics.
- **A generic purple-gradient "women in gaming" aesthetic.** That market is crowded and looks identical everywhere. FIGN's visual language is editorial (cream paper, dark ink, serif italics, mono coordinates). It stands out.

---

## 2. The three audiences, the three front doors

The landing page routes before it sells. Three doors, three distinct product surfaces behind them, one data model underneath.

### Door I — The Woman

**Promise:** "I want to find my shape in gaming."

**What she gets:** An interest map (she picks tags or writes in her own words), events/opportunities matched to her across all orgs, women connected to her path, a compounding activity trail across every org she touches.

**Key pages:** `/app/map` (home), `/app/events`, `/app/people`, `/app/orgs`, `/app/me`.

### Door II — The Member Organisation

**Promise:** "I run an org. FIGN should amplify us, not absorb us."

**What they get:** Their own branded page on FIGN. They keep their brand, programs, and members. They post events to the FIGN network; the network's members discover them; registrations flow back to the org's own system (or to a shared one, whichever the org prefers). They see who from the FIGN network engaged with them. The FIGN-wide impact page counts their work as part of the continental total — AND gives them their own per-org impact page.

**Key pages:** `/orgs/[slug]` (public), `/orgs/[slug]/admin` (their control), `/orgs/[slug]/impact`.

### Door III — The Partner

**Promise:** "I need qualified African women in gaming."

**What they get:** A reach channel. They post tournaments, gigs, roles, scholarships, or sponsorship opportunities. They filter by country, interest, experience. They see live impact attribution — the events they powered, the women who participated, the outcomes that followed.

**Key pages:** `/partners/[slug]` (their public page), `/partners/[slug]/admin`, `/impact`.

All three doors share a single database. A woman's activity inside a member org's event page counts toward her FIGN trail. A partner's sponsored workshop shows up on the member org's page *and* on the women's maps *and* on the partner's attribution page.

---

## 3. Core model: interest graph, not tracks

The biggest change from v2. There are no predefined career tracks gating progression. Instead:

### The member describes herself

- **Interest tags**, grouped for scannability but freely combinable. The taxonomy spans Play, Create, Voice, Stream, Words, Look, Lead — each group lists 5–8 tags (fighting games, singing, narrative design, cosplay, community organising, etc.). She picks whatever resonates.
- **OR she writes her own description.** "I compete in MK1, sing on weekends, and love dressing up as characters. Curious whether voice acting in games is a real career." The system extracts tags from her text (rule-based initially; LLM-assisted later).
- **OR both.** Most members will pick a few tags and write a sentence.

### The system draws her map

- **Primary ring:** tags she declared.
- **Derived ring:** tags extracted from her own-words description.
- **Adjacent ring:** tags related to hers that she hasn't picked yet — suggestions, not obligations.

### Activity proves the map

Every registration, attendance, submission, contribution creates a row in `activities`. The map stays accurate over time because it's partly derived from real behaviour, not just declared preference.

### The matching engine

Matching opportunities to members is a tag-overlap query, filtered by country, language (crucial — Cameroon is francophone), availability, and stage-of-life cues (student vs. working professional). Every match surfaces a one-line "why you" so she sees the reasoning — "Matches you: you play MK1 + PH local" — not a black-box recommendation.

---

## 4. Federation architecture — how orgs share the platform

This is the structural spine of the build. Get this right and everything else falls into place.

### Organisation types

```
umbrella    — FIGN itself (there is exactly one)
member_org  — Independent women-in-gaming orgs that have agreed to operate
              under FIGN for pan-African activities. Examples: Femmes aux
              Consoles (CM), Bambina.
partner     — Studios, tournament orgs, sponsors, media. They contribute
              opportunities but aren't women-in-gaming orgs themselves.
              Examples: Nexal Gaming, Juju Games, Garden City Esports,
              Daimyo Arena, Phygital Nigeria, Ingage.gg, IGDA Foundation.
chapter     — A country-or-city node under FIGN directly (e.g. FIGN Lagos,
              FIGN Accra). Different from a member_org: a chapter IS FIGN
              locally. A member_org is a peer.
```

### Key principle: attribution is always visible

Every event, workshop, opportunity, or post carries its host org's brand on the card header. Co-hosts and endorsers appear as smaller chips. A FIGN member always knows "this is a Femmes aux Consoles workshop endorsed by FIGN and Bambina" at a glance. Partners are never invisible. Member orgs never feel like they've been assimilated.

### Registration: adaptive, per org's preference

- Some orgs want registrations on their own system (Daimyo Arena has ticketing, Nexal has their own flow). For these, FIGN links out and requests a post-event attendance list to credit members' trails. *Webhook integration where possible, CSV upload where not.*
- Some orgs will happily use FIGN's built-in registration flow because they don't have one. For these, FIGN handles registration and hands the attendee list back.
- The product adapts to the org. The org does not adapt to the product.

### Roster sovereignty

Each member org controls which of their members are visible on their org page, and in what detail. A FIGN member who joined via Femmes aux Consoles first is primarily visible under FAC's roster with her consent to be surfaced FIGN-wide. Member orgs never lose ownership of relationships they built.

---

## 5. Data model

```
organisations
  id · slug · name · type ENUM('umbrella', 'member_org', 'partner', 'chapter')
  country_code (nullable for pan-African) · language ('en', 'fr', 'multi')
  brand_color · logo_url · short_name · tagline
  registration_pref ENUM('own_system', 'fign_hosted', 'either')
  public_page_enabled · onboarded_at · status

org_admins
  org_id · member_id · role ENUM('owner', 'coordinator', 'poster')

members
  id · handle · name · email · phone · country · city
  language_pref · joined_at · primary_org_id (nullable)
  description_freetext · visibility_prefs
  xp · last_active_at

interest_tags
  id · slug · name · group ENUM('play','create','voice','stream','words','look','lead')
  color · adjacency_tags[]  -- precomputed "related tags"

member_tags
  member_id · tag_id · source ENUM('declared','derived','activity_inferred')
  confidence · added_at

activities               -- THE spine
  id · member_id · kind · title · description
  host_org_id · related_entity_id · related_entity_type
  xp_awarded · evidence_url · verified · verified_by · created_at

items                    -- the unified feed: events, workshops, gigs, calls, circles
  id · kind ENUM('tournament','workshop','game_night','stream_challenge',
                 'hackathon','school_tour','opportunity','scholarship',
                 'mentor_call','circle','announcement')
  title · hook · body · cover_url
  host_org_id · co_host_org_ids[] · endorsed_org_ids[]
  country · city · location_freetext · language
  when_start · when_end · rolling
  tags[] -- interest_tags slugs
  capacity · registration_url · registration_preference
  visibility ENUM('fign_network','host_members_only','public')
  posted_by · posted_at

item_registrations
  item_id · member_id · status · source ENUM('fign','external_webhook','csv_upload')
  registered_at · attended · verified_by

follows
  member_id · org_id · followed_at     -- she can follow orgs she cares about

org_impact_metrics        -- per-org nightly rollup
  org_id · metric_key · value · as_of

fign_impact_metrics       -- umbrella-level nightly rollup
  metric_key · value · as_of
```

The critical insight: `host_org_id` is on `items` and `activities`. Nothing in the database belongs to "FIGN" by default — it belongs to a specific org. FIGN itself is just another row in `organisations` (type = 'umbrella'). This means the same product surface renders a Femmes aux Consoles event or a Nexal tournament or a FIGN-hosted workshop — the card template is identical, only the host strip changes.

---

## 6. What makes this genuinely different

Stated plainly, because it matters that this isn't a repeat of what exists:

1. **No other African platform treats women-in-gaming orgs as peers under an umbrella.** Most frame themselves as the single brand. This is Shopify-style infrastructure for a movement.
2. **No other platform starts from "what do you love?" instead of "what's your career?"** Singing, cosplay, writing, and streaming are entry points equal to competing and coding.
3. **Registration adapts to the org, not the other way around.** Partners don't have to rebuild their flows; they get amplification without friction.
4. **Cross-org activity trail.** A woman's growth isn't locked inside one org. She competes in a Daimyo tournament, attends a Femmes aux Consoles workshop, lands a Juju Games audition, wins an IGDA scholarship — her trail shows all of it, and every host org gets credit.
5. **Impact is public, live, and attributed.** Partners find `/impact` without logging in. Every dollar / hour / slot they contribute has a public attribution page.

---

## 7. Phased roadmap

Each phase ends with a ship criterion you could show at a partner meeting.

### Phase 0 — Foundations (week 1–2)

- Supabase schema with organisations as first-class
- Auth: WhatsApp + email
- Landing page with three doors live at fign.org/app
- Admin tooling minimum: Sophia can create an org, link a partner, post an item
- Seed: FIGN as umbrella; 3 partner orgs (Nexal, Juju, Daimyo); 1 member org placeholder (Femmes aux Consoles pending their onboarding)

**Ship criteria:** Sophia can onboard Femmes aux Consoles in 20 minutes: their page goes live with their branding, they can post one event, the event shows on a test member's map with correct attribution.

### Phase 1 — The Woman's door (week 3–5)

- Interest tagging + own-words onboarding
- Tag-extraction rule set for common gaming interest terms
- The interest map rendered with declared + derived + adjacent rings
- Matched feed pulling from items across all orgs
- People panel matching on tag overlap + geography
- Activity trail aggregating across host orgs

**Ship criteria:** 20 real members onboard (mix of experienced and newcomers). Each sees ≥4 matched items on their map within 24 hours, at least one from a member org and one from a partner.

### Phase 2 — The Member Org's door (week 6–8)

- Full public org page at `/orgs/[slug]` with the org's branding
- Org admin panel: post items, manage roster, export attendance
- Webhook endpoints for orgs with their own registration systems
- CSV upload for orgs without webhooks
- Follow-an-org flow for members
- Per-org impact page

**Ship criteria:** Femmes aux Consoles onboards fully and posts 3 events. Bambina onboards. One additional member org in conversation by phase end.

### Phase 3 — The Partner's door (week 9–11)

- Partner admin panel: post opportunities with filters (country, interest, level)
- Application flow that respects partner's preferred route (internal vs external)
- Partner attribution pages under `/partners/[slug]`
- Live `/impact` with nightly rollups across umbrella + orgs + partners

**Ship criteria:** Nexal Gaming lists their next tournament through the panel. At least one paid gig (Juju Games VO audition) fills a slot via the platform. One partner names `/impact` in a renewal conversation.

### Phase 4 — Adjacency, safety, polish (week 12–14)

- Tag suggestion engine gets smarter (LLM-assisted extraction)
- Adjacent interests UI: "women with your interests also explore..."
- Consent and visibility controls on rosters
- Language: French surface for Francophone members (Cameroon, others)
- Mobile performance pass (3G first paint)

**Ship criteria:** Francophone onboarding works end-to-end. No member reports ever seeing someone she opted out from.

### Phase 5 — Flywheel (week 15+)

- Shared event calendar with RSS/iCal feeds any org can embed on their own site
- FIGN Playbook (open-source chapter toolkit as per deck)
- Summit invitation logic pulling from cross-org activity
- Fellowship program surface (per deck's 2027 announcement)

---

## 8. First-week seed content (this platform cannot launch empty)

- **Organisations:** FIGN (umbrella), 2 member orgs (Femmes aux Consoles + Bambina, co-created with them), 8 partners (Nexal, Daimyo, Garden City, Juju, Phygital NG, Ingage.gg, IGDA Foundation, Alliance Française PH).
- **Interest taxonomy:** 50+ tags across 7 groups, bilingual labels.
- **Items:** the 4 live events already on fign.org/events, plus 4 member-org items (FAC voice-acting workshop, Bambina cosplay circle, etc.), plus 4 partner opportunities (Juju VO audition, IGDA scholarship link, etc.).
- **30 seed members** manually migrated from WhatsApp community, onboarded with real interests (not stage-0'd).

---

## 9. Design principles — pinned above every screen

1. **Host org is always visible.** Every card, every link, every notification names the host. No anonymous FIGN-branded content when a member org or partner did the work.
2. **Interests, not tracks.** No member is asked "what's your career?" She's asked what she loves.
3. **Adaptation > standardisation.** The platform bends to the org's workflow, not the reverse.
4. **Editorial aesthetic, everywhere.** Cream paper, dark ink, serif italics, mono coordinates. Coral for warmth, green for agency. No neon, no gradients, no purple-gradient cliché.
5. **Public impact, private roster.** `/impact` is public. Member rosters and private mentor notes are not.
6. **Attribution compounds.** A woman's trail shows every host that contributed to her growth. An org's impact page shows every woman who grew because of their programs.
7. **Mobile first, 3G-friendly.** Every page paints meaningfully under bandwidth constraints.
8. **Language is not optional.** French from day one, Swahili / Portuguese / Arabic added as chapters activate.
9. **WhatsApp integration, not replacement.** Deep link to WhatsApp community; don't rebuild chat.
10. **Consent is granular.** Visibility in rosters, descriptions, activity trails — all opt-in, reversible.

---

## 10. The two hardest things about this build

Named honestly so nobody is surprised later.

**A. Onboarding member orgs is high-touch, not self-service.** Femmes aux Consoles, Bambina, and their peers will have questions, concerns about brand control, integration requirements, and legitimate fears about being absorbed. Every single member-org onboarding in year one is a conversation + a co-design session + a trial month. Budget for this in Sophia's time. This is not Shopify; we're earning trust, org by org, for the first 6–12 months.

**B. Keeping the interest graph fresh without a full ML team.** Tag extraction from free-text descriptions is easy to start (regex + synonym lists) but gets worse as members' language diverges. Plan now: start with simple extraction, commit to quarterly review of the tag taxonomy with members, add LLM-based extraction only after month 3.

---

## 11. The north-star moment — revised

A 16-year-old in Douala lands on fign.org. She picks the woman's door. She taps three tags — **singing**, **cosplay**, **voice acting (curious)** — and writes one sentence: *"I want to be a character in a game someday."* Her map draws. She sees: a Femmes aux Consoles voice acting workshop in French next week; a Bambina cosplay circle she can join tomorrow; a Juju Games VO audition she can apply for with Sophia's intro. Three women are surfaced as companions — one from FAC, one from Bambina, one from FIGN Lagos. She registers for the workshop on Femmes aux Consoles' own system. FAC gets a qualified registration; the umbrella gets a receipt; her trail begins. Nobody was assimilated. Everyone amplified. That's the platform working.

---

## 12. The learning layer — Skills Lab

Learning and growth are the point — not a side feature. This section specifies how they work.

### Where lessons live — two surfaces, one library

1. **Inline on the map home.** A Skills Lab strip surfaces 2–3 short lessons matched to her interests. Always short (under 30 min), always with a clear hook, always showing *why this*. This is for the woman who has 15 minutes and is curious.

2. **Dedicated `/learn` page.** The full library — every lesson, browsable by interest, host, format, length. Curricula (ordered paths co-authored by FIGN + an org, like "Voice acting · from curiosity to reel"). Her own skills graph in full. This is for the woman who wants to learn intentionally.

### Content strategy — own a core, federate the rest

FIGN owns a small, opinionated core library:

- The **welcome lessons** (how FIGN works, how the federation works, how to think about your map).
- **Digital safety** (ties to Alliance Française / French Embassy partnership content).
- **FIGN how-to** — hosting a play-night, welcoming newcomers, writing a good post. These teach members how to be effective participants and are core to our culture.

Everything else comes from three streams:

- **Member orgs and partners**, authored or co-authored. Femmes aux Consoles owns voice-acting content. Bambina owns cosplay. IGDA Foundation owns game dev basics. Ingage.gg owns casting and pro pathway. Each lesson carries its creator's brand.
- **Open source**, with attribution. CC-BY and CC-BY-SA content from the open web, curated and contextualised for the FIGN audience. Clearly labelled "Open source" with the original source linked.
- **Future commissioned work.** Sophia's editorial pick — commission lessons from trusted African women creators as budget allows. Rare, high-quality, paid.

### Content operations

This is a real workflow, not a wish. Sketching it so it doesn't become an afterthought:

- **Submission portal** for member orgs and partners to propose lessons (metadata + upload).
- **Review queue** — three-person review: a content reviewer (accuracy), a member reviewer (is this useful to real members?), and Sophia (brand fit).
- **Publishing checklist** — tags assigned, host attribution correct, length and format labeled, mobile-friendly, transcript available, language flagged.
- **Quarterly content review** — lessons that aren't getting completed or are being completed but not leading to action get retired or rewritten.

Start with 15–20 lessons at launch. Grow to 50 by month 3. 100+ by end of year one.

### The "what next?" moment — design philosophy

When a woman finishes a lesson, we do **not** push her into a next lesson. We do **not** show a progress bar and gamified streak. We offer **tailored options** and trust her to choose.

The options are drawn from a library of six types, tailored to the lesson content and her current state:

| Option type | What it looks like |
|---|---|
| **Make something** | Record, sketch, write — an artifact tied to what she just learned |
| **Reflect** | Three sentences about what surprised or challenged her |
| **Go further** | The natural next step — a longer cohort, a curriculum she could follow |
| **Take it live** | A real opportunity that uses what she just learned (a gig, an audition) |
| **Bring someone** | Invite a friend to take the lesson, or ask a member for a practice partner |
| **Just bookmark it** | Rest is valid. Save for later with no guilt. |

She picks zero, one, or many. No option is "better." The platform logs her choice as an activity (which adds to her trail) but does not judge it.

### Skills graph — evidence-backed claims

Every skill on her graph is a claim backed by evidence:

- Lessons completed (+ optional artifact)
- Events she participated in (verified by the host org)
- Peer endorsements (a mentor or collaborator wrote a note)
- Self-declared (clearly labeled so a viewer knows it's self-reported)

Skills appear as 5-level bars with evidence text beside them ("5 lessons · 8 matches" or "2 lessons · coach note"). She chooses which skills are visible on her public profile. Default is private.

No badges. No leaderboards. No "expert" titles until the evidence warrants it.

---

## 13. The three growth views — where each one lives

Per your answer, all three, surfaced in different places:

1. **Six months ago / today** — the narrative glance. Lives on the member home (or her private profile view). Private by default. Auto-generated: "then" is pulled from activities she *hadn't* done at the six-months-ago timestamp; "now" is pulled from her current trail + completed milestones. Optional manual override so she can edit what feels true.

2. **Skills graph** — the visual view. Lives on `/learn` in full, with a compact version on the map home. Public if she chooses. The most concrete view — evidence-backed, shareable, useful when applying for opportunities.

3. **Self-set milestones** — the personal view. Lives on the map home, beside her interests. She writes them herself in her own words ("I'll know I've grown when…"). The platform tracks quiet progress against each. She can add, edit, or retire any milestone at any time. These are the most intimate and honest of the three.

Each view answers a different question:
- "What's changed?" → six-months-ago view
- "What can I actually do?" → skills graph
- "Am I becoming who I want to be?" → milestones

---

## 14. Revised roadmap — where the learning layer fits

Phases 0–5 from Section 7 still hold, with learning woven in:

### Phase 1 (week 3–5) — Woman's door + Skills Lab inline

Add to Phase 1:
- Inline Skills Lab strip on the map home (2-3 matched lessons)
- Post-lesson "what next?" moment
- Self-set milestones panel
- Six-months-ago / today view (private)

**Ship criterion add:** 10 real members finish their first lesson and pick at least one option from the "what next?" moment. 50% set at least one self-written milestone.

### Phase 2.5 (week 8–9) — `/learn` full library

New phase inserted between member-org onboarding and partner surface. Scope:
- `/learn` page with browse, filters, curricula
- Full skills graph
- Content submission portal for orgs
- Review workflow
- First 20 lessons seeded (core 5 FIGN-owned + 15 from member orgs, partners, open source)

**Ship criterion:** 3 non-FIGN orgs have submitted at least one lesson each. 20 members have completed at least one curriculum lesson.

---

## 15. Content seeding — what must exist before Phase 1 ships

| Category | Count | Source |
|---|---|---|
| FIGN welcome lessons | 5 | Sophia + chapter leads write these |
| Digital safety | 3 | Alliance Française PH content, adapted |
| MK1 / FGC basics | 3 | Mix of open source + member-authored |
| Voice acting intro | 2 | Co-authored with Femmes aux Consoles |
| Cosplay starter | 2 | Co-authored with Bambina |
| Community hosting | 2 | FIGN-authored |
| Game dev intro (Unity, Godot) | 3 | IGDA Foundation + open source |

**Minimum 20 lessons at Phase 1 launch.** Below this, the inline Skills Lab strip looks empty and the library feels lifeless.

---

## 16. Design philosophy — learning layer additions

Extending Section 9 with three more principles:

11. **Tailored options, no prescription.** When a lesson ends, we offer doors; we do not push her through one. Her growth is hers.

12. **Own a core, federate the rest.** FIGN publishes only what is distinctive to FIGN. Everything else is attributed to its creator.

13. **Evidence over abstraction.** Skills are evidence-backed claims. No badges without proof. No levels without receipts.

---

## 17. The north-star moment — final revision

A 16-year-old in Douala lands on fign.org. She picks the woman's door. She taps three tags — singing, cosplay, voice acting (curious) — and writes one sentence: *"I want to be a character in a game someday."* Her map draws.

On her map home:
- **Interest map** with her three declared tags + two derived from her sentence ("voice acting", "character design")
- **Skills Lab strip** with three matched lessons: Femmes aux Consoles' *Cold-read a script*, Bambina's *Foam armour · starter pattern*, Juju Games' *Voice acting for games · intro*
- **Matched events:** FAC 4-week voice cohort, Bambina cosplay circle, Juju Games VO audition
- **Three companions:** Marie K. from FAC (voice actor, Douala), Salma from Bambina Accra (cosplayer), Ngozi in Port Harcourt (singer + gamer)
- **Self-set milestone field** waiting for her first "I'll know I've grown when…" line

She starts the voice-acting lesson. 14 minutes later, the "what next?" moment appears — six tailored doors. She picks two: record a 60-second cold read, and tag her friend Aisha from school. Not the cohort yet. Not the audition yet. She bookmarks those. Her trail now has an entry: "Finished *Voice acting for games · intro* · hosted by Juju Games · +30 XP." FAC gets a recorded audio artifact she just made. Aisha gets a message. The platform doesn't nudge further; it trusts her.

Three weeks later she comes back. Her map has grown — the "voice acting" tag is now solid coral, confirmed by activity. The skills bar shows "Cold-read a VO script · level 1 · 1 lesson + 1 artifact." She writes her first milestone: *"I'll know I've grown when I've recorded a real audition."* The FAC cohort invitation is still waiting.

That's the platform working.

---

*End of build plan v3 + v4 learning layer. A developer can scope against this directly. The three prototypes in this conversation — the three-sided landing, the member home with Skills Lab, and /learn — are concrete references for Phases 0, 1, and 2.5.*
