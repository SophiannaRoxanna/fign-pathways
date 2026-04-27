# Resend SMTP + post-login onboarding gate

**Date:** 2026-04-24
**Owner:** Sophia
**Status:** Design — pending implementation

## Problem

Two coupled issues block public signup on FIGN:

1. **Magic-link delivery is rate-limited.** Supabase free-tier SMTP caps at ~2 emails/hour. Any real signup wave fails silently. Parked since 2026-04-20.
2. **Post-login routing isn't fully enforced.** A first-time user should land on `/onboarding/start` to fill name, interests, and a milestone. A returning user should go to their dashboard at `/map`. Today the routing exists in `/auth/callback` and `app/(member)/layout.tsx`, but there is no middleware-level gate, so any bug or stale `members` row lets a half-signed-up user skate past onboarding.

Both must be solved before public signup is opened.

## Goals

- Magic-link emails deliver reliably under signup load via Resend SMTP.
- The magic-link email reflects the v4 pink + purple brand, not the v3 cream/coral template.
- Every authed user without a `members` row is bounced to `/onboarding/start`, regardless of which surface they navigate to.
- A diagnostic pass identifies the actual cause of any "new user lands on /map" reports so we don't ship a workaround on top of an unknown bug.

## Non-goals

- No new fields on the onboarding form (current 5-step form is in scope as-is).
- No app-side transactional email library — Supabase still owns magic-link delivery; Resend is just the SMTP transport.
- No changes to `/api/dev-signin`.
- No friendlier signin error UX in this round (deferred).
- No DNS-record helper page in-app — DNS records are listed in the runbook and pasted into the user's DNS provider manually.

## Audience

Primary: African women and girls signing up via member orgs (Femmes aux Consoles, Bambina, FIGN chapters). Phone-first, often on 3G, bilingual EN/FR.

Secondary: Sophia (operator of the Resend account + DNS).

## Architecture

Four units, each independently testable:

### Unit A — Diagnostic pass

A one-shot investigation, not shipped code. Outputs a short note in the implementation plan:

1. Grep `supabase/migrations/*.sql` for any trigger on `auth.users` that auto-inserts into `members`. If found, that trigger is the cause of "new user already has a members row."
2. Read the `completeOnboarding` server action to confirm it is the only insert path into `members`.
3. Inspect `supabase/seed/run.ts` to see whether seeded users get pre-created member rows that would skip onboarding.
4. Verify Supabase OAuth uses PKCE (`?code=…`), not implicit hash flow that would bypass `/auth/callback`.

The diagnostic determines whether Unit B is sufficient or whether a trigger/seed change is also needed. Either outcome is acceptable; the unit's job is to make the choice explicit.

### Unit B — Middleware onboarding gate

Modify [`proxy.ts`](../../../proxy.ts) to add a single onboarding check after the existing auth check.

Behavior:
- For authed users on a protected path, query `members` for the current user.
- If no row exists and the path is not already `/onboarding/*` or `/auth/*`, redirect to `/onboarding/start`. (`/signin` is not protected, so it is naturally excluded.)
- If a row exists, fall through (existing behavior).
- For unauthed users, existing behavior is unchanged.

Interface:
```ts
// after the existing user-fetch + isProtected check, before the existing authed-on-/signin redirect
if (user && isProtected && !path.startsWith("/onboarding") && !path.startsWith("/auth")) {
  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!member) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding/start";
    url.search = "";
    return NextResponse.redirect(url);
  }
}
```

Cost: one extra Supabase query per protected request for users who haven't onboarded. Once a member row exists, the query still runs but is cheap (indexed by primary key) and returns immediately.

Why middleware, not just per-layout: `app/(member)/layout.tsx` already does this check, but the middleware gate guarantees the rule even if a future surface is added outside the `(member)` route group, and it removes one round-trip for users who'd otherwise render a member layout only to be redirected away.

Dependencies: none new. Uses the existing `createServerClient` already in `proxy.ts`.

### Unit C — Email template v4 rewrite

Rewrite [`reference/email-magic-link.html`](../../../reference/email-magic-link.html) to use the v4 pink + purple palette and Manrope-style fallback fonts.

Tokens (mirrored from `lib/design/tokens.ts`):

| Element | Token | Hex |
|---|---|---|
| Canvas | paper | `#FEFCFD` |
| Card surface | paperAlt | `#F7F2F9` |
| Border, body text | ink | `#120B17` |
| Body soft | inkSoft | `#3B3540` |
| Caption mute | inkMute | `#7D7686` |
| Hairline | hairline | `#E5DBEA` |
| Accent (heading "door", kicker) | coralDk | `#CC1F74` |
| CTA button bg | coral | `#FF2F92` |
| CTA button text | paper | `#FEFCFD` |

Compositional rules:
- 1.5px ink border on the card.
- No border-radius on the card. Tag-style chips would be the only place radius is allowed; this template has none.
- Heading uses Georgia italic fallback (email clients reliably render Georgia; Bricolage is web-only).
- Body uses `-apple-system, "Helvetica Neue", Arial, sans-serif` (Manrope is web-only).
- Kicker label and footer use `Courier New` mono, 10px, 0.22em letter-spacing, uppercase.
- Subject line is set in Supabase, not the HTML — runbook covers it.

Copy:
- Kicker: `FIGN · magic link`
- Heading: `Open your door.` with `door` in `coralDk`
- Body: `Tap the button below to sign in to FIGN. No password, no passphrase — just this one-time link.`
- CTA: `Open my door →`
- Expiry note: `If you didn't ask for this, you can safely ignore it. The link expires in 1 hour.`
- Footer: `Federation, not a funnel. · fign.org`

Subject line (set in Supabase dashboard → Auth → Email Templates → Magic Link → Subject):
`Open your door to FIGN`

### Unit D — Resend SMTP runbook

New file `docs/resend-setup.md`. Operator-facing, not user-facing. Covers exact dashboard steps so Sophia can swap SMTP without trial-and-error.

Sections:

1. **Prerequisites** — Resend account, ability to edit DNS for `fign.org`.
2. **Create Resend API key** — Resend dashboard → API Keys → Create. Scope: "Sending access" only. Copy the key once (Resend won't show it again) — it goes into Supabase's SMTP password field in step 4. **It is not stored in `.env.local`** because the FIGN app never calls Resend directly; Supabase uses it as the SMTP password.
3. **Verify sender domain in Resend** — Resend dashboard → Domains → Add `fign.org`. Resend lists the SPF, DKIM, and return-path records to add. Paste these into your DNS provider. Wait for verification (usually <30 min).
4. **Configure Supabase SMTP** — Supabase dashboard → Project Settings → Auth → SMTP Settings:
   - Enable custom SMTP: ON
   - Sender name: `FIGN`
   - Sender email: `noreply@fign.org`
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: the Resend API key from step 2
5. **Update email templates** — Supabase dashboard → Auth → Email Templates → Magic Link:
   - Subject: `Open your door to FIGN`
   - Message body: paste the contents of `reference/email-magic-link.html`
6. **Test checklist**:
   - Sign in with a Gmail address; confirm delivery to inbox (not spam).
   - Sign in with a ProtonMail or Yahoo address; confirm delivery.
   - Click the link; confirm landing on `/onboarding/start` for a new user, `/map` for returning.
   - Send 5 magic-link requests in 5 minutes; confirm none rate-limited (this would have failed under the default Supabase SMTP).
7. **Rollback** — if Resend misbehaves, Supabase dashboard → Auth → SMTP → toggle "Enable custom SMTP" off. The default Supabase SMTP resumes; old rate limit returns but signup works.

The runbook is the deliverable for Unit D. No code changes.

## Data flow (post-implementation)

```
new user clicks "send magic link"
  → Supabase issues magiclink email via Resend SMTP
  → user clicks "Open my door →" in the v4-styled email
  → Supabase callback URL → /auth/callback?code=…
  → exchangeCodeForSession sets cookies
  → callback queries members; no row → redirect /onboarding/start

new user navigates anywhere else (e.g. opens /map directly):
  → proxy.ts checks auth: user is signed in
  → proxy.ts checks members row: missing
  → redirect /onboarding/start

returning user clicks magic link:
  → callback queries members; row exists → redirect /map (or ?next=…)

returning user navigates anywhere:
  → proxy.ts auth check passes
  → proxy.ts member check passes
  → page renders normally
```

## Error handling

- **Resend rejects an email** (bad address, hard bounce): Supabase surfaces this as a normal `signInWithOtp` error to the signin page. Existing error display catches it. Out of scope: friendlier copy.
- **Resend API key revoked**: Supabase fails to send; user sees the same error path. Rollback step in runbook resolves it within minutes.
- **Member-row check fails in middleware** (DB blip): the query returns null on error. Behavior: user is bounced to `/onboarding/start`. The onboarding page itself re-checks and redirects to `/map` if a row already exists. Worst case is a one-redirect detour, never lost data.
- **OAuth user without member row**: same path — bounced to `/onboarding/start`. The form pre-fills email from the session, name/handle/etc. from the form fields.

## Testing

- **Unit B middleware**: manual — sign in as a user with no member row; navigate directly to `/map`, `/events`, `/people`, `/lessons/<slug>`. Each should redirect to `/onboarding/start`. Then complete onboarding; navigate to `/map` and confirm no redirect loop.
- **Unit C email template**: render the HTML in Litmus or open in Gmail / Outlook web / Apple Mail / ProtonMail. Confirm the pink CTA button renders, the heading is italic, and no font fallback is dramatically broken.
- **Unit D runbook**: Sophia walks through it end-to-end on production Supabase.
- **Unit A diagnostic**: outputs are written into the implementation plan, not tested as code.

## Files touched

- `proxy.ts` — Unit B (modify).
- `reference/email-magic-link.html` — Unit C (rewrite in place).
- `docs/resend-setup.md` — Unit D (create).
- Supabase dashboard (Auth → SMTP, Auth → Email Templates) — Unit D (manual config, documented).
- `supabase/migrations/*.sql` — Unit A may surface a trigger to remove (if so, a new migration `0008_drop_auto_member_trigger.sql` is added).

## Open questions

None blocking. Optional follow-ups for a later round:
- Friendlier signin error UX (deferred §4 from brainstorming).
- French translation of the magic-link email body.
- App-side `lib/email/` for future transactional sends (event reminders, milestone nudges).
