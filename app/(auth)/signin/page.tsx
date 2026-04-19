"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/map`,
      },
    });
    if (error) {
      setErrorMsg(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
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
        <Label color={C.coral}>FIGN · sign in</Label>
        <h1
          className="mt-3 font-display text-4xl italic leading-tight"
          style={{ color: C.inkOnDark }}
        >
          Open your <em style={{ color: C.coral }}>door</em>.
        </h1>
        <p className="mt-4 text-sm" style={{ color: C.inkOnDarkMute }}>
          We email you a one-time magic link. No passwords.
        </p>

        {status !== "sent" ? (
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
