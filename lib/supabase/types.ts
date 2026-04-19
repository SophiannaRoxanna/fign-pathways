// Shared TS types mirroring key Supabase tables. Hand-maintained; update when
// migrations change columns. Not a generated types file — that's a Phase 2 tidy.

export type OrgType = "umbrella" | "member_org" | "partner" | "chapter" | "open";

export type Organisation = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  type: OrgType;
  country_code: string | null;
  language: string;
  brand_color: string | null;
  logo_url: string | null;
  tagline: string | null;
  registration_pref: "own_system" | "fign_hosted" | "either";
  public_page_enabled: boolean;
  status: string;
};

export type Member = {
  id: string;
  handle: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  language_pref: string;
  primary_org_id: string | null;
  description_freetext: string | null;
  visibility_prefs: Record<string, unknown>;
  xp: number;
  last_active_at: string | null;
  joined_at: string;
  is_umbrella_admin: boolean;
};

export type InterestTag = {
  id: string;
  slug: string;
  name_en: string;
  name_fr: string | null;
  group: "play" | "create" | "voice" | "stream" | "words" | "look" | "lead";
  color: string | null;
  adjacency_slugs: string[];
};

export type MemberTag = {
  member_id: string;
  tag_id: string;
  source: "declared" | "derived" | "activity_inferred";
  confidence: number;
  added_at: string;
};

export type ItemKind =
  | "tournament" | "workshop" | "game_night" | "stream_challenge"
  | "hackathon" | "school_tour" | "opportunity" | "scholarship"
  | "mentor_call" | "circle" | "announcement";

export type Item = {
  id: string;
  kind: ItemKind;
  title: string;
  hook: string | null;
  body: string | null;
  cover_url: string | null;
  host_org_id: string;
  co_host_org_ids: string[];
  endorsed_org_ids: string[];
  country: string | null;
  city: string | null;
  location_freetext: string | null;
  language: string;
  when_start: string | null;
  when_end: string | null;
  rolling: boolean;
  tags: string[];
  capacity: number | null;
  registration_url: string | null;
  registration_preference: "own_system" | "fign_hosted" | "either";
  visibility: "fign_network" | "host_members_only" | "public";
  posted_by: string | null;
  posted_at: string;
};

export type Activity = {
  id: string;
  member_id: string;
  kind: string;
  kind_group: "doing" | "learning" | "reflection";
  title: string | null;
  description: string | null;
  host_org_id: string;
  related_entity_id: string | null;
  related_entity_type: string | null;
  xp_awarded: number;
  verified: boolean;
  created_at: string;
};

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  host_org_id: string;
  length_min: number;
  format: string;
  tags: string[];
  hook: string | null;
  body: string | null;
  content_url: string | null;
  visibility: string;
  status: string;
};

export type LessonCompletion = {
  id: string;
  member_id: string;
  lesson_id: string;
  completed_at: string;
  artifact_url: string | null;
  took_options: string[];
};

export type Milestone = {
  id: string;
  member_id: string;
  text: string;
  set_at: string;
  status: "active" | "met" | "retired";
  progress: number;
  updated_at: string;
};

export type MemberSkill = {
  id: string;
  member_id: string;
  skill_name: string;
  level: number;
  evidence_summary: string | null;
  evidence_count: number;
  months_active: number;
  is_public: boolean;
  updated_at: string;
};

export type GrowthSnapshot = {
  id: string;
  member_id: string;
  as_of: string;
  kind: "then" | "now";
  lines: string[];
  manually_overridden: boolean;
};

export type ItemMatch = { item_id: string; why_you: string; overlap: number };
export type LessonMatch = { lesson_id: string; why_this: string; overlap: number };
