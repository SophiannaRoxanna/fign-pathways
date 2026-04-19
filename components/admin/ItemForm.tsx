"use client";

import { useMemo, useState } from "react";
import { C, ORG_TYPE_COLOR } from "@/lib/design/tokens";
import { Label } from "@/components/ui/Label";
import { Field, inputStyle, PrimaryButton } from "./form";
import { MultiSelect } from "./MultiSelect";
import type { Item, Organisation } from "@/lib/supabase/types";

export type ItemFormInitial = Partial<Item>;

type Action = (formData: FormData) => void | Promise<void>;

const ITEM_KINDS = [
  "tournament",
  "workshop",
  "game_night",
  "stream_challenge",
  "hackathon",
  "school_tour",
  "opportunity",
  "scholarship",
  "mentor_call",
  "circle",
  "announcement",
] as const;

function localDTValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ItemForm({
  initial,
  orgs,
  tags,
  action,
  hiddenFields,
  preselectHostOrgId,
  submitLabel = "Save item",
}: {
  initial?: ItemFormInitial;
  orgs: Organisation[];
  tags: { slug: string; name_en: string }[];
  action: Action;
  hiddenFields?: Record<string, string>;
  preselectHostOrgId?: string;
  submitLabel?: string;
}) {
  const [hostOrgId, setHostOrgId] = useState<string>(
    initial?.host_org_id ?? preselectHostOrgId ?? orgs[0]?.id ?? "",
  );

  const orgOptions = useMemo(
    () =>
      orgs.map((o) => ({
        value: o.id,
        label: o.short_name || o.name,
      })),
    [orgs],
  );

  const orgChipColor = (id: string) => {
    const o = orgs.find((x) => x.id === id);
    if (!o) return C.ink;
    return o.brand_color || ORG_TYPE_COLOR[o.type] || C.ink;
  };

  return (
    <form action={action} className="space-y-8">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}

      {/* attribution */}
      <section>
        <Label>attribution</Label>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="host org" hint="the primary credit for this item">
            <select
              name="host_org_id"
              required
              value={hostOrgId}
              onChange={(e) => setHostOrgId(e.target.value)}
              style={inputStyle}
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.type})
                </option>
              ))}
            </select>
          </Field>
          <Field label="kind">
            <select
              name="kind"
              required
              defaultValue={initial?.kind ?? "workshop"}
              style={inputStyle}
            >
              {ITEM_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-5">
          <Label>co-hosts</Label>
          <div className="mt-2">
            <MultiSelect
              name="co_host_org_ids"
              options={orgOptions.filter((o) => o.value !== hostOrgId)}
              initial={initial?.co_host_org_ids ?? []}
              chipBgFor={orgChipColor}
            />
          </div>
        </div>

        <div className="mt-5">
          <Label>endorsed by</Label>
          <div className="mt-2">
            <MultiSelect
              name="endorsed_org_ids"
              options={orgOptions.filter((o) => o.value !== hostOrgId)}
              initial={initial?.endorsed_org_ids ?? []}
              chipBgFor={orgChipColor}
            />
          </div>
        </div>
      </section>

      {/* content */}
      <section>
        <Label>content</Label>
        <div className="mt-3 space-y-5">
          <Field label="title">
            <input
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              placeholder="Mortal Kombat 1 · Garden City Grand Champion"
              style={inputStyle}
            />
          </Field>
          <Field label="hook" hint="one short line — shows in the feed">
            <input
              name="hook"
              defaultValue={initial?.hook ?? ""}
              placeholder="64 slots · ₦300,000 · registration on Daimyo"
              style={inputStyle}
            />
          </Field>
          <Field label="body" hint="longer description for the item page">
            <textarea
              name="body"
              defaultValue={initial?.body ?? ""}
              rows={6}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
        </div>
      </section>

      {/* when + where */}
      <section>
        <Label>when &amp; where</Label>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="country" hint="ISO-2">
            <input
              name="country"
              defaultValue={initial?.country ?? ""}
              maxLength={2}
              placeholder="NG"
              style={inputStyle}
            />
          </Field>
          <Field label="city">
            <input
              name="city"
              defaultValue={initial?.city ?? ""}
              placeholder="Port Harcourt"
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
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="when starts">
            <input
              type="datetime-local"
              name="when_start"
              defaultValue={localDTValue(initial?.when_start)}
              style={inputStyle}
            />
          </Field>
          <Field label="when ends">
            <input
              type="datetime-local"
              name="when_end"
              defaultValue={localDTValue(initial?.when_end)}
              style={inputStyle}
            />
          </Field>
          <Field label="rolling" hint="open-ended · no fixed date">
            <label
              className="flex items-center gap-3 font-mono text-[12px]"
              style={{ color: C.ink, ...inputStyle, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                name="rolling"
                defaultChecked={initial?.rolling ?? false}
                value="1"
              />
              <span>this one is rolling</span>
            </label>
          </Field>
        </div>
      </section>

      {/* tags + logistics */}
      <section>
        <Label>tags &amp; logistics</Label>
        <div className="mt-3">
          <Label>interest tags</Label>
          <div className="mt-2">
            <MultiSelect
              name="tags"
              options={tags.map((t) => ({ value: t.slug, label: t.name_en }))}
              initial={initial?.tags ?? []}
            />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="capacity">
            <input
              type="number"
              name="capacity"
              min={0}
              defaultValue={initial?.capacity ?? ""}
              placeholder="64"
              style={inputStyle}
            />
          </Field>
          <Field label="registration url">
            <input
              name="registration_url"
              defaultValue={initial?.registration_url ?? ""}
              placeholder="https://daimyo.gg/mk1-gcgc"
              style={inputStyle}
            />
          </Field>
          <Field label="registration preference">
            <select
              name="registration_preference"
              defaultValue={initial?.registration_preference ?? "either"}
              style={inputStyle}
            >
              <option value="own_system">own_system</option>
              <option value="fign_hosted">fign_hosted</option>
              <option value="either">either</option>
            </select>
          </Field>
        </div>
        <div className="mt-5">
          <Field label="visibility">
            <select
              name="visibility"
              defaultValue={initial?.visibility ?? "fign_network"}
              style={inputStyle}
            >
              <option value="fign_network">fign_network</option>
              <option value="host_members_only">host_members_only</option>
              <option value="public">public</option>
            </select>
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3 pt-3">
        <PrimaryButton>{submitLabel} →</PrimaryButton>
      </div>
    </form>
  );
}
