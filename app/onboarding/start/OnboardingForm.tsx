"use client";

import { useMemo, useState, useTransition } from "react";
import { C } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { completeOnboarding, extractTagsAction } from "./actions";

type Tag = { slug: string; name_en: string; group: string; color: string | null };
type Org = { id: string; name: string; type: string; short_name: string | null };

const GROUPS = ["play", "create", "voice", "stream", "words", "look", "lead"] as const;

const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: "NG", name: "Nigeria" },
  { code: "CM", name: "Cameroon" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "UG", name: "Uganda" },
  { code: "RW", name: "Rwanda" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "SN", name: "Senegal" },
];

export function OnboardingForm({
  email,
  tags,
  orgs,
}: {
  email: string;
  tags: Tag[];
  orgs: Org[];
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [country, setCountry] = useState("NG");
  const [city, setCity] = useState("");
  const [lang, setLang] = useState<"en" | "fr">("en");
  const [declared, setDeclared] = useState<Set<string>>(new Set());
  const [description, setDescription] = useState("");
  const [derived, setDerived] = useState<string[]>([]);
  const [milestone, setMilestone] = useState("");
  const [orgId, setOrgId] = useState<string | "">("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const groupedTags = useMemo(() => {
    const m: Record<string, Tag[]> = {};
    for (const t of tags) {
      (m[t.group] ??= []).push(t);
    }
    return m;
  }, [tags]);

  function toggleTag(slug: string) {
    setDeclared((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function onDescriptionBlur() {
    const text = description.trim();
    if (text.length < 10) return;
    const found = await extractTagsAction(text);
    setDerived(found.filter((s) => !declared.has(s)));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding({
          name: name.trim(),
          handle: handle.trim(),
          country,
          city: city.trim(),
          language_pref: lang,
          description: description.trim() || undefined,
          declared_slugs: Array.from(declared),
          first_milestone: milestone.trim() || undefined,
          primary_org_id: orgId || null,
        });
      } catch (e: unknown) {
        setError((e as Error).message);
      }
    });
  }

  const stepLabels = ["Basics", "Interests", "Own words", "Milestone", "Confirm"];

  return (
    <div
      className="min-h-screen flex items-center justify-center py-8 px-6"
      style={{ background: C.paper, color: C.ink }}
    >
      <div
        className="w-full max-w-2xl p-7 md:p-10"
        style={{ background: C.paperAlt, border: `2px solid ${C.ink}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <Label color={C.coral}>FIGN · onboarding</Label>
          <Label>
            step {step + 1} of {stepLabels.length}
          </Label>
        </div>
        <h1 className="font-display text-4xl md:text-5xl italic leading-tight">
          {step === 0 && "Start with the basics."}
          {step === 1 && (
            <>
              What do <em style={{ color: C.coral }}>you</em> love?
            </>
          )}
          {step === 2 && (
            <>
              Say it in <em style={{ color: C.coral }}>your own words</em>.
            </>
          )}
          {step === 3 && (
            <>
              I&apos;ll know I&apos;ve <em style={{ color: C.coral }}>grown</em> when…
            </>
          )}
          {step === 4 && (
            <>
              Ready?
            </>
          )}
        </h1>

        <div className="mt-2 mb-6 flex gap-1">
          {stepLabels.map((_l, i) => (
            <div
              key={i}
              className="flex-1 h-1"
              style={{
                background: i <= step ? C.coral : C.paperDk,
              }}
            />
          ))}
        </div>

        {/* STEP 0 — Basics */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="onboard-name">your name</Label>
              <input
                id="onboard-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amara Okonkwo"
                className="mt-1 w-full px-3 py-2"
                style={{ background: C.paper, border: `1.5px solid ${C.ink}` }}
              />
            </div>
            <div>
              <Label htmlFor="onboard-handle">handle</Label>
              <input
                id="onboard-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@amara.plays"
                className="mt-1 w-full px-3 py-2 font-mono"
                style={{ background: C.paper, border: `1.5px solid ${C.ink}` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="onboard-country">country</Label>
                <select
                  id="onboard-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 w-full px-3 py-2"
                  style={{ background: C.paper, border: `1.5px solid ${C.ink}` }}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="onboard-city">city</Label>
                <input
                  id="onboard-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Port Harcourt"
                  className="mt-1 w-full px-3 py-2"
                  style={{ background: C.paper, border: `1.5px solid ${C.ink}` }}
                />
              </div>
            </div>
            <div>
              <Label>preferred language</Label>
              <div className="mt-1 flex gap-2">
                {(["en", "fr"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2 cursor-pointer"
                    style={{
                      background: lang === l ? C.ink : "transparent",
                      color: lang === l ? C.paper : C.ink,
                      border: `1.5px solid ${C.ink}`,
                    }}
                  >
                    {l === "en" ? "English" : "Français"}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs italic" style={{ color: C.inkMute }}>
              Signed in as <strong>{email}</strong>
            </p>
          </div>
        )}

        {/* STEP 1 — Interests */}
        {step === 1 && (
          <div>
            <p className="text-sm" style={{ color: C.inkSoft }}>
              Pick whatever resonates. You can come back and change anything.
              {" "}
              <strong>{declared.size}</strong> picked.
            </p>
            <div className="mt-4 space-y-5">
              {GROUPS.map((g) => (
                <div key={g}>
                  <Label color={C.coral}>{g}</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(groupedTags[g] ?? []).map((t) => {
                      const on = declared.has(t.slug);
                      return (
                        <button
                          key={t.slug}
                          onClick={() => toggleTag(t.slug)}
                          className="font-mono text-[11px] tracking-wider px-2 py-1 cursor-pointer"
                          style={{
                            background: on ? (t.color ?? C.coral) : "transparent",
                            color: on ? C.paper : C.ink,
                            border: `1.5px solid ${on ? (t.color ?? C.coral) : `${C.ink}44`}`,
                          }}
                        >
                          {t.name_en}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Description */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: C.inkSoft }}>
              A sentence or two about what you love, what you&apos;re curious about,
              what you want to try. We&apos;ll find tags from your words.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={onDescriptionBlur}
              rows={5}
              className="w-full px-3 py-2 font-display italic"
              style={{ background: C.paper, border: `1.5px solid ${C.ink}` }}
              placeholder="I compete in MK1, sing on weekends, and love dressing up as characters. Curious whether voice acting in games is a real career."
            />
            {derived.length > 0 && (
              <div>
                <Label color={C.green}>we found these in your words</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {derived.map((slug) => (
                    <button
                      key={slug}
                      onClick={() => {
                        toggleTag(slug);
                        setDerived((d) => d.filter((s) => s !== slug));
                      }}
                      className="font-mono text-[11px] tracking-wider uppercase font-semibold px-2 py-1 cursor-pointer"
                      style={{
                        background: C.paper,
                        color: C.green,
                        border: `1.5px solid ${C.green}`,
                      }}
                    >
                      + {slug.replace(/-/g, " ")}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs italic" style={{ color: C.inkMute }}>
                  Tap to add to your declared interests.
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — First milestone */}
        {step === 3 && (
          <div>
            <p className="text-sm" style={{ color: C.inkSoft }}>
              Optional. You write this yourself; we don&apos;t give you templates.
              You can edit or retire it whenever.
            </p>
            <textarea
              value={milestone}
              onChange={(e) => setMilestone(e.target.value)}
              rows={3}
              className="mt-4 w-full px-3 py-2 font-display italic"
              style={{
                background: C.paper,
                border: `1.5px solid ${C.ink}`,
                fontSize: 18,
              }}
              placeholder="…when I can cast an MK1 match without freezing up."
            />
          </div>
        )}

        {/* STEP 4 — Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label>you</Label>
              <div className="text-[15px]" style={{ color: C.ink }}>
                {name}{" "}
                <span className="font-mono" style={{ color: C.inkMute }}>
                  {handle.startsWith("@") ? handle : `@${handle}`}
                </span>
              </div>
              <div className="text-sm" style={{ color: C.inkSoft }}>
                {city}, {country} · {lang === "fr" ? "Français" : "English"}
              </div>
            </div>
            <div>
              <Label>interests ({declared.size})</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {Array.from(declared).map((s) => (
                  <span
                    key={s}
                    className="font-mono text-[10px] tracking-wider px-2 py-0.5"
                    style={{ color: C.paper, background: C.coral }}
                  >
                    {s.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </div>
            {description && (
              <div>
                <Label>in your own words</Label>
                <blockquote
                  className="mt-1 font-display italic text-[15px]"
                  style={{ color: C.ink }}
                >
                  &ldquo;{description}&rdquo;
                </blockquote>
              </div>
            )}
            {milestone && (
              <div>
                <Label>your first milestone</Label>
                <blockquote
                  className="mt-1 font-display italic text-[15px]"
                  style={{ color: C.ink }}
                >
                  &ldquo;{milestone}&rdquo;
                </blockquote>
              </div>
            )}
            <div>
              <Label>did a specific org bring you here? (optional)</Label>
              <select
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="mt-1 w-full px-3 py-2"
                style={{ background: C.paper, border: `1.5px solid ${C.ink}` }}
              >
                <option value="">— none / FIGN directly</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.type.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <p className="text-sm" style={{ color: C.coralDk }}>
                {error}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || isPending}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-3 py-2 cursor-pointer"
            style={{
              background: "transparent",
              color: step === 0 ? C.inkMute : C.ink,
              border: `1.5px solid ${step === 0 ? C.inkMute : C.ink}`,
              opacity: step === 0 ? 0.5 : 1,
            }}
          >
            ← back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 0 && (!name || !handle || !city)) ||
                isPending
              }
              className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-4 py-2 cursor-pointer"
              style={{
                background: C.ink,
                color: C.paper,
                opacity:
                  (step === 0 && (!name || !handle || !city)) || isPending ? 0.5 : 1,
              }}
            >
              next →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={isPending || !name || !handle || !city}
              className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold px-4 py-3 cursor-pointer"
              style={{
                background: C.coral,
                color: C.paper,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? "opening your map…" : "open my map →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
