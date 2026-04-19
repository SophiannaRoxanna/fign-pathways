-- FIGN learning layer schema — lessons, completions, curricula, skills,
-- milestones, growth snapshots, post-lesson option events.
-- Reference: fign-build-plan.md §12-17.

create type milestone_status as enum ('active', 'met', 'retired');

create type growth_snapshot_kind as enum ('then', 'now');

create type door_kind as enum (
  'make_something', 'reflect', 'go_further',
  'take_it_live', 'bring_someone', 'bookmark'
);

create type lesson_format as enum (
  'text', 'audio', 'video', 'video_plus_script', 'audio_plus_drill',
  'video_plus_repo', 'interactive'
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  host_org_id uuid not null references organisations(id) on delete restrict,
  length_min int not null,
  format lesson_format not null,
  tags text[] not null default '{}',     -- references interest_tags.slug
  hook text,
  body text,
  content_url text,
  visibility item_visibility not null default 'fign_network',
  status text not null default 'published',
  created_at timestamptz not null default now()
);

create index lessons_host_org_idx on lessons(host_org_id);
create index lessons_tags_gin_idx on lessons using gin(tags);

create table lesson_completions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  artifact_url text,
  took_options text[] not null default '{}',
  unique (member_id, lesson_id)
);

create index lesson_completions_member_idx on lesson_completions(member_id);

create table curricula (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  co_author_org_ids uuid[] not null default '{}',
  blurb text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table curriculum_lessons (
  curriculum_id uuid not null references curricula(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  position int not null,
  primary key (curriculum_id, lesson_id)
);

create index curriculum_lessons_pos_idx on curriculum_lessons(curriculum_id, position);

-- member_skills: evidence-backed claims. Auto-maintained by update_skills_from_activity.
create table member_skills (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  skill_name text not null,
  level int not null default 0 check (level between 0 and 5),
  evidence_summary text,
  evidence_count int not null default 0,
  months_active int not null default 0,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (member_id, skill_name)
);

create index member_skills_member_idx on member_skills(member_id);

-- milestones: she writes them herself, freeform. No templates.
create table milestones (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  text text not null,
  set_at timestamptz not null default now(),
  status milestone_status not null default 'active',
  progress real not null default 0.0 check (progress between 0 and 1),
  updated_at timestamptz not null default now()
);

create index milestones_member_status_idx on milestones(member_id, status);

-- growth_snapshots: one 'then' (at onboarding + T-6mo) and one 'now' (regenerated).
create table growth_snapshots (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  as_of date not null,
  kind growth_snapshot_kind not null,
  lines text[] not null default '{}',
  manually_overridden boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (member_id, kind)
);

-- lesson_option_events: every "what next?" door she picks becomes a row here
-- plus a corresponding activities row (via the complete_lesson / lesson_option RPCs).
create table lesson_option_events (
  id uuid primary key default gen_random_uuid(),
  lesson_completion_id uuid not null references lesson_completions(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  door door_kind not null,
  payload jsonb not null default '{}'::jsonb,
  taken_at timestamptz not null default now()
);

create index lesson_option_events_completion_idx on lesson_option_events(lesson_completion_id);
