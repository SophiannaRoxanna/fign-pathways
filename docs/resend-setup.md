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
4. Copy the key. Resend shows it once. re_LpdZsZmH_EZwoYFnMDUQvmHbxib96CAW1

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
