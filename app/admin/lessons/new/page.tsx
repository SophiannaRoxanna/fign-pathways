import Link from "next/link";
import { C } from "@/lib/design/tokens";
import { SectionHead } from "@/components/ui/SectionHead";
import { LessonForm } from "@/components/admin/LessonForm";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { InterestTag, Organisation } from "@/lib/supabase/types";
import { createLessonAction } from "./actions";

export default async function NewLessonPage() {
  const supabase = await getSupabaseServer();
  const [{ data: orgs }, { data: tags }] = await Promise.all([
    supabase.from("organisations").select("*").order("type").order("name"),
    supabase.from("interest_tags").select("slug, name_en").order("name_en"),
  ]);

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
      <SectionHead
        num="03a"
        kicker="new lesson"
        sub="A small, finishable lesson. Every lesson carries its host org — attribution is federation-first."
      >
        Write a <em>lesson</em>.
      </SectionHead>
      <LessonForm
        orgs={(orgs ?? []) as Organisation[]}
        tags={(tags ?? []) as Pick<InterestTag, "slug" | "name_en">[]}
        action={createLessonAction}
        submitLabel="Save & publish"
      />
    </div>
  );
}
