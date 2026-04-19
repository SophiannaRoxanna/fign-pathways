"use client";

import { Label } from "@/components/ui/Label";
import { Field, inputStyle, PrimaryButton } from "./form";
import { MultiSelect } from "./MultiSelect";
import type { InterestTag, Lesson, Organisation } from "@/lib/supabase/types";

export type LessonFormInitial = Partial<Lesson>;

type Action = (formData: FormData) => void | Promise<void>;

const LESSON_FORMATS = [
  "text",
  "audio",
  "video",
  "video_plus_script",
  "audio_plus_drill",
  "video_plus_repo",
  "interactive",
] as const;

export function LessonForm({
  initial,
  orgs,
  tags,
  action,
  hiddenFields,
  submitLabel = "Save lesson",
}: {
  initial?: LessonFormInitial;
  orgs: Organisation[];
  tags: Pick<InterestTag, "slug" | "name_en">[];
  action: Action;
  hiddenFields?: Record<string, string>;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-8">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}

      <section>
        <Label>attribution</Label>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="slug" hint="lowercase-hyphen · unique">
            <input
              name="slug"
              required
              defaultValue={initial?.slug ?? ""}
              pattern="[a-z0-9\-]+"
              placeholder="voice-acting-intro"
              style={inputStyle}
            />
          </Field>
          <Field label="host org">
            <select
              name="host_org_id"
              required
              defaultValue={initial?.host_org_id ?? orgs[0]?.id ?? ""}
              style={inputStyle}
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.type})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section>
        <Label>content</Label>
        <div className="mt-3 space-y-5">
          <Field label="title">
            <input
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              placeholder="Voice acting for games · intro"
              style={inputStyle}
            />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="length (min)">
              <input
                type="number"
                name="length_min"
                required
                min={1}
                defaultValue={initial?.length_min ?? 10}
                style={inputStyle}
              />
            </Field>
            <Field label="format">
              <select
                name="format"
                required
                defaultValue={initial?.format ?? "video"}
                style={inputStyle}
              >
                {LESSON_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="content url" hint="link to the lesson surface (video, doc, repo)">
            <input
              name="content_url"
              defaultValue={initial?.content_url ?? ""}
              placeholder="https://…"
              style={inputStyle}
            />
          </Field>
          <Field label="hook" hint="one short line that sells the lesson">
            <input
              name="hook"
              defaultValue={initial?.hook ?? ""}
              placeholder="Cold-read a real script from Vodou: A Space Odyssey."
              style={inputStyle}
            />
          </Field>
          <Field label="body" hint="markdown ok · longer description, what they'll leave with">
            <textarea
              name="body"
              rows={10}
              defaultValue={initial?.body ?? ""}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
        </div>
      </section>

      <section>
        <Label>tags &amp; visibility</Label>
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
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
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
          <Field label="status">
            <select
              name="status"
              defaultValue={initial?.status ?? "published"}
              style={inputStyle}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="retired">retired</option>
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
