-- Core static seed: XP awards lookup. Organisations, interest taxonomy, lessons,
-- curricula, items, and members live in JSON files loaded by `pnpm seed`.

insert into xp_awards(kind, amount, kind_group) values
  ('joined_fign',           100, 'doing'),
  ('lesson_completed',       30, 'learning'),
  ('lesson_option_make_something', 40, 'doing'),
  ('lesson_option_reflect',       20, 'reflection'),
  ('lesson_option_go_further',    30, 'doing'),
  ('lesson_option_take_it_live',  50, 'doing'),
  ('lesson_option_bring_someone', 20, 'doing'),
  ('lesson_option_bookmark',      10, 'reflection'),
  ('item_registered',        20, 'doing'),
  ('event_attended',         60, 'doing'),
  ('event_hosted',          200, 'doing'),
  ('scrim_played',           40, 'doing'),
  ('post_written',          120, 'doing'),
  ('newcomer_welcomed',      40, 'doing'),
  ('mentor_call_completed',  80, 'doing'),
  ('tournament_placed',     500, 'doing'),
  ('game_jam_shipped',      400, 'doing'),
  ('chapter_founded',      1000, 'doing'),
  ('scholarship_won',       500, 'doing')
on conflict (kind) do update set amount = excluded.amount, kind_group = excluded.kind_group;
