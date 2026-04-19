import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { LessonForm } from "@/components/admin/LessonForm";
import type { InterestTag, Lesson, Organisation } from "@/lib/supabase/types";
import { updateLessonAction } from "./actions";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditLessonPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const [{ data: lesson }, { data: orgs }, { data: tags }] = await Promise.all([
    supabase.from("lessons").select("*").eq("id", id).maybeSingle(),
    supabase.from("organisations").select("*").order("type").order("name"),
    supabase.from("interest_tags").select("slug, name_en").order("name_en"),
  ]);

  if (!lesson) notFound();
  const l = lesson as Lesson;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/lessons"
          className="font-mono text-[10px] tracking-[0.2em] uppercase"
          style={{ color: C.inkMute }}
        >
          ← lessons
        </Link>
      </div>
      <SectionHead num="03b" kicker={l.slug}>
        <em>{l.title}</em>
      </SectionHead>
      <LessonForm
        initial={l}
        orgs={(orgs ?? []) as Organisation[]}
        tags={(tags ?? []) as Pick<InterestTag, "slug" | "name_en">[]}
        action={updateLessonAction}
        hiddenFields={{ id: l.id }}
        submitLabel="Save changes"
      />
    </div>
  );
}
