-- =============================================================================
-- Lafay Tracker — migration 0008
-- Journal post-séance + extension workout_sets/user_level_progress
-- =============================================================================

create table if not exists public.session_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  rpe smallint check (rpe between 1 and 10),
  energy smallint check (energy between 1 and 5),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  pain_notes text,
  free_notes text,
  created_at timestamptz not null default now(),
  unique (workout_id)
);

alter table public.session_journal enable row level security;

create policy "session_journal_select_own"
  on public.session_journal for select
  to authenticated
  using (auth.uid() = user_id);

create policy "session_journal_insert_own"
  on public.session_journal for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "session_journal_update_own"
  on public.session_journal for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "session_journal_delete_own"
  on public.session_journal for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists idx_session_journal_user on public.session_journal(user_id);
create index if not exists idx_session_journal_workout on public.session_journal(workout_id);

grant select, insert, update, delete on public.session_journal to authenticated;

alter table public.workout_sets
  add column if not exists notes text;

alter table public.user_level_progress
  add column if not exists last_session_date timestamptz,
  add column if not exists sessions_completed int not null default 0,
  add column if not exists last_key_exercise_total int;
