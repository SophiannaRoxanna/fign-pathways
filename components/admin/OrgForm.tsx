"use client";

import { useState } from "react";
import { C, ORG_TYPE_COLOR } from "@/lib/design/tokens";
import { OrgChip } from "@/components/org/OrgChip";
import { Label } from "@/components/ui/Label";
import { Field, inputStyle, PrimaryButton, SecondaryButton } from "./form";
import type { Organisation } from "@/lib/supabase/types";

export type OrgFormInitial = Partial<Organisation>;

type Action = (formData: FormData) => void | Promise<void>;

export function OrgForm({
  initial,
  action,
  secondaryAction,
  secondaryLabel,
  submitLabel = "Save organisation",
  hiddenFields,
}: {
  initial?: OrgFormInitial;
  action: Action;
  secondaryAction?: Action;
  secondaryLabel?: string;
  submitLabel?: string;
  hiddenFields?: Record<string, string>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [shortName, setShortName] = useState(initial?.short_name ?? "");
  const [type, setType] = useState<string>(initial?.type ?? "member_org");
  const [brandColor, setBrandColor] = useState(
    initial?.brand_color ?? ORG_TYPE_COLOR[type] ?? C.purple,
  );

  const previewOrg = {
    name: name || "New organisation",
    short_name: shortName || null,
    type,
    brand_color: brandColor,
  };

  return (
    <form action={action} className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="slug" hint="lowercase-hyphen · unique">
            <input
              name="slug"
              required
              defaultValue={initial?.slug ?? ""}
              placeholder="femmes-aux-consoles"
              pattern="[a-z0-9\-]+"
              style={inputStyle}
            />
          </Field>
          <Field label="type">
            <select
              name="type"
              value={type}
              onChange={(e) => {
                const t = e.target.value;
                setType(t);
                if (!initial?.brand_color) {
                  setBrandColor(ORG_TYPE_COLOR[t] ?? C.purple);
                }
              }}
              style={inputStyle}
            >
              <option value="umbrella">umbrella</option>
              <option value="member_org">member_org</option>
              <option value="partner">partner</option>
              <option value="chapter">chapter</option>
              <option value="open">open</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="name">
            <input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Femmes aux Consoles"
              style={inputStyle}
            />
          </Field>
          <Field label="short name" hint="shows inside the org chip">
            <input
              name="short_name"
              value={shortName ?? ""}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="FAC"
              style={inputStyle}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="country code" hint="ISO-2, leave blank if pan-African">
            <input
              name="country_code"
              defaultValue={initial?.country_code ?? ""}
              maxLength={2}
              placeholder="CM"
              style={inputStyle}
            />
          </Field>
          <Field label="language">
            <select
              name="language"
              defaultValue={initial?.language ?? "en"}
              style={inputStyle}
            >
              <option value="en">en</option>
              <option value="fr">fr</option>
              <option value="multi">multi</option>
            </select>
          </Field>
          <Field label="brand colour">
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="brand_color"
                value={brandColor ?? ""}
                onChange={(e) => setBrandColor(e.target.value)}
                style={{
                  ...inputStyle,
                  padding: 2,
                  width: 52,
                  height: 40,
                }}
              />
              <input
                value={brandColor ?? ""}
                onChange={(e) => setBrandColor(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </Field>
        </div>

        <Field label="logo url">
          <input
            name="logo_url"
            defaultValue={initial?.logo_url ?? ""}
            placeholder="https://…/logo.svg"
            style={inputStyle}
          />
        </Field>

        <Field label="tagline">
          <input
            name="tagline"
            defaultValue={initial?.tagline ?? ""}
            placeholder="We keep our brand, you get pan-African reach."
            style={inputStyle}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="registration preference">
            <select
              name="registration_pref"
              defaultValue={initial?.registration_pref ?? "either"}
              style={inputStyle}
            >
              <option value="own_system">own_system</option>
              <option value="fign_hosted">fign_hosted</option>
              <option value="either">either</option>
            </select>
          </Field>
          <Field label="public page" hint="tick to expose /orgs/[slug] publicly">
            <label
              className="flex items-center gap-3 font-mono text-[12px]"
              style={{ color: C.ink, ...inputStyle, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                name="public_page_enabled"
                defaultChecked={initial?.public_page_enabled ?? true}
                value="1"
              />
              <span>enabled</span>
            </label>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3">
          <PrimaryButton>{submitLabel} →</PrimaryButton>
          {secondaryAction ? (
            <SecondaryButton formAction={secondaryAction}>
              {secondaryLabel ?? "Save & next →"}
            </SecondaryButton>
          ) : null}
        </div>
      </div>

      {/* Live chip + card preview */}
      <aside
        className="p-5 h-fit sticky top-4"
        style={{ background: C.paperAlt, border: `1.5px solid ${C.ink}` }}
      >
        <Label>live preview</Label>
        <div className="mt-4 flex items-center gap-3">
          <OrgChip org={previewOrg} size="md" />
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase"
            style={{ color: C.inkMute }}
          >
            {type}
          </span>
        </div>
        <div
          className="mt-5 p-4"
          style={{ background: brandColor ?? C.ink, color: C.paper }}
        >
          <div
            className="font-display text-2xl italic leading-tight"
            style={{ color: C.paper }}
          >
            {previewOrg.name}
          </div>
          {shortName ? (
            <div
              className="mt-1 font-mono text-[10px] tracking-[0.2em] uppercase font-bold"
              style={{ opacity: 0.9 }}
            >
              {shortName}
            </div>
          ) : null}
        </div>
      </aside>
    </form>
  );
}
