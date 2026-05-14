-- =============================================================================
-- Lafay Tracker — migration 0002
-- À exécuter après 0001_core_lafay_tracker.sql
-- =============================================================================
-- Contenu : index de requête, objectifs hebdo, fonction record PR,
--            vue stats hebdo, publication Realtime (idempotente).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Index complémentaires
-- ---------------------------------------------------------------------------
create index if not exists idx_workouts_user_in_progress
  on public.workouts (user_id, started_at desc)
  where status = 'in_progress';

create index if not exists idx_workouts_user_day_utc
  on public.workouts (user_id, ((started_at at time zone 'utc')::date));

create index if not exists idx_workout_sets_completed_we
  on public.workout_sets (workout_exercise_id)
  where completed;

create index if not exists idx_program_session_exercises_exercise
  on public.program_session_exercises (exercise_id);

create index if not exists idx_personal_records_exercise
  on public.personal_records (exercise_id);

-- ---------------------------------------------------------------------------
-- Objectifs hebdomadaires (ex. « 4 séances / sem » sur l’accueil)
-- week_start = lundi (date) en UTC ; l’app peut convertir fuseau si besoin
-- ---------------------------------------------------------------------------
create table if not exists public.weekly_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start date not null,
  target_sessions int not null default 3 check (target_sessions >= 1 and target_sessions <= 14),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

comment on table public.weekly_targets is 'Objectif de séances pour une semaine (week_start = lundi UTC).';

drop trigger if exists trg_weekly_targets_updated on public.weekly_targets;
create trigger trg_weekly_targets_updated
  before update on public.weekly_targets
  for each row execute function public.set_updated_at();

create index if not exists idx_weekly_targets_user_week
  on public.weekly_targets (user_id, week_start desc);

alter table public.weekly_targets enable row level security;

create policy "weekly_targets_select_own"
  on public.weekly_targets for select
  to authenticated
  using (user_id = auth.uid());

create policy "weekly_targets_insert_own"
  on public.weekly_targets for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "weekly_targets_update_own"
  on public.weekly_targets for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "weekly_targets_delete_own"
  on public.weekly_targets for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.weekly_targets to authenticated;

-- ---------------------------------------------------------------------------
-- Met à jour un record perso si p_reps > meilleur connu (SECURITY INVOKER = RLS)
-- ---------------------------------------------------------------------------
create or replace function public.record_personal_best(
  p_exercise_id uuid,
  p_reps int,
  p_workout_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_old int;
  v_new int := p_reps;
  v_prev int;
  v_delta int;
  v_ok_workout boolean := true;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_reps is null or p_reps < 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_reps');
  end if;

  if p_workout_id is not null then
    select exists (
      select 1 from public.workouts w
      where w.id = p_workout_id and w.user_id = v_uid
    )
    into v_ok_workout;
    if not v_ok_workout then
      return jsonb_build_object('ok', false, 'error', 'workout_not_owned');
    end if;
  end if;

  select pr.best_reps into v_old
  from public.personal_records pr
  where pr.user_id = v_uid and pr.exercise_id = p_exercise_id
  for update;

  if not found then
    insert into public.personal_records (user_id, exercise_id, best_reps, previous_best, delta, workout_id)
    values (v_uid, p_exercise_id, v_new, null, null, p_workout_id);
    return jsonb_build_object(
      'ok', true,
      'updated', true,
      'first_record', true,
      'best_reps', v_new,
      'previous_best', null,
      'delta', null
    );
  end if;

  if v_new <= v_old then
    return jsonb_build_object(
      'ok', true,
      'updated', false,
      'best_reps', v_old,
      'attempted', v_new
    );
  end if;

  v_prev := v_old;
  v_delta := v_new - v_prev;

  update public.personal_records pr
  set
    best_reps = v_new,
    previous_best = v_prev,
    delta = v_delta,
    achieved_at = now(),
    workout_id = coalesce(p_workout_id, pr.workout_id)
  where pr.user_id = v_uid and pr.exercise_id = p_exercise_id;

  return jsonb_build_object(
    'ok', true,
    'updated', true,
    'first_record', false,
    'best_reps', v_new,
    'previous_best', v_prev,
    'delta', v_delta
  );
end;
$$;

comment on function public.record_personal_best(uuid, int, uuid) is
  'Met à jour personal_records si p_reps dépasse le max ; workout_id optionnel (doit être à toi).';

grant execute on function public.record_personal_best(uuid, int, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Vue : séances terminées par semaine (UTC) + volume reps
-- (s’appuie sur v_workout_journal défini en 0001)
-- ---------------------------------------------------------------------------
create or replace view public.v_weekly_training_stats
with (security_invoker = true) as
select
  j.user_id,
  date_trunc('week', (j.started_at at time zone 'utc'))::date as week_start_utc,
  count(*)::int as completed_sessions,
  coalesce(sum(j.total_reps), 0)::bigint as total_reps
from public.v_workout_journal j
group by j.user_id, date_trunc('week', (j.started_at at time zone 'utc'));

comment on view public.v_weekly_training_stats is
  'Agrégat par semaine UTC : séances terminées et volume ; filtrer user_id = auth.uid().';

grant select on public.v_weekly_training_stats to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime Supabase (optionnel) : à exécuter une fois si tu veux le live
-- Database → Replication → ajoute les tables, ou :
--   alter publication supabase_realtime add table public.workouts;
--   alter publication supabase_realtime add table public.workout_exercises;
--   alter publication supabase_realtime add table public.workout_sets;
-- ---------------------------------------------------------------------------