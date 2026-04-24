"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { Logo } from "@/components/ui/Logo";

type OAuthProvider = "google" | "linkedin_oidc";

// `useSearchParams` requires a Suspense boundary to prerender. Top-level export
// is the boundary; the actual UI lives in <SignInCard /> below.
export default function SignInPage() {
  return (
    <Suspense fallback={<SignInShell />}>
      <SignInCard />
    </Suspense>
  );
}

function SignInCard() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/map";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  async function signInWithProvider(provider: OAuthProvider) {
    setOauthBusy(provider);
    setErrorMsg(null);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setOauthBusy(null);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: C.canvasDark, color: C.inkOnDark }}
    >
      <div
        className="w-full max-w-md p-8"
        style={{
          background: C.surfaceDark,
          border: `2px solid ${C.hairlineDark}`,
        }}
      >
        <div className="flex items-center gap-3">
          <Logo height={28} priority />
          <Label color={C.coral}>sign in</Label>
        </div>
        <h1
          className="mt-3 font-display text-4xl italic leading-tight"
          style={{ color: C.inkOnDark }}
        >
          Open your <em style={{ color: C.coral }}>door</em>.
        </h1>
        <p className="mt-4 text-sm" style={{ color: C.inkOnDarkMute }}>
          One tap with Google or LinkedIn — or we email you a one-time magic
          link. No passwords either way.
        </p>

        {status !== "sent" ? (
          <>
            <div className="mt-6 space-y-3">
              <OAuthButton
                provider="google"
                label="Continue with Google"
                busy={oauthBusy === "google"}
                disabled={oauthBusy !== null}
                onClick={() => signInWithProvider("google")}
                icon={<GoogleMark />}
              />
              <OAuthButton
                provider="linkedin_oidc"
                label="Continue with LinkedIn"
                busy={oauthBusy === "linkedin_oidc"}
                disabled={oauthBusy !== null}
                onClick={() => signInWithProvider("linkedin_oidc")}
                icon={<LinkedInMark />}
              />
            </div>

            <div
              className="mt-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] uppercase"
              style={{ color: C.inkOnDarkMute }}
            >
              <span className="h-px flex-1" style={{ background: C.hairlineDark }} />
              or
              <span className="h-px flex-1" style={{ background: C.hairlineDark }} />
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label color={C.inkOnDarkMute}>email</Label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@fign.org"
                className="mt-1 w-full px-3 py-2 text-base"
                style={{
                  background: C.surfaceDarkAlt,
                  color: C.inkOnDark,
                  border: `1.5px solid ${C.hairlineDark}`,
                }}
              />
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full font-mono text-[11px] tracking-[0.2em] uppercase font-bold px-4 py-3"
              style={{
                background: C.coral,
                color: C.inkOnDark,
                opacity: status === "sending" ? 0.6 : 1,
                cursor: status === "sending" ? "not-allowed" : "pointer",
              }}
            >
              {status === "sending" ? "sending..." : "send magic link →"}
            </button>
            {errorMsg && (
              <p className="text-sm" style={{ color: C.coral }}>
                {errorMsg}
              </p>
            )}
            </form>
          </>
        ) : (
          // Success state: light pink-wash card on the dark canvas. A small
          // threshold cue that "you've passed sign-in, the app starts soon."
          <div
            className="mt-6 p-4"
            style={{
              background: C.coralSoft,
              color: C.ink,
              border: `1.5px solid ${C.coral}`,
            }}
          >
            <Label color={C.coralDk}>check your inbox</Label>
            <p className="mt-2 text-sm" style={{ color: C.ink }}>
              A link is on its way to <strong>{email}</strong>. Click it and
              you&apos;ll be in.
            </p>
          </div>
        )}

        <p
          className="mt-6 pt-6 text-xs italic"
          style={{ color: C.inkOnDarkMute, borderTop: `1px solid ${C.hairlineDark}` }}
        >
          WhatsApp sign-in coming later in 2026 — email for now works
          everywhere.
        </p>
      </div>
    </div>
  );
}

// Skeleton shown while Suspense awaits search params during prerender.
// Renders the same outer chrome so there's no layout shift on hydration.
function SignInShell() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: C.canvasDark, color: C.inkOnDark }}
    >
      <div
        className="w-full max-w-md p-8"
        style={{ background: C.surfaceDark, border: `2px solid ${C.hairlineDark}` }}
      >
        <div className="flex items-center gap-3">
          <Logo height={28} priority />
          <Label color={C.coral}>sign in</Label>
        </div>
        <h1
          className="mt-3 font-display text-4xl italic leading-tight"
          style={{ color: C.inkOnDark }}
        >
          Open your <em style={{ color: C.coral }}>door</em>.
        </h1>
        <p
          className="mt-4 text-sm"
          style={{ color: C.inkOnDarkMute, opacity: 0.7 }}
        >
          Loading…
        </p>
      </div>
    </div>
  );
}

function OAuthButton({
  label,
  busy,
  disabled,
  onClick,
  icon,
}: {
  provider: OAuthProvider;
  label: string;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-medium"
      style={{
        background: C.surfaceDarkAlt,
        color: C.inkOnDark,
        border: `1.5px solid ${C.hairlineDark}`,
        opacity: disabled && !busy ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span aria-hidden className="inline-flex h-4 w-4 items-center justify-center">
        {icon}
      </span>
      {busy ? "redirecting..." : label}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" width="16" height="16" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
      <path fill="#0A66C2" d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
    </svg>
  );
}
