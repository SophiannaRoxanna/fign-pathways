/**
 * FIGN seed runner. Loads JSON files into the Supabase project via the
 * service-role key. Idempotent: re-running upserts by slug / composite key.
 *
 * Prereqs (set in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   UMBRELLA_ADMIN_EMAIL         (the member row gets is_umbrella_admin=true)
 *
 * Run: pnpm seed
 */
import { config as dotenvConfig } from "dotenv";
// Load .env.local first (Next.js convention), falling back to .env.
dotenvConfig({ path: ".env.local" });
dotenvConfig({ path: ".env" });
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supa = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function loadJson<T = unknown>(name: string): Promise<T> {
  const raw = await readFile(join(__dirname, `${name}.json`), "utf8");
  return JSON.parse(raw);
}

type OrgSeed = {
  slug: string;
  name: string;
  short_name?: string;
  type: string;
  country_code: string | null;
  language: string;
  brand_color?: string;
  logo_url?: string;
  tagline?: string;
  registration_pref?: string;
  public_page_enabled: boolean;
  status: string;
};

type InterestSeed = {
  slug: string;
  name_en: string;
  name_fr?: string;
  group: string;
  color?: string;
  adjacency_slugs?: string[];
};

type LessonSeed = {
  slug: string;
  title: string;
  host_slug: string;
  length_min: number;
  format: string;
  tags: string[];
  hook?: string;
  body?: string;
  content_url?: string;
};

type CurriculumSeed = {
  slug: string;
  title: string;
  co_author_slugs: string[];
  blurb: string;
  tags: string[];
  lesson_slugs: string[];
};

type ItemSeed = {
  kind: string;
  title: string;
  hook?: string;
  body?: string;
  host_slug: string;
  co_host_slugs?: string[];
  endorsed_slugs?: string[];
  country?: string | null;
  city?: string;
  location_freetext?: string;
  language?: string;
  when_start?: string;
  when_end?: string;
  rolling?: boolean;
  tags: string[];
  capacity?: number;
  registration_url?: string;
  registration_preference?: string;
  visibility?: string;
};

type MemberSeed = {
  handle: string;
  name: string;
  country: string;
  city: string;
  language_pref: string;
  primary_org_slug: string;
  description_freetext: string;
  declared_slugs: string[];
};

async function must<T>(
  label: string,
  promise: PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T> {
  const { data, error } = await promise;
  if (error) {
    console.error(`✗ ${label}:`, error);
    throw error;
  }
  console.log(`✓ ${label}`);
  return data as T;
}

async function main() {
  console.log("--- FIGN seed ---\n");

  // 1. Organisations
  const orgs = await loadJson<OrgSeed[]>("organisations");
  await must(
    `upsert ${orgs.length} organisations`,
    supa.from("organisations").upsert(orgs, { onConflict: "slug" }).select(),
  );

  const { data: orgRows } = await supa
    .from("organisations")
    .select("id, slug, type");
  const orgIdBySlug = new Map<string, string>(
    (orgRows ?? []).map((r) => [r.slug, r.id]),
  );
  const umbrellaId = orgIdBySlug.get("fign")!;

  // 2. Interest tags
  const tags = await loadJson<InterestSeed[]>("interests");
  await must(
    `upsert ${tags.length} interest_tags`,
    supa.from("interest_tags").upsert(tags, { onConflict: "slug" }).select(),
  );

  // 3. Lessons
  const lessons = await loadJson<LessonSeed[]>("lessons");
  const lessonRows = lessons.map((l) => ({
    slug: l.slug,
    title: l.title,
    host_org_id: orgIdBySlug.get(l.host_slug)!,
    length_min: l.length_min,
    format: l.format,
    tags: l.tags,
    hook: l.hook,
    body: l.body,
    content_url: l.content_url,
  }));
  await must(
    `upsert ${lessonRows.length} lessons`,
    supa.from("lessons").upsert(lessonRows, { onConflict: "slug" }).select(),
  );

  const { data: lessonIdRows } = await supa
    .from("lessons")
    .select("id, slug");
  const lessonIdBySlug = new Map<string, string>(
    (lessonIdRows ?? []).map((r) => [r.slug, r.id]),
  );

  // 4. Curricula + curriculum_lessons
  const curricula = await loadJson<CurriculumSeed[]>("curricula");
  const curRows = curricula.map((c) => ({
    slug: c.slug,
    title: c.title,
    blurb: c.blurb,
    tags: c.tags,
    co_author_org_ids: c.co_author_slugs
      .map((s) => orgIdBySlug.get(s))
      .filter(Boolean),
  }));
  await must(
    `upsert ${curRows.length} curricula`,
    supa.from("curricula").upsert(curRows, { onConflict: "slug" }).select(),
  );

  const { data: curIdRows } = await supa.from("curricula").select("id, slug");
  const curIdBySlug = new Map<string, string>(
    (curIdRows ?? []).map((r) => [r.slug, r.id]),
  );

  // Clear and reinsert curriculum_lessons to keep positions tidy.
  await supa.from("curriculum_lessons").delete().neq("curriculum_id", "00000000-0000-0000-0000-000000000000");
  const curLessonRows = curricula.flatMap((c) =>
    c.lesson_slugs.map((slug, i) => ({
      curriculum_id: curIdBySlug.get(c.slug)!,
      lesson_id: lessonIdBySlug.get(slug)!,
      position: i,
    })),
  );
  await must(
    `insert ${curLessonRows.length} curriculum_lessons`,
    supa.from("curriculum_lessons").insert(curLessonRows).select(),
  );

  // 5. Items
  const items = await loadJson<ItemSeed[]>("items");
  const itemRows = items.map((it) => ({
    kind: it.kind,
    title: it.title,
    hook: it.hook,
    body: it.body,
    host_org_id: orgIdBySlug.get(it.host_slug)!,
    co_host_org_ids: (it.co_host_slugs ?? []).map((s) => orgIdBySlug.get(s)!).filter(Boolean),
    endorsed_org_ids: (it.endorsed_slugs ?? []).map((s) => orgIdBySlug.get(s)!).filter(Boolean),
    country: it.country ?? null,
    city: it.city,
    location_freetext: it.location_freetext,
    language: it.language ?? "en",
    when_start: it.when_start ?? null,
    when_end: it.when_end ?? null,
    rolling: it.rolling ?? false,
    tags: it.tags,
    capacity: it.capacity ?? null,
    registration_url: it.registration_url ?? null,
    registration_preference: it.registration_preference ?? "fign_hosted",
    visibility: it.visibility ?? "fign_network",
  }));
  // Items don't have a unique slug; clear + reinsert for idempotent seed.
  await supa.from("items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await must(
    `insert ${itemRows.length} items`,
    supa.from("items").insert(itemRows).select(),
  );

  // 6. Members — create auth users + members rows.
  const members = await loadJson<MemberSeed[]>("members");
  for (const m of members) {
    const email = `${m.handle.replace("@", "")}@fign.example`;
    const { data: created, error } = await supa.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { handle: m.handle, name: m.name },
    });
    if (error && !/already registered/i.test(error.message)) {
      console.error(`✗ auth.createUser ${email}:`, error.message);
      continue;
    }
    // Fetch user id (from newly-created or existing).
    let userId: string | undefined = created?.user?.id;
    if (!userId) {
      const { data: list } = await supa.auth.admin.listUsers({ perPage: 1000 });
      userId = list?.users.find((u) => u.email === email)?.id;
    }
    if (!userId) {
      console.error(`✗ could not resolve userId for ${email}`);
      continue;
    }

    await supa.rpc("onboard_member", {
      p_member: userId,
      p_name: m.name,
      p_handle: m.handle,
      p_country: m.country,
      p_city: m.city,
      p_language_pref: m.language_pref,
      p_email: email,
      p_phone: null,
      p_description: m.description_freetext,
      p_declared_slugs: m.declared_slugs,
      p_first_milestone: null,
      p_primary_org: orgIdBySlug.get(m.primary_org_slug) ?? null,
    });
  }
  console.log(`✓ onboarded ${members.length} seed members`);

  // 7. Umbrella admin flag on Sophia.
  const adminEmail = process.env.UMBRELLA_ADMIN_EMAIL;
  if (adminEmail) {
    const { data: list } = await supa.auth.admin.listUsers({ perPage: 1000 });
    const existing = list?.users.find((u) => u.email === adminEmail);
    let adminId = existing?.id;
    if (!adminId) {
      const { data: created } = await supa.auth.admin.createUser({
        email: adminEmail,
        email_confirm: true,
        user_metadata: { name: "Sophia Nei" },
      });
      adminId = created?.user?.id;
    }
    if (adminId) {
      await supa
        .from("members")
        .upsert(
          {
            id: adminId,
            email: adminEmail,
            handle: "@sophia",
            name: "Sophia Nei",
            is_umbrella_admin: true,
            primary_org_id: umbrellaId,
          },
          { onConflict: "id" },
        );
      console.log(`✓ umbrella admin: ${adminEmail}`);
    }
  }

  console.log("\n--- seed complete ---");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
