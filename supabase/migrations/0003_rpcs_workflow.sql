-- =============================================================================
-- Lafay Tracker — migration 0003 (après 0001 + 0002)
-- RPC : démarrer une séance depuis un gabarit, la terminer ou l’abandonner
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Démarre une séance (workout in_progress + lignes d’exercices depuis le gabarit)
-- ---------------------------------------------------------------------------
create or replace function public.start_workout_from_program_session(p_program_session_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_wid uuid;
  v_title text;
  r_ex record;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select ps.title
  into v_title
  from public.program_sessions ps
  join public.programs pr on pr.id = ps.program_id
  where ps.id = p_program_session_id
    and pr.is_published = true;

  if not found or v_title is null then
    return jsonb_build_object('ok', false, 'error', 'session_not_found_or_unpublished');
  end if;

  insert into public.workouts (user_id, program_session_id, title, status)
  values (v_uid, p_program_session_id, v_title, 'in_progress')
  returning id into v_wid;

  for r_ex in
    select
      pse.exercise_id,
      pse.sort_order,
      e.name,
      e.muscle_group,
      pse.config
    from public.program_session_exercises pse
    join public.exercises e on e.id = pse.exercise_id
    where pse.program_session_id = p_program_session_id
    order by pse.sort_order
  loop
    insert into public.workout_exercises (
      workout_id, exercise_id, sort_order, name, muscle_group, config
    )
    values (
      v_wid,
      r_ex.exercise_id,
      r_ex.sort_order,
      r_ex.name,
      r_ex.muscle_group,
      r_ex.config
    );
  end loop;

  return jsonb_build_object(
    'ok', true,
    'workout_id', v_wid,
    'title', v_title
  );
end;
$$;

comment on function public.start_workout_from_program_session(uuid) is
  'Crée un workout in_progress et copie les exercices du gabarit ; SECURITY INVOKER (RLS).';

grant execute on function public.start_workout_from_program_session(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Termine une séance (completed + ended_at + RPE optionnel)
-- ---------------------------------------------------------------------------
create or replace function public.complete_workout(
  p_workout_id uuid,
  p_rpe smallint default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_n int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_rpe is not null and (p_rpe < 1 or p_rpe > 10) then
    return jsonb_build_object('ok', false, 'error', 'rpe_out_of_range');
  end if;

  update public.workouts w
  set
    status = 'completed',
    ended_at = now(),
    rpe = coalesce(p_rpe, w.rpe),
    notes = coalesce(p_notes, w.notes)
  where w.id = p_workout_id
    and w.user_id = v_uid
    and w.status = 'in_progress';

  get diagnostics v_n = ROW_COUNT;
  if v_n = 0 then
    return jsonb_build_object('ok', false, 'error', 'not_found_or_not_in_progress');
  end if;

  return jsonb_build_object('ok', true, 'workout_id', p_workout_id);
end;
$$;

comment on function public.complete_workout(uuid, smallint, text) is
  'Passe le workout en completed ; RPE 1–10 ou null.';

grant execute on function public.complete_workout(uuid, smallint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Abandonne une séance en cours
-- ---------------------------------------------------------------------------
create or replace function public.abandon_workout(p_workout_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_n int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  update public.workouts w
  set
    status = 'abandoned',
    ended_at = coalesce(w.ended_at, now())
  where w.id = p_workout_id
    and w.user_id = v_uid
    and w.status = 'in_progress';

  get diagnostics v_n = ROW_COUNT;
  if v_n = 0 then
    return jsonb_build_object('ok', false, 'error', 'not_found_or_not_in_progress');
  end if;

  return jsonb_build_object('ok', true, 'workout_id', p_workout_id);
end;
$$;

comment on function public.abandon_workout(uuid) is
  'Passe le workout en abandoned.';

grant execute on function public.abandon_workout(uuid) to authenticated;
