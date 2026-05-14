-- Séances chrono personnalisées (onglet « Mes séances ») — persistance cloud par utilisateur.

create table if not exists public.timer_saved_workouts (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  workout_type text not null
    constraint timer_saved_workouts_type_chk
      check (workout_type in ('tabata', 'hiit', 'amrap', 'emom', 'pyramid', 'custom')),
  config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.timer_saved_workouts is
  'Séances d''intervalles / chrono enregistrées par l''utilisateur (config JSON alignée sur TimerWorkout côté app).';

create index if not exists idx_timer_saved_workouts_user_updated
  on public.timer_saved_workouts (user_id, updated_at desc);

drop trigger if exists trg_timer_saved_workouts_updated on public.timer_saved_workouts;
create trigger trg_timer_saved_workouts_updated
  before update on public.timer_saved_workouts
  for each row execute function public.set_updated_at();

alter table public.timer_saved_workouts enable row level security;

create policy "timer_saved_workouts_select_own"
  on public.timer_saved_workouts for select
  to authenticated
  using (user_id = auth.uid());

create policy "timer_saved_workouts_insert_own"
  on public.timer_saved_workouts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "timer_saved_workouts_update_own"
  on public.timer_saved_workouts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "timer_saved_workouts_delete_own"
  on public.timer_saved_workouts for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.timer_saved_workouts to authenticated;
