-- =============================================================================
-- Lafay Tracker — migration 0006
-- Référentiel niveaux/séances/exercices (résumé de suivi, non substitutif)
-- =============================================================================

create table if not exists public.exercise_library (
  code text primary key,
  nom_court text not null,
  groupe_principal text not null,
  materiel_resume text,
  cues_courtes text[] not null default '{}'::text[],
  warning_court text,
  detail_source text not null default 'Se référer au livre',
  created_at timestamptz not null default now()
);

create table if not exists public.training_levels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titre text not null,
  sort_order int not null unique,
  type text not null check (type in ('progression', 'entretien', 'avance')),
  description_courte text,
  frequence_recommandee text,
  duree_phase text,
  objectifs text[] not null default '{}'::text[],
  conditions_entree text,
  conditions_passage text,
  remarques text,
  disclaimer_livre text not null default 'Résumé intégré pour le suivi. Pour les détails d''exécution, variantes complètes et explications approfondies, se référer au livre.',
  difficulty_badge text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists active_training_level_id uuid references public.training_levels (id) on delete set null;

create table if not exists public.training_level_sessions (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.training_levels (id) on delete cascade,
  nom text not null,
  sort_order int not null,
  nb_seances_par_semaine smallint,
  notes_courtes text,
  created_at timestamptz not null default now(),
  unique (level_id, sort_order)
);

create table if not exists public.training_level_session_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_level_sessions (id) on delete cascade,
  sort_order int not null,
  exercise_code text not null references public.exercise_library (code) on delete restrict,
  series smallint,
  reps_mode text not null check (reps_mode in ('fixe', 'max', 'progression', 'temps')),
  reps_cible_min smallint,
  reps_cible_max smallint,
  reps_note text,
  rest_seconds int check (rest_seconds is null or rest_seconds >= 0),
  rest_after_exercise_seconds int check (rest_after_exercise_seconds is null or rest_after_exercise_seconds >= 0),
  tempo_mode text not null default 'normal' check (tempo_mode in ('normal', 'rapide', 'lent', 'special')),
  unilateral boolean not null default false,
  side_mode text not null default 'non_applicable',
  progression_rule text,
  cap_rule text,
  caution_note text,
  book_reference_note text not null default 'Voir le livre',
  created_at timestamptz not null default now(),
  unique (session_id, sort_order)
);

create table if not exists public.user_level_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level_id uuid not null references public.training_levels (id) on delete cascade,
  start_date date not null default current_date,
  last_activity_date date,
  key_exercise_bests jsonb not null default '{}'::jsonb,
  current_status text not null default 'active' check (current_status in ('active', 'completed', 'paused')),
  last_session_id uuid references public.training_level_sessions (id) on delete set null,
  next_recommended_session_id uuid references public.training_level_sessions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, level_id)
);

drop trigger if exists trg_user_level_progress_updated on public.user_level_progress;
create trigger trg_user_level_progress_updated
  before update on public.user_level_progress
  for each row execute function public.set_updated_at();

create table if not exists public.user_level_transitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  from_level_id uuid references public.training_levels (id) on delete set null,
  to_level_id uuid references public.training_levels (id) on delete set null,
  transitioned_at timestamptz not null default now(),
  reason text not null check (reason in ('objectif_atteint', 'stagnation', 'choix_manuel')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_training_levels_sort on public.training_levels (sort_order);
create index if not exists idx_training_sessions_level on public.training_level_sessions (level_id, sort_order);
create index if not exists idx_training_exercises_session on public.training_level_session_exercises (session_id, sort_order);
create index if not exists idx_user_level_progress_user on public.user_level_progress (user_id, updated_at desc);
create index if not exists idx_user_level_transitions_user on public.user_level_transitions (user_id, transitioned_at desc);

alter table public.exercise_library enable row level security;
alter table public.training_levels enable row level security;
alter table public.training_level_sessions enable row level security;
alter table public.training_level_session_exercises enable row level security;
alter table public.user_level_progress enable row level security;
alter table public.user_level_transitions enable row level security;

create policy "exercise_library_select_catalog"
  on public.exercise_library for select
  to anon, authenticated
  using (true);

create policy "training_levels_select_published"
  on public.training_levels for select
  to anon, authenticated
  using (is_published = true);

create policy "training_level_sessions_select_catalog"
  on public.training_level_sessions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.training_levels l
      where l.id = training_level_sessions.level_id
        and l.is_published = true
    )
  );

create policy "training_level_session_exercises_select_catalog"
  on public.training_level_session_exercises for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.training_level_sessions s
      join public.training_levels l on l.id = s.level_id
      where s.id = training_level_session_exercises.session_id
        and l.is_published = true
    )
  );

create policy "user_level_progress_select_own"
  on public.user_level_progress for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_level_progress_insert_own"
  on public.user_level_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user_level_progress_update_own"
  on public.user_level_progress for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user_level_progress_delete_own"
  on public.user_level_progress for delete
  to authenticated
  using (user_id = auth.uid());

create policy "user_level_transitions_select_own"
  on public.user_level_transitions for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_level_transitions_insert_own"
  on public.user_level_transitions for insert
  to authenticated
  with check (user_id = auth.uid());

grant select on public.exercise_library to anon, authenticated;
grant select on public.training_levels to anon, authenticated;
grant select on public.training_level_sessions to anon, authenticated;
grant select on public.training_level_session_exercises to anon, authenticated;
grant select, insert, update, delete on public.user_level_progress to authenticated;
grant select, insert on public.user_level_transitions to authenticated;

create or replace function public.set_active_training_level(p_level_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_level_exists boolean;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select exists (
    select 1 from public.training_levels l where l.id = p_level_id and l.is_published = true
  ) into v_level_exists;

  if not v_level_exists then
    return jsonb_build_object('ok', false, 'error', 'level_not_found');
  end if;

  update public.profiles p
  set active_training_level_id = p_level_id
  where p.id = v_uid;

  insert into public.user_level_progress (user_id, level_id, start_date, last_activity_date, current_status)
  values (v_uid, p_level_id, current_date, current_date, 'active')
  on conflict (user_id, level_id)
  do update set
    current_status = 'active',
    last_activity_date = current_date;

  return jsonb_build_object('ok', true, 'level_id', p_level_id);
end;
$$;

grant execute on function public.set_active_training_level(uuid) to authenticated;

create or replace function public.start_workout_from_training_session(p_training_session_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wid uuid;
  v_sid uuid;
  v_title text;
  r_ex record;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select
    s.id,
    format('%s · %s', l.titre, s.nom)
  into v_sid, v_title
  from public.training_level_sessions s
  join public.training_levels l on l.id = s.level_id
  where s.id = p_training_session_id
    and l.is_published = true;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'training_session_not_found');
  end if;

  insert into public.workouts (user_id, title, status)
  values (v_uid, v_title, 'in_progress')
  returning id into v_wid;

  for r_ex in
    select
      tse.*,
      el.nom_court,
      el.groupe_principal
    from public.training_level_session_exercises tse
    join public.exercise_library el on el.code = tse.exercise_code
    where tse.session_id = v_sid
    order by tse.sort_order
  loop
    insert into public.workout_exercises (
      workout_id, exercise_id, sort_order, name, muscle_group, config
    )
    values (
      v_wid,
      null,
      r_ex.sort_order,
      format('%s — %s', r_ex.exercise_code, r_ex.nom_court),
      r_ex.groupe_principal,
      jsonb_build_object(
        'exercise_code', r_ex.exercise_code,
        'series', r_ex.series,
        'reps_mode', r_ex.reps_mode,
        'reps_cible_min', r_ex.reps_cible_min,
        'reps_cible_max', r_ex.reps_cible_max,
        'reps_note', r_ex.reps_note,
        'rest_seconds', r_ex.rest_seconds,
        'rest_after_exercise_seconds', r_ex.rest_after_exercise_seconds,
        'tempo_mode', r_ex.tempo_mode,
        'unilateral', r_ex.unilateral,
        'side_mode', r_ex.side_mode,
        'progression_rule', r_ex.progression_rule,
        'cap_rule', r_ex.cap_rule,
        'caution_note', r_ex.caution_note,
        'book_reference_note', r_ex.book_reference_note
      )
    );
  end loop;

  with lines as (
    select id, config, sort_order
    from public.workout_exercises
    where workout_id = v_wid
  )
  insert into public.workout_sets (workout_exercise_id, set_index, reps, rest_seconds, completed)
  select
    l.id,
    gs.idx,
    0,
    coalesce((l.config ->> 'rest_seconds')::int, 25),
    false
  from lines l
  cross join lateral generate_series(1, greatest(1, coalesce((l.config ->> 'series')::int, 1))) as gs(idx)
  order by l.sort_order, gs.idx;

  update public.user_level_progress p
  set
    last_activity_date = current_date,
    last_session_id = v_sid
  where p.user_id = v_uid
    and p.level_id = (
      select s.level_id from public.training_level_sessions s where s.id = v_sid
    );

  return jsonb_build_object(
    'ok', true,
    'workout_id', v_wid,
    'title', v_title
  );
end;
$$;

grant execute on function public.start_workout_from_training_session(uuid) to authenticated;
