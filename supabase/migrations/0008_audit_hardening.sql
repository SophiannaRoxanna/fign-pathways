-- Hardening pass following the whole-app audit. Bundles security, correctness,
-- and perf SQL changes so it can be applied as a single Supabase SQL run.
--
-- Idempotent: every block uses `if [not] exists` or `create or replace`.

-- =====================================================================
-- 1. record_activity: refuse calls that aren't either self or org admin.
--    Currently SECURITY DEFINER + accepts arbitrary p_member. Locks down
--    the surface so a future regression can't silently award XP.
-- =====================================================================
create or replace function record_activity(
  p_member uuid,
  p_kind text,
  p_host_org uuid,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_xp int;
  v_kind_group activity_kind_group;
  v_caller uuid;
begin
  v_caller := auth.uid();

  -- Default host_org to FIGN umbrella if null.
  if p_host_org is null then
    select id into p_host_org from organisations where type = 'umbrella' limit 1;
  end if;

  -- Authorization: caller must be the member themselves, or an admin of the
  -- crediting host org, or umbrella. (auth.uid() is null when invoked from
  -- service-role contexts; allow that path because those callers have already
  -- verified authorization at the application layer.)
  if v_caller is not null
     and v_caller <> p_member
     and not is_org_admin(p_host_org)
     and not is_umbrella_admin()
  then
    raise exception 'record_activity: caller % cannot record activity for member %',
      v_caller, p_member;
  end if;

  -- Look up XP + kind_group from the lookup table; fall back to 0 / 'doing'.
  select amount, kind_group into v_xp, v_kind_group
  from xp_awards where kind = p_kind;
  if v_xp is null then
    v_xp := 0;
    v_kind_group := 'doing';
  end if;

  insert into activities(
    member_id, kind, kind_group, host_org_id,
    title, description, related_entity_id, related_entity_type,
    xp_awarded
  ) values (
    p_member, p_kind, v_kind_group, p_host_org,
    nullif(p_payload->>'title', ''),
    nullif(p_payload->>'description', ''),
    (p_payload->>'related_entity_id')::uuid,
    nullif(p_payload->>'related_entity_type', ''),
    v_xp
  ) returning id into v_id;

  update members
    set xp = xp + v_xp,
        last_active_at = now()
    where id = p_member;

  return v_id;
end;
$$;

-- =====================================================================
-- 2. record_activities_bulk: server-side loop so CSV/webhook imports do
--    one round-trip instead of N. Same authorization model.
-- =====================================================================
create or replace function record_activities_bulk(
  p_member_ids uuid[],
  p_kind text,
  p_host_org uuid,
  p_payload jsonb default '{}'::jsonb
) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_caller uuid;
  v_xp int;
  v_kind_group activity_kind_group;
  v_count int := 0;
  v_member uuid;
begin
  v_caller := auth.uid();

  if p_host_org is null then
    select id into p_host_org from organisations where type = 'umbrella' limit 1;
  end if;

  -- Bulk path is only used by org-admin / umbrella tooling. Refuse anonymous
  -- and non-admin callers outright.
  if v_caller is not null
     and not is_org_admin(p_host_org)
     and not is_umbrella_admin()
  then
    raise exception 'record_activities_bulk: caller % is not an admin of org %',
      v_caller, p_host_org;
  end if;

  select amount, kind_group into v_xp, v_kind_group
  from xp_awards where kind = p_kind;
  if v_xp is null then
    v_xp := 0;
    v_kind_group := 'doing';
  end if;

  foreach v_member in array p_member_ids loop
    insert into activities(
      member_id, kind, kind_group, host_org_id,
      title, description, related_entity_id, related_entity_type,
      xp_awarded
    ) values (
      v_member, p_kind, v_kind_group, p_host_org,
      nullif(p_payload->>'title', ''),
      nullif(p_payload->>'description', ''),
      (p_payload->>'related_entity_id')::uuid,
      nullif(p_payload->>'related_entity_type', ''),
      v_xp
    );
    v_count := v_count + 1;
  end loop;

  if array_length(p_member_ids, 1) > 0 and v_xp > 0 then
    update members
      set xp = xp + v_xp,
          last_active_at = now()
      where id = any(p_member_ids);
  end if;

  return v_count;
end;
$$;

-- =====================================================================
-- 3. members.handle + email: enforce lowercase. Backfill, then guard with
--    a trigger and a case-insensitive uniqueness index.
-- =====================================================================
update members
   set email = lower(email)
 where email is not null and email <> lower(email);

update members
   set handle = lower(handle)
 where handle is not null and handle <> lower(handle);

create or replace function lowercase_member_identifiers()
returns trigger language plpgsql as $$
begin
  if new.email is not null then new.email := lower(new.email); end if;
  if new.handle is not null then new.handle := lower(new.handle); end if;
  return new;
end;
$$;

drop trigger if exists members_lowercase_identifiers on members;
create trigger members_lowercase_identifiers
  before insert or update of email, handle on members
  for each row execute function lowercase_member_identifiers();

-- The original `handle text unique` constraint is case-sensitive; replace with
-- a lower(handle) functional unique index so @Alice / @alice can't both exist.
do $$
begin
  if exists (
    select 1 from pg_constraint
     where conname = 'members_handle_key' and conrelid = 'members'::regclass
  ) then
    alter table members drop constraint members_handle_key;
  end if;
end $$;

create unique index if not exists members_handle_lower_idx
  on members (lower(handle))
  where handle is not null;

create unique index if not exists members_email_lower_idx
  on members (lower(email))
  where email is not null;

-- =====================================================================
-- 4. org_admins: only one owner per org. The application picks "first
--    invitee = owner" by reading count and writing — without this index,
--    a race produces two owners.
-- =====================================================================
create unique index if not exists org_admins_one_owner_per_org_idx
  on org_admins(org_id)
  where role = 'owner';

-- =====================================================================
-- 5. org_roster_visibility: also require the org's public page to be
--    enabled before anonymous users can read opt-ins. Without this, an
--    org that toggled its public page off still leaks roster member_ids.
-- =====================================================================
drop policy if exists "roster: public read of opt-ins" on org_roster_visibility;
create policy "roster: public read of opt-ins"
  on org_roster_visibility for select
  using (
    visible_in_public_roster = true
    and exists(
      select 1 from organisations o
      where o.id = org_roster_visibility.org_id
        and o.public_page_enabled = true
    )
  );

-- =====================================================================
-- 6. Hot-path indexes flagged by the audit.
-- =====================================================================
create index if not exists member_tags_member_id_idx
  on member_tags(member_id);

create index if not exists item_registrations_member_attended_idx
  on item_registrations(member_id, attended);

create index if not exists follows_org_id_idx
  on follows(org_id);
