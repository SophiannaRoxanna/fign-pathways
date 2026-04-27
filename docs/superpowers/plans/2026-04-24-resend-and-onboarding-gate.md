# Resend SMTP + post-login onboarding gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unblock public signup by routing magic-link delivery through Resend SMTP and enforcing onboarding completion at the middleware layer.

**Architecture:** Four units land in dependency order — (A) a diagnostic pass that may produce a migration, (B) a `proxy.ts` middleware addition that bounces authed-but-not-onboarded users to `/onboarding/start`, (C) a v4 pink+purple rewrite of the magic-link email HTML, (D) an operator runbook for the Supabase → Resend SMTP swap. Units A–C are code; D is documentation only.

**Tech Stack:** Next.js 16 (App Router), Supabase SSR (`@supabase/ssr` 0.10), Supabase Postgres + RLS, Resend (external SMTP), Tailwind v4, pnpm. Email HTML is table-based for inbox client compatibility.

**Spec:** [docs/superpowers/specs/2026-04-24-resend-and-onboarding-gate-design.md](../specs/2026-04-24-resend-and-onboarding-gate-design.md)

**Reference files:**
- [`proxy.ts`](../../../proxy.ts) — Next.js middleware, currently auth-only
- [`app/auth/callback/route.ts`](../../../app/auth/callback/route.ts) — magic-link callback, redirects new users to `/onboarding/start`
- [`app/(member)/layout.tsx`](../../../app/(member)/layout.tsx) — already redirects no-member users; middleware gate is defense-in-depth
- [`reference/email-magic-link.html`](../../../reference/email-magic-link.html) — current v3 template (cream/coral)
- [`lib/design/tokens.ts`](../../../lib/design/tokens.ts) — palette source of truth
- [`supabase/migrations/`](../../../supabase/migrations/) — schema; check for any `auth.users` trigger creating member rows

**Note on tests:** This repo has no unit test framework. "Verify" steps use `pnpm build`, `pnpm lint`, and a manual browser checklist. Don't add a test framework as part of this plan.

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `proxy.ts` | Modify | Add onboarding-row check after the existing auth check; redirect missing-member users to `/onboarding/start` |
| `reference/email-magic-link.html` | Rewrite | v4 pink+purple magic-link email template, table-based for email-client compat |
| `docs/resend-setup.md` | Create | Operator runbook for swapping Supabase SMTP to Resend |
| `supabase/migrations/0008_drop_auto_member_trigger.sql` | **Conditional** — only if Task 0 finds an `auth.users` trigger that auto-inserts members | Drops the offending trigger so onboarding is the only insert path |

---

## Task 0: Diagnostic pass

**Goal:** Determine whether anything outside `completeOnboarding` is creating `members` rows. Decides whether Task 5 (drop-trigger migration) is needed.

**Files:**
- Read only: `supabase/migrations/*.sql`, `app/onboarding/start/actions.ts`, `supabase/seed/run.ts`, `lib/supabase/client.ts`

- [ ] **Step 0.1: Grep migrations for triggers on `auth.users`**

```bash
grep -nEi 'on auth\.users|create trigger.*auth\.users|insert into (public\.)?members' supabase/migrations/*.sql
```

Expected: probably no hits. If a `create trigger ... on auth.users` is found that inserts into `members`, record the migration filename and trigger name in your scratch notes — Task 5 becomes required.

- [ ] **Step 0.2: Confirm `completeOnboarding` is the only insert path**

Open `app/onboarding/start/actions.ts`. Confirm it calls `supabase.rpc("onboard_member", …)`.

```bash
grep -rn 'rpc.*onboard_member\|insert.*into members\|from("members").*insert' app/ lib/ supabase/migrations/
```

Expected: the `completeOnboarding` action is the only client-side caller, and one `create function onboard_member` definition lives in `supabase/migrations/0004_functions.sql` (or similar). Note the migration file name in your scratch notes.

- [ ] **Step 0.3: Confirm seed does not pre-create member rows for live auth users**

```bash
grep -nEi 'insert into (public\.)?members|members.*insert' supabase/seed/run.ts supabase/seed/*.json 2>/dev/null
```

Expected: seed may insert demo members but they should not collide with real auth.users IDs. If seed inserts a member with the same UUID a real user would get, document it but do not change seed in this plan.

- [ ] **Step 0.4: Confirm OAuth flow uses PKCE (`?code=…`), not implicit hash**

Open `lib/supabase/client.ts`. The browser client should use `createBrowserClient` from `@supabase/ssr`, which defaults to PKCE in v0.10. If it uses the older `createClient` with `flowType: "implicit"`, that is the OAuth-skip-callback bug — record it. (Most likely it is already PKCE. Just confirm.)

- [ ] **Step 0.5: Write diagnostic findings into the plan**

In this file, replace the placeholder under "Task 0 findings" below with one of two outcomes:

```
- No auth.users trigger found. Task 5 (drop-trigger migration) is SKIPPED.
- Seed/RPC paths are clean. Onboarding is the sole `members` insert path.
- OAuth uses PKCE.
```

OR (if a trigger was found):

```
- Trigger found: `<trigger_name>` in `supabase/migrations/<file>.sql`. Task 5 IS REQUIRED.
- (other findings…)
```

- [ ] **Step 0.6: Commit**

```bash
git add docs/superpowers/plans/2026-04-24-resend-and-onboarding-gate.md
git commit -m "chore(plan): record diagnostic findings for resend+onboarding gate"
```

### Task 0 findings

- No `auth.users` trigger that inserts into `members` was found. Task 5 (drop-trigger migration) is **SKIPPED**.
- `completeOnboarding` (via the `onboard_member` RPC defined in `supabase/migrations/0004_functions.sql`) is the only insert path into `members`. The RPC body at line 417 contains the sole `INSERT INTO members(…)` statement across all migrations and app code.
- Seed has two paths into `members`: the bulk-member loop via the `onboard_member` RPC (lines 268–281), and a direct `.from("members").upsert()` at `supabase/seed/run.ts:300–312` for the umbrella admin (Sophia's operator row). The umbrella-admin upsert runs only against local/seed environments, not against real public signups, so it does not bypass onboarding for any real user. **Practical impact for the post-login onboarding gate: none.**
- OAuth uses PKCE via `createBrowserClient` from `@supabase/ssr` (`lib/supabase/client.ts`). No legacy `flowType: "implicit"` present.

---

## Task 1: Middleware onboarding gate (Unit B)

**Goal:** In `proxy.ts`, redirect any authed user without a `members` row to `/onboarding/start` for protected paths.

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1.1: Read the current `proxy.ts`**

Open `proxy.ts`. Confirm the structure: it builds a `supabase` server client, calls `getUser()`, defines `isProtected`, redirects unauthed users on protected paths to `/signin`, and redirects authed users on `/signin` to `/map`.

- [ ] **Step 1.2: Add the onboarding gate**

Edit `proxy.ts`. After the existing `if (!user && isProtected) { … }` block and BEFORE the existing `if (user && path === "/signin") { … }` block, insert this block:

```ts
  // Authed user on a protected surface but no member row yet → bounce to onboarding.
  // /onboarding/* is always allowed; /auth/* is the magic-link callback path.
  if (
    user &&
    isProtected &&
    !path.startsWith("/onboarding") &&
    !path.startsWith("/auth")
  ) {
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!member) {
      const onboard = req.nextUrl.clone();
      onboard.pathname = "/onboarding/start";
      onboard.search = "";
      return NextResponse.redirect(onboard);
    }
  }
```

The full updated middleware body should now be (showing the inserted block in context):

```ts
  const { data: { user } } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;
  const isProtected =
    path.startsWith("/map") ||
    path.startsWith("/events") ||
    path.startsWith("/people") ||
    path.startsWith("/orgs-follow") ||
    path.startsWith("/me") ||
    path.startsWith("/lessons") ||
    path.startsWith("/onboarding") ||
    path.startsWith("/admin");

  if (!user && isProtected) {
    const signin = req.nextUrl.clone();
    signin.pathname = "/signin";
    signin.searchParams.set("next", path);
    return NextResponse.redirect(signin);
  }

  // Authed user on a protected surface but no member row yet → bounce to onboarding.
  if (
    user &&
    isProtected &&
    !path.startsWith("/onboarding") &&
    !path.startsWith("/auth")
  ) {
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (!member) {
      const onboard = req.nextUrl.clone();
      onboard.pathname = "/onboarding/start";
      onboard.search = "";
      return NextResponse.redirect(onboard);
    }
  }

  // Already-authenticated users visiting /signin bounce to /map.
  if (user && path === "/signin") {
    const map = req.nextUrl.clone();
    map.pathname = "/map";
    return NextResponse.redirect(map);
  }

  return response;
```

- [ ] **Step 1.3: Typecheck and lint**

```bash
pnpm lint
pnpm exec tsc --noEmit
```

Expected: both pass with no errors. If `tsc --noEmit` flags an issue with `req.nextUrl.clone()`, it's identical to the existing usages in the same file — re-read the diff to spot a typo.

- [ ] **Step 1.4: Build**

```bash
pnpm build
```

Expected: build succeeds. Next.js will report middleware in the build summary.

- [ ] **Step 1.5: Manual verification — fresh user is gated**

This requires a fresh test account with no `members` row.

1. Start the dev server: `pnpm dev`
2. Use `/api/dev-signin?email=test-newuser@example.com` (dev-only; mints a session without sending email).
3. Once the redirect lands on `/onboarding/start`, manually navigate to `http://localhost:3000/map` in the browser address bar.
4. Expected: immediate redirect back to `/onboarding/start`. Repeat for `/events`, `/people`, `/orgs-follow`, `/me`, `/lessons/anything`.
5. Open the Network tab and confirm each navigation shows a 307/308 to `/onboarding/start` before any page renders.

- [ ] **Step 1.6: Manual verification — onboarded user is not redirect-looped**

1. Complete the onboarding form for the test user (any tags, any milestone — just so the `members` row gets inserted).
2. After submission, you land on `/map`.
3. Navigate to `/events`, `/people`, `/me`. Each should render normally — no redirect to `/onboarding/start`.
4. Sign out (if a sign-out button exists; otherwise clear cookies). Sign in again with the same account. You should land on `/map`, not `/onboarding/start`.

- [ ] **Step 1.7: Commit**

```bash
git add proxy.ts
git commit -m "feat(auth): middleware-level onboarding gate for authed users"
```

---

## Task 2: v4 pink+purple email template (Unit C)

**Goal:** Rewrite `reference/email-magic-link.html` to use the v4 palette and email-client-safe fonts.

**Files:**
- Rewrite: `reference/email-magic-link.html`

- [ ] **Step 2.1: Replace the file contents**

Overwrite `reference/email-magic-link.html` with exactly this:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Open your door to FIGN</title>
  </head>
  <body style="margin:0;padding:0;background:#FEFCFD;color:#120B17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FEFCFD;padding:48px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#F7F2F9;border:1.5px solid #120B17;">
            <tr>
              <td style="padding:32px 32px 0;">
                <div style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#CC1F74;font-weight:bold;">
                  FIGN &middot; magic link
                </div>
                <h1 style="margin:16px 0 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:500;font-size:32px;line-height:1.08;color:#120B17;">
                  Open your <span style="color:#CC1F74;">door</span>.
                </h1>
                <p style="margin:20px 0 0;font-size:15px;line-height:1.6;color:#3B3540;">
                  Tap the button below to sign in to FIGN. No password, no passphrase &mdash; just this one-time link.
                </p>
                <p style="margin:28px 0 0;">
                  <a href="{{ .ConfirmationURL }}"
                     style="display:inline-block;background:#CC1F74;color:#FEFCFD;padding:14px 22px;
                            font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.2em;
                            text-transform:uppercase;font-weight:bold;text-decoration:none;">
                    Open my door &rarr;
                  </a>
                </p>
                <p style="margin:22px 0 0;font-size:13px;color:#7D7686;font-style:italic;line-height:1.5;">
                  If you didn&rsquo;t ask for this, you can safely ignore it. The link expires in 1 hour.
                </p>
                <div style="margin:32px 0 0;padding:18px 0 32px;border-top:1px solid #E5DBEA;font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#7D7686;">
                  Federation, not a funnel. &middot; fign.org
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

The differences from the existing v3 template are deliberate:
- Body `font-family` is now a system-sans stack (was Georgia serif). Body copy reads better in sans on email; the heading keeps Georgia italic.
- All hex tokens already match v4 (`#FF2F92`, `#CC1F74`, `#FEFCFD`, `#F7F2F9`, `#120B17`, `#3B3540`, `#7D7686`, `#E5DBEA`) — verify each line. The previous template was already v4-aligned in colour but inconsistently typed.

- [ ] **Step 2.2: Verify token-by-token**

Re-open the file. Spot-check that these exact hex values appear and no v3 token (`#FFE9DD`, `#9B2C24`, etc.) leaks in:

```bash
grep -nE '#FFE9DD|#9B2C24|#F8F4EE|#1A1410' reference/email-magic-link.html || echo "clean"
grep -nE '#FF2F92|#CC1F74|#FEFCFD|#F7F2F9|#120B17' reference/email-magic-link.html
```

Expected: first command prints `clean`. Second command prints lines containing each token at least once.

- [ ] **Step 2.3: Render check (manual, browser)**

1. Open `reference/email-magic-link.html` directly in a browser (file://). Confirm:
   - Pink "Open my door →" button is `#FF2F92` (saturated pink, not red).
   - Heading "Open your **door**." has italic Georgia, "door" in deep pink.
   - Card has a thin near-black border on a near-white canvas.
   - Footer reads `Federation, not a funnel. · fign.org` in muted purple-grey mono.

- [ ] **Step 2.4: Commit**

```bash
git add reference/email-magic-link.html
git commit -m "feat(email): v4 pink+purple magic-link template"
```

---

## Task 3: Resend setup runbook (Unit D)

**Goal:** Create `docs/resend-setup.md` so Sophia can swap Supabase SMTP to Resend without trial-and-error.

**Files:**
- Create: `docs/resend-setup.md`

- [ ] **Step 3.1: Create the file**

Write the file at `docs/resend-setup.md` with exactly this content:

````markdown
# Supabase → Resend SMTP swap

This is the operator runbook for routing FIGN's magic-link emails through Resend instead of Supabase's free-tier default SMTP. The default caps at ~2 emails/hour, which breaks any real signup wave.

The FIGN app does **not** call Resend directly. Supabase still owns email delivery; Resend is the SMTP transport. There is no `RESEND_API_KEY` in `.env.local`.

## Prerequisites

- Resend account (https://resend.com).
- Ability to add DNS records on the `fign.org` zone.
- Supabase project owner access for the FIGN project.

## 1. Create Resend API key

1. Resend dashboard → **API Keys** → **Create API Key**.
2. Name: `supabase-fign-prod`.
3. Permission: **Sending access** (not Full access).
4. Copy the key. Resend shows it once.

The key goes into Supabase's SMTP password field in step 4. Do not paste it into `.env.local`.

## 2. Verify the sender domain in Resend

1. Resend dashboard → **Domains** → **Add Domain** → `fign.org`.
2. Resend lists three DNS records: an SPF TXT, a DKIM TXT, and a return-path MX (or CNAME).
3. Paste each record into your DNS provider (e.g. Cloudflare, Namecheap). Use TTL 3600.
4. In Resend, click **Verify**. SPF and DKIM usually verify within 5–30 minutes; return-path can take up to 24h.
5. Wait until all three records show **Verified** before continuing. If you continue early, Supabase will appear to send but messages will land in spam or bounce.

## 3. Configure Supabase SMTP

1. Supabase dashboard → your FIGN project → **Project Settings** → **Auth** → **SMTP Settings**.
2. Toggle **Enable Custom SMTP** to ON.
3. Fill the fields:

| Field | Value |
|---|---|
| Sender name | `FIGN` |
| Sender email | `noreply@fign.org` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | _(paste the API key from step 1)_ |
| Minimum interval between emails | leave default |

4. Click **Save**. Supabase verifies the connection on save; an error here usually means the password (API key) was pasted wrong or the domain is not yet verified in Resend.

## 4. Update the magic-link email template

1. Supabase dashboard → **Auth** → **Email Templates** → **Magic Link**.
2. **Subject:** `Open your door to FIGN`
3. **Message body:** open `reference/email-magic-link.html` from this repo, copy the entire file, paste it into the Supabase template editor.
4. Confirm the body still contains `{{ .ConfirmationURL }}` exactly once (Supabase substitutes the per-user link at send time).
5. Click **Save**.

Repeat the same body for the **Confirm signup** template if Supabase has both enabled — same brand, same tone.

## 5. Test checklist

Run all five before announcing public signup:

- [ ] Sign in with a Gmail address → email lands in Inbox (not Spam) within 60 seconds.
- [ ] Sign in with a ProtonMail or Yahoo address → same result.
- [ ] Sign in with a `+test` alias → rejection or delivery is consistent (most providers accept).
- [ ] Click the magic link → for a brand-new email, redirect lands on `/onboarding/start`.
- [ ] Send 5 magic-link requests in 5 minutes from 5 different addresses → all 5 deliver. (This would have failed under default Supabase SMTP — the original blocker.)

## 6. Rollback

If Resend misbehaves and signup needs to keep working while you debug:

1. Supabase dashboard → **Auth** → **SMTP Settings** → toggle **Enable Custom SMTP** to OFF.
2. Save. Supabase reverts to its default SMTP. The old ~2/hour rate limit is back, but signup works for low traffic.
3. The custom SMTP fields stay populated — toggling back ON resumes Resend without re-entering them.

## Out of scope

- App-side `lib/email/` for transactional sends (event reminders, milestone nudges) — defer until needed.
- French translation of the magic-link email body — defer.
- Friendlier signin error UX when Supabase rejects an address — defer.
````

- [ ] **Step 3.2: Verify the file renders correctly**

```bash
ls -la docs/resend-setup.md
head -3 docs/resend-setup.md
```

Expected: file exists, first line is `# Supabase → Resend SMTP swap`.

- [ ] **Step 3.3: Commit**

```bash
git add docs/resend-setup.md
git commit -m "docs: resend SMTP setup runbook"
```

---

## Task 4: Final verification

**Goal:** Confirm the codebase still builds and lints cleanly after Tasks 1–3 land.

- [ ] **Step 4.1: Lint**

```bash
pnpm lint
```

Expected: no new errors. (Pre-existing warnings unrelated to this work are fine.)

- [ ] **Step 4.2: Typecheck**

```bash
pnpm exec tsc --noEmit
```

Expected: pass.

- [ ] **Step 4.3: Build**

```bash
pnpm build
```

Expected: succeeds. Note the middleware bundle size in the output — should be in the same order of magnitude as before (single extra Supabase query, no new imports).

- [ ] **Step 4.4: End-to-end smoke test (manual)**

With Resend not yet wired (Task 3 is operator-side), use `/api/dev-signin` to simulate the post-callback flow:

1. `pnpm dev`.
2. Visit `http://localhost:3000/api/dev-signin?email=fresh-test@example.com` → should land on `/onboarding/start`.
3. Without completing onboarding, manually visit `/map`. Expected: immediate redirect to `/onboarding/start`.
4. Complete the onboarding form. Expected: land on `/map` and stay there.
5. Manually visit `/events`, `/me`, `/lessons/intro-to-mk1` (or any seeded lesson). Expected: render normally.

- [ ] **Step 4.5: Confirm Task 0 findings are filled in**

Re-open this plan file. Confirm the "Task 0 findings" section near the top is no longer the placeholder.

---

## Task 5 (CONDITIONAL): Drop auto-member-creation trigger

**Run this task only if Task 0 found a trigger on `auth.users` that auto-inserts a `members` row.** Otherwise skip entirely.

**Files:**
- Create: `supabase/migrations/0008_drop_auto_member_trigger.sql`

- [ ] **Step 5.1: Write the migration**

Replace `<TRIGGER_NAME>` and `<FUNCTION_NAME>` with the exact identifiers found in Step 0.1. Write to `supabase/migrations/0008_drop_auto_member_trigger.sql`:

```sql
-- Drops the auto-insert trigger on auth.users that pre-created members rows.
-- Onboarding (the `onboard_member` RPC called from /onboarding/start) is now
-- the only insert path, so first-time users always reach the onboarding form.
drop trigger if exists <TRIGGER_NAME> on auth.users;
drop function if exists public.<FUNCTION_NAME>();
```

If the function is in a different schema or has arguments, adjust the `drop function` line accordingly. If the trigger fires `before` and a function-only drop would orphan it, the `drop trigger` line above handles it first.

- [ ] **Step 5.2: Apply locally**

```bash
pnpm supabase db reset
# or, if not using the local supabase CLI flow, apply via the Supabase dashboard SQL editor.
```

Expected: reset succeeds; no errors. If the seed runs `pnpm seed` after reset, run it now.

- [ ] **Step 5.3: Verify trigger is gone**

In the Supabase SQL editor (or psql):

```sql
select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
```

Expected: the dropped trigger no longer appears.

- [ ] **Step 5.4: Re-run Task 1 manual verification (Step 1.5)**

Sign in via `/api/dev-signin` with a brand-new email. Expected: redirect to `/onboarding/start`, not `/map`. The trigger removal closes the original "lands on /map" loophole; the middleware gate from Task 1 is still the safety net.

- [ ] **Step 5.5: Commit**

```bash
git add supabase/migrations/0008_drop_auto_member_trigger.sql
git commit -m "fix(db): drop auto-member-creation trigger so onboarding is the sole insert path"
```

- [ ] **Step 5.6: Apply to production Supabase**

In the Supabase dashboard → **Database** → **Migrations**, run the new migration on the production project. Verify with the same `pg_trigger` query against production.

---

## Self-Review

**Spec coverage:**
- Unit A (diagnostic) → Task 0 ✓
- Unit B (middleware gate) → Task 1 ✓
- Unit C (v4 email template) → Task 2 ✓
- Unit D (Resend runbook) → Task 3 ✓
- Drop trigger if found → Task 5 (conditional) ✓
- Final verify → Task 4 ✓

**Out-of-scope items confirmed deferred:** friendlier signin error UX, app-side email lib, French translation, DNS-helper UI page. All called out in spec and in `docs/resend-setup.md`.

**Placeholder scan:** "Task 0 findings" is intentionally a placeholder, filled by Step 0.5. No other TBD/TODO/`<FILL_IN>` outside Task 5's `<TRIGGER_NAME>`/`<FUNCTION_NAME>` (also intentionally filled at execution).

**Type/identifier consistency:** Middleware uses `members.id` (uuid PK to `auth.users.id`) consistent with `0001_schema_federation.sql:57`. The `maybeSingle()` call in proxy.ts mirrors the existing pattern in `app/(member)/layout.tsx:23`.
