-- FIGN Postgres functions. All SECURITY DEFINER so they can enforce their own
-- invariants and bypass RLS carefully.

-- Record an activity, award XP from lookup, bump last_active_at. Returns activity id.
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
begin
  -- Default host_org to FIGN umbrella if null.
  if p_host_org is null then
    select id into p_host_org from organisations where type = 'umbrella' limit 1;
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

-- Complete a lesson. Idempotent: if already complete, returns the existing row.
-- Triggers record_activity('lesson_completed') + update_skills_from_activity.
create or replace function complete_lesson(
  p_member uuid,
  p_lesson uuid
) returns table(completion_id uuid, lesson_id uuid, lesson_slug text, host_org_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_completion_id uuid;
  v_host uuid;
  v_slug text;
begin
  select id into v_completion_id from lesson_completions
    where member_id = p_member and lesson_id = p_lesson;

  select l.host_org_id, l.slug into v_host, v_slug from lessons l where l.id = p_lesson;

  if v_completion_id is null then
    insert into lesson_completions(member_id, lesson_id)
      values (p_member, p_lesson)
      returning id into v_completion_id;

    perform record_activity(
      p_member,
      'lesson_completed',
      v_host,
      jsonb_build_object(
        'title', (select title from lessons where id = p_lesson),
        'related_entity_id', p_lesson::text,
        'related_entity_type', 'lesson'
      )
    );

    perform update_skills_from_activity(p_member);
  end if;

  return query
    select v_completion_id, p_lesson, v_slug, v_host;
end;
$$;

-- Log a post-lesson "what next?" option pick. Creates a lesson_option_events row
-- AND a corresponding activities row so it appears on the trail.
create or replace function log_lesson_option(
  p_member uuid,
  p_completion uuid,
  p_door door_kind,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_host uuid;
  v_kind_group activity_kind_group;
  v_activity_kind text;
begin
  -- Ownership check (RLS bypass since we're definer).
  if not exists (
    select 1 from lesson_completions lc where lc.id = p_completion and lc.member_id = p_member
  ) then
    raise exception 'not your completion';
  end if;

  select l.host_org_id into v_host
    from lesson_completions lc
    join lessons l on l.id = lc.lesson_id
    where lc.id = p_completion;

  insert into lesson_option_events(lesson_completion_id, member_id, door, payload)
    values (p_completion, p_member, p_door, p_payload)
    returning id into v_id;

  -- Update took_options on the completion for quick lookup.
  update lesson_completions
    set took_options = array_append(took_options, p_door::text)
    where id = p_completion;

  -- Map door to activity kind + group.
  v_activity_kind := 'lesson_option_' || p_door::text;
  v_kind_group := case p_door
    when 'reflect' then 'reflection'::activity_kind_group
    when 'bookmark' then 'reflection'::activity_kind_group
    else 'doing'::activity_kind_group
  end;

  insert into activities(
    member_id, kind, kind_group, host_org_id,
    title, related_entity_id, related_entity_type, xp_awarded
  ) values (
    p_member, v_activity_kind, v_kind_group, v_host,
    'Took "' || p_door::text || '" after a lesson',
    p_completion, 'lesson_completion',
    coalesce((select amount from xp_awards where kind = v_activity_kind), 10)
  );

  update members set last_active_at = now() where id = p_member;

  return v_id;
end;
$$;

-- Recompute member_skills from lesson_completions + activities using a simple rule set.
-- Phase 1 rules: for each interest-tag slug present in ≥N lesson_completions.tags, bump
-- the matching skill. Skill names are derived from a static mapping stored inline.
create or replace function update_skills_from_activity(p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  -- For each unique lesson-tag she's completed, count how many lessons and
  -- insert/update a corresponding member_skills row. The skill_name defaults
  -- to the tag slug title-cased (editable by Sophia post-hoc).
  for r in
    select t.tag as skill_name, count(*) as ev_count
    from lesson_completions lc
    join lessons l on l.id = lc.lesson_id
    cross join lateral unnest(l.tags) as t(tag)
    where lc.member_id = p_member
    group by t.tag
  loop
    insert into member_skills(member_id, skill_name, level, evidence_count, evidence_summary, updated_at)
      values (
        p_member,
        initcap(replace(r.skill_name, '-', ' ')),
        least(5, greatest(1, r.ev_count)),  -- 1 lesson -> level 1, 5+ -> level 5
        r.ev_count,
        r.ev_count || ' lesson' || (case when r.ev_count = 1 then '' else 's' end),
        now()
      )
    on conflict (member_id, skill_name)
      do update set
        level = least(5, greatest(1, excluded.evidence_count)),
        evidence_count = excluded.evidence_count,
        evidence_summary = excluded.evidence_summary,
        updated_at = now();
  end loop;
end;
$$;

-- Rank items for a member by tag overlap + country + language.
-- Returns items + a "why_you" reason line built from overlapping tag names.
create or replace function match_items_for_member(
  p_member uuid,
  p_limit int default 12
) returns table(
  item_id uuid,
  why_you text,
  overlap int
)
language plpgsql stable security definer set search_path = public as $$
declare
  v_country text;
  v_lang text;
begin
  select country, language_pref into v_country, v_lang from members where id = p_member;

  return query
  with member_slugs as (
    select lower(it.slug) as slug
      from member_tags mt
      join interest_tags it on it.id = mt.tag_id
      where mt.member_id = p_member
  ),
  scored as (
    select
      i.id,
      (
        select count(*)::int
        from unnest(i.tags) as t(slug)
        where lower(t.slug) in (select slug from member_slugs)
      ) as overlap,
      (
        select string_agg(initcap(replace(t.slug, '-', ' ')), ' + ')
        from unnest(i.tags) as t(slug)
        where lower(t.slug) in (select slug from member_slugs)
      ) as matched_tags,
      i.country
    from items i
    where i.visibility in ('fign_network','public')
      and (i.when_end is null or i.when_end > now())
  )
  select
    s.id,
    case
      when s.matched_tags is not null and s.country = v_country then
        'Matches you: ' || s.matched_tags || ' · same country'
      when s.matched_tags is not null then
        'Matches you: ' || s.matched_tags
      when s.country = v_country then
        'Matches you: same country'
      else 'Broadly matched to your map'
    end as why_you,
    s.overlap
  from scored s
  where s.overlap > 0 or s.country = v_country
  order by s.overlap desc, (case when s.country = v_country then 0 else 1 end), s.id
  limit p_limit;
end;
$$;

-- Rank lessons for a member by tag overlap against declared+derived tags,
-- excluding ones she has already completed.
create or replace function match_lessons_for_member(
  p_member uuid,
  p_limit int default 3
) returns table(
  lesson_id uuid,
  why_this text,
  overlap int
)
language plpgsql stable security definer set search_path = public as $$
begin
  return query
  with member_slugs as (
    select lower(it.slug) as slug
      from member_tags mt
      join interest_tags it on it.id = mt.tag_id
      where mt.member_id = p_member
  ),
  completed as (
    select lesson_id from lesson_completions where member_id = p_member
  ),
  scored as (
    select
      l.id,
      (
        select count(*)::int
        from unnest(l.tags) as t(slug)
        where lower(t.slug) in (select slug from member_slugs)
      ) as overlap,
      (
        select string_agg(initcap(replace(t.slug, '-', ' ')), ' + ')
        from unnest(l.tags) as t(slug)
        where lower(t.slug) in (select slug from member_slugs)
      ) as matched_tags,
      l.length_min
    from lessons l
    where l.status = 'published'
      and l.id not in (select lesson_id from completed)
  )
  select
    s.id,
    case
      when s.matched_tags is not null then 'Why this: ' || s.matched_tags
      else 'Broadly matched to your map'
    end as why_this,
    s.overlap
  from scored s
  where s.overlap > 0
  order by s.overlap desc, s.length_min asc, s.id
  limit p_limit;
end;
$$;

-- Rule-based tag extractor. Matches lowercased text against tag slugs + a
-- small synonym list. Returns an array of matched tag slugs.
create or replace function extract_tags_simple(p_text text) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare
  v_text text;
  v_slugs text[];
begin
  v_text := ' ' || lower(coalesce(p_text, '')) || ' ';

  -- Apply synonyms: word -> tag slug.
  -- Keep synonyms flat and explicit for Phase 1; Phase 4 replaces with LLM extraction.
  with synonyms(pattern, slug) as (values
    ('mk1',               'fighting-games'),
    ('mortal kombat',     'fighting-games'),
    ('street fighter',    'fighting-games'),
    ('tekken',            'fighting-games'),
    ('fgc',               'fgc'),
    ('fight stick',       'fgc'),
    ('valorant',          'shooters'),
    ('cs2',               'shooters'),
    ('apex',              'shooters'),
    ('cosplay',           'cosplay'),
    ('cosplaying',        'cosplay'),
    ('cosplayer',         'cosplay'),
    ('sewing',            'cosplay'),
    ('voice acting',      'voice-acting'),
    ('voice over',        'voiceover'),
    ('voiceover',         'voiceover'),
    ('vo audition',       'voiceover'),
    ('singing',           'singing'),
    ('sing',              'singing'),
    ('streaming',         'streaming'),
    ('stream',            'streaming'),
    ('obs',               'streaming'),
    ('shoutcasting',      'shoutcasting'),
    ('casting',           'shoutcasting'),
    ('caster',            'shoutcasting'),
    ('commentary',        'commentary'),
    ('writing',           'writing'),
    ('writer',            'writing'),
    ('narrative',         'narrative-design'),
    ('lore',              'lore'),
    ('game dev',          'game-dev'),
    ('game development',  'game-dev'),
    ('unity',             'unity'),
    ('godot',             'godot'),
    ('indie game',        'game-dev'),
    ('community',         'community'),
    ('event organising',  'event-organising'),
    ('event organizing',  'event-organising'),
    ('organiser',         'event-organising'),
    ('host a play',       'event-organising'),
    ('advocacy',          'advocacy'),
    ('chapter lead',      'chapter-lead'),
    ('mobile legends',    'mobas'),
    ('league of legends', 'mobas'),
    ('dota',              'mobas'),
    ('character design',  'character-design'),
    ('concept art',       'concept-art'),
    ('fashion',           'fashion'),
    ('fifa',              'sports-games'),
    ('fc25',              'sports-games'),
    ('rocket league',     'sports-games')
  )
  select array_agg(distinct s.slug) into v_slugs
    from synonyms s
    where position(' ' || s.pattern || ' ' in v_text) > 0
       or position(' ' || s.pattern in v_text) > 0;

  -- Also match direct tag slugs present in the text (e.g. "singing" already a slug).
  with direct as (
    select slug from interest_tags
      where position(lower(slug) in v_text) > 0
         or position(lower(name_en) in v_text) > 0
  )
  select array(
    select distinct x
    from unnest(coalesce(v_slugs, '{}'::text[]) || array(select slug from direct)) as x
    where x is not null
  ) into v_slugs;

  return coalesce(v_slugs, '{}'::text[]);
end;
$$;

-- Onboard a member: creates members row + declared member_tags + optional first milestone
-- + seed growth_snapshot('then'). Called from the onboarding server action.
create or replace function onboard_member(
  p_member uuid,
  p_name text,
  p_handle text,
  p_country text,
  p_city text,
  p_language_pref text,
  p_email text,
  p_phone text,
  p_description text,
  p_declared_slugs text[],
  p_first_milestone text,
  p_primary_org uuid
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_tag_id uuid;
  v_slug text;
  v_umbrella uuid;
  v_derived text[];
begin
  select id into v_umbrella from organisations where type = 'umbrella' limit 1;

  insert into members(
    id, handle, name, email, phone, country, city, language_pref,
    primary_org_id, description_freetext, joined_at
  ) values (
    p_member, p_handle, p_name, p_email, p_phone, p_country, p_city, coalesce(p_language_pref,'en'),
    p_primary_org, p_description, now()
  )
  on conflict (id) do update set
    handle = excluded.handle, name = excluded.name, email = excluded.email, phone = excluded.phone,
    country = excluded.country, city = excluded.city, language_pref = excluded.language_pref,
    primary_org_id = excluded.primary_org_id, description_freetext = excluded.description_freetext;

  -- Declared tags
  foreach v_slug in array coalesce(p_declared_slugs, '{}'::text[])
  loop
    select id into v_tag_id from interest_tags where slug = v_slug;
    if v_tag_id is not null then
      insert into member_tags(member_id, tag_id, source)
        values (p_member, v_tag_id, 'declared')
        on conflict do nothing;
    end if;
  end loop;

  -- Derived tags from description
  v_derived := extract_tags_simple(coalesce(p_description, ''));
  foreach v_slug in array v_derived
  loop
    select id into v_tag_id from interest_tags where slug = v_slug;
    if v_tag_id is not null then
      insert into member_tags(member_id, tag_id, source)
        values (p_member, v_tag_id, 'derived')
        on conflict do nothing;
    end if;
  end loop;

  -- First milestone (optional)
  if p_first_milestone is not null and length(trim(p_first_milestone)) > 0 then
    insert into milestones(member_id, text) values (p_member, trim(p_first_milestone));
  end if;

  -- "Then" snapshot — newcomer template
  insert into growth_snapshots(member_id, as_of, kind, lines)
    values (
      p_member,
      (current_date - interval '6 months')::date,
      'then',
      array[
        'Had not yet joined a women-in-gaming community.',
        'Was still deciding what in gaming was for her.',
        'Had not yet shown up to an event organised by peers.',
        'Had not yet named a first gaming milestone for herself.'
      ]
    )
  on conflict (member_id, kind) do nothing;

  -- Log the join activity.
  perform record_activity(p_member, 'joined_fign', v_umbrella, jsonb_build_object('title', 'Joined FIGN'));
end;
$$;
