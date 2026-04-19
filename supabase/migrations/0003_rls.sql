-- Row-level security policies.
-- Principle (spec §9): public impact, private roster. Host-org admins manage their
-- own content. Umbrella admin (Sophia) has full reach via is_umbrella_admin flag.

-- Helper: is the auth'd user an umbrella admin?
create or replace function is_umbrella_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_umbrella_admin from members where id = auth.uid()), false);
$$;

-- Helper: is the auth'd user an admin of this org?
create or replace function is_org_admin(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from org_admins
    where org_id = p_org and member_id = auth.uid()
  ) or is_umbrella_admin();
$$;

-- organisations
alter table organisations enable row level security;

create policy "orgs: public read of public pages"
  on organisations for select using (public_page_enabled = true or is_umbrella_admin());

create policy "orgs: admins can update own"
  on organisations for update using (is_org_admin(id));

create policy "orgs: umbrella admin can insert / delete"
  on organisations for insert with check (is_umbrella_admin());
create policy "orgs: umbrella admin can delete"
  on organisations for delete using (is_umbrella_admin());

-- members
alter table members enable row level security;

create policy "members: own row always"
  on members for select using (auth.uid() = id or is_umbrella_admin());

-- Public-subset view for reading others; RLS on the view enforces visibility.
create or replace view public_members as
  select id, handle, name, country, city, primary_org_id, description_freetext, last_active_at
  from members
  where visibility_prefs->>'hide_profile' is distinct from 'true';

grant select on public_members to anon, authenticated;

create policy "members: insert own row on first login"
  on members for insert with check (auth.uid() = id);

create policy "members: update own row"
  on members for update using (auth.uid() = id);

-- org_admins
alter table org_admins enable row level security;

create policy "org_admins: read visible to umbrella + org owners"
  on org_admins for select using (is_org_admin(org_id));

create policy "org_admins: umbrella or owner can write"
  on org_admins for insert with check (is_org_admin(org_id));
create policy "org_admins: umbrella or owner can delete"
  on org_admins for delete using (is_org_admin(org_id));

-- interest_tags (read-only to members; umbrella-admin writes)
alter table interest_tags enable row level security;
create policy "tags: public read" on interest_tags for select using (true);
create policy "tags: umbrella write" on interest_tags for all using (is_umbrella_admin()) with check (is_umbrella_admin());

-- member_tags
alter table member_tags enable row level security;
create policy "member_tags: read own or umbrella"
  on member_tags for select using (auth.uid() = member_id or is_umbrella_admin());
create policy "member_tags: write own"
  on member_tags for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

-- activities
alter table activities enable row level security;
create policy "activities: read own + umbrella + host org"
  on activities for select using (
    auth.uid() = member_id or is_umbrella_admin() or is_org_admin(host_org_id)
  );
-- Writes only via record_activity RPC (security definer). No direct insert policy.

-- items
alter table items enable row level security;
create policy "items: read public or fign_network-when-authed"
  on items for select using (
    visibility = 'public'
    or (visibility = 'fign_network' and auth.uid() is not null)
    or is_org_admin(host_org_id)
  );
create policy "items: host org admins can write"
  on items for all using (is_org_admin(host_org_id)) with check (is_org_admin(host_org_id));

-- item_registrations
alter table item_registrations enable row level security;
create policy "registrations: read own or host"
  on item_registrations for select using (
    auth.uid() = member_id
    or exists(select 1 from items i where i.id = item_id and is_org_admin(i.host_org_id))
  );
create policy "registrations: insert own"
  on item_registrations for insert with check (auth.uid() = member_id);
create policy "registrations: update own or host"
  on item_registrations for update using (
    auth.uid() = member_id
    or exists(select 1 from items i where i.id = item_id and is_org_admin(i.host_org_id))
  );

-- follows
alter table follows enable row level security;
create policy "follows: read own"
  on follows for select using (auth.uid() = member_id or is_umbrella_admin());
create policy "follows: write own"
  on follows for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

-- xp_awards (read for all, write umbrella only)
alter table xp_awards enable row level security;
create policy "xp: public read" on xp_awards for select using (true);
create policy "xp: umbrella write" on xp_awards for all using (is_umbrella_admin()) with check (is_umbrella_admin());

-- lessons
alter table lessons enable row level security;
create policy "lessons: read published"
  on lessons for select using (status = 'published' or is_org_admin(host_org_id));
create policy "lessons: host org admins write"
  on lessons for all using (is_org_admin(host_org_id)) with check (is_org_admin(host_org_id));

-- lesson_completions
alter table lesson_completions enable row level security;
create policy "completions: read own + host"
  on lesson_completions for select using (
    auth.uid() = member_id
    or exists(select 1 from lessons l where l.id = lesson_id and is_org_admin(l.host_org_id))
  );
create policy "completions: insert own"
  on lesson_completions for insert with check (auth.uid() = member_id);
create policy "completions: update own"
  on lesson_completions for update using (auth.uid() = member_id);

-- curricula (public read)
alter table curricula enable row level security;
create policy "curricula: public read" on curricula for select using (true);
create policy "curricula: umbrella write" on curricula for all using (is_umbrella_admin()) with check (is_umbrella_admin());

alter table curriculum_lessons enable row level security;
create policy "curr_lessons: public read" on curriculum_lessons for select using (true);
create policy "curr_lessons: umbrella write" on curriculum_lessons for all using (is_umbrella_admin()) with check (is_umbrella_admin());

-- member_skills
alter table member_skills enable row level security;
create policy "skills: read own always, public if flagged"
  on member_skills for select using (auth.uid() = member_id or is_public = true or is_umbrella_admin());
create policy "skills: write own (for is_public toggle); function writes via security definer"
  on member_skills for update using (auth.uid() = member_id) with check (auth.uid() = member_id);

-- milestones
alter table milestones enable row level security;
create policy "milestones: own only" on milestones for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

-- growth_snapshots
alter table growth_snapshots enable row level security;
create policy "snapshots: own only" on growth_snapshots for all using (auth.uid() = member_id) with check (auth.uid() = member_id);

-- lesson_option_events
alter table lesson_option_events enable row level security;
create policy "options: read own" on lesson_option_events for select using (auth.uid() = member_id or is_umbrella_admin());
-- Writes only via lesson_option RPC.
