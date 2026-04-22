-- Fix: complete_lesson raised 42702 "column reference 'lesson_id' is ambiguous"
-- because the RETURNS TABLE output column lesson_id collided with
-- lesson_completions.lesson_id in the WHERE clause. Alias the table.

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
  select lc.id into v_completion_id from lesson_completions lc
    where lc.member_id = p_member and lc.lesson_id = p_lesson;

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
