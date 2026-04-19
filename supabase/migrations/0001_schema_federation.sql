-- FIGN federation schema — organisations, members, interest graph, items, activities.
-- Reference: fign-build-plan.md §5. Every item and activity carries host_org_id
-- so attribution is always visible.

create extension if not exists pgcrypto;

-- Organisation types: umbrella = FIGN itself (exactly one row).
-- member_org = peer women-in-gaming orgs (FAC, Bambina).
-- partner = studios/tournaments/sponsors (Nexal, Juju, Daimyo).
-- chapter = FIGN local node (Lagos, Accra).
-- open = the "Open source · CC-BY" pseudo-host for open lessons.
create type org_type as enum ('umbrella', 'member_org', 'partner', 'chapter', 'open');

create type org_admin_role as enum ('owner', 'coordinator', 'poster');

create type registration_pref as enum ('own_system', 'fign_hosted', 'either');

create type item_kind as enum (
  'tournament', 'workshop', 'game_night', 'stream_challenge',
  'hackathon', 'school_tour', 'opportunity', 'scholarship',
  'mentor_call', 'circle', 'announcement'
);

create type item_visibility as enum ('fign_network', 'host_members_only', 'public');

create type tag_source as enum ('declared', 'derived', 'activity_inferred');

create type interest_group as enum ('play', 'create', 'voice', 'stream', 'words', 'look', 'lead');

-- activities.kind_group groups activities for the trail view (doing/learning/reflection).
create type activity_kind_group as enum ('doing', 'learning', 'reflection');

create type registration_source as enum ('fign', 'external_webhook', 'csv_upload');

create table organisations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_name text,
  type org_type not null,
  country_code text,                     -- null = pan-African / global
  language text default 'en',            -- 'en' | 'fr' | 'multi'
  brand_color text,
  logo_url text,
  tagline text,
  registration_pref registration_pref default 'either',
  public_page_enabled boolean not null default true,
  onboarded_at timestamptz,
  status text default 'active',
  created_at timestamptz not null default now()
);

create index organisations_type_idx on organisations(type);

-- members.id references auth.users so RLS can use auth.uid() directly.
create table members (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  name text,
  email text,
  phone text,                            -- captured at onboarding for Phase 4 WhatsApp
  country text,
  city text,
  language_pref text default 'en',
  primary_org_id uuid references organisations(id),
  description_freetext text,
  visibility_prefs jsonb not null default '{}'::jsonb,
  xp int not null default 0,
  last_active_at timestamptz,
  joined_at timestamptz not null default now(),
  is_umbrella_admin boolean not null default false
);

create index members_primary_org_idx on members(primary_org_id);
create index members_country_idx on members(country);

create table org_admins (
  org_id uuid not null references organisations(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  role org_admin_role not null default 'coordinator',
  added_at timestamptz not null default now(),
  primary key (org_id, member_id)
);

create table interest_tags (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_fr text,
  "group" interest_group not null,
  color text,
  adjacency_slugs text[] not null default '{}',   -- precomputed "related tags"
  created_at timestamptz not null default now()
);

create index interest_tags_group_idx on interest_tags("group");

create table member_tags (
  member_id uuid not null references members(id) on delete cascade,
  tag_id uuid not null references interest_tags(id) on delete cascade,
  source tag_source not null default 'declared',
  confidence real default 1.0,
  added_at timestamptz not null default now(),
  primary key (member_id, tag_id)
);

create index member_tags_tag_idx on member_tags(tag_id);

-- activities: the spine of growth. Every registration/attendance/contribution
-- creates a row. host_org_id credits the work to a specific org.
create table activities (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  kind text not null,                    -- e.g. 'joined_fign','workshop_completed','lesson_option_taken'
  kind_group activity_kind_group not null default 'doing',
  title text,
  description text,
  host_org_id uuid not null references organisations(id),
  related_entity_id uuid,
  related_entity_type text,
  xp_awarded int not null default 0,
  evidence_url text,
  verified boolean not null default false,
  verified_by uuid references members(id),
  created_at timestamptz not null default now()
);

create index activities_member_created_idx on activities(member_id, created_at desc);
create index activities_host_org_idx on activities(host_org_id);

-- items: the unified feed — tournaments, workshops, gigs, circles, opportunities.
-- Every item has exactly one host_org_id plus arrays of co_hosts and endorsers.
create table items (
  id uuid primary key default gen_random_uuid(),
  kind item_kind not null,
  title text not null,
  hook text,
  body text,
  cover_url text,
  host_org_id uuid not null references organisations(id) on delete cascade,
  co_host_org_ids uuid[] not null default '{}',
  endorsed_org_ids uuid[] not null default '{}',
  country text,
  city text,
  location_freetext text,
  language text default 'en',
  when_start timestamptz,
  when_end timestamptz,
  rolling boolean not null default false,
  tags text[] not null default '{}',     -- references interest_tags.slug
  capacity int,
  registration_url text,
  registration_preference registration_pref not null default 'fign_hosted',
  visibility item_visibility not null default 'fign_network',
  posted_by uuid references members(id),
  posted_at timestamptz not null default now()
);

create index items_host_org_idx on items(host_org_id);
create index items_when_start_idx on items(when_start);
create index items_tags_gin_idx on items using gin(tags);
create index items_country_idx on items(country);

create table item_registrations (
  item_id uuid not null references items(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  status text not null default 'registered',   -- registered | waitlisted | cancelled
  source registration_source not null default 'fign',
  registered_at timestamptz not null default now(),
  attended boolean not null default false,
  verified_by uuid references members(id),
  primary key (item_id, member_id)
);

create table follows (
  member_id uuid not null references members(id) on delete cascade,
  org_id uuid not null references organisations(id) on delete cascade,
  followed_at timestamptz not null default now(),
  primary key (member_id, org_id)
);

-- XP award lookup, editable by umbrella admin.
create table xp_awards (
  kind text primary key,
  amount int not null,
  kind_group activity_kind_group not null default 'doing'
);
