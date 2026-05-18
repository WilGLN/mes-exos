-- =============================================================================
-- Profil : tests de départ + mensurations (idempotent si 0004/0005 non appliqués)
-- =============================================================================

create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measured_at date not null default (timezone('utc', now()))::date,
  weight_kg numeric(5, 2),
  chest_cm numeric(5, 1),
  waist_cm numeric(5, 1),
  hips_cm numeric(5, 1),
  thigh_cm numeric(5, 1),
  calf_cm numeric(5, 1),
  shoulders_cm numeric(5, 1),
  arm_cm numeric(5, 1),
  photos_taken boolean not null default false,
  photo_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.entry_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tested_at date not null default (timezone('utc', now()))::date,
  reps_a smallint,
  reps_b smallint,
  reps_c smallint,
  reps_a1 smallint,
  recommended_program text generated always as (
    case
      when reps_b is null then null::text
      when reps_b <= 4 then 'programme_1'
      when reps_b <= 7 then 'programme_2'
      else 'niveau_2'
    end
  ) stored,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_body_measurements_user_date
  on public.body_measurements (user_id, measured_at desc);

create index if not exists idx_entry_tests_user_date
  on public.entry_tests (user_id, tested_at desc);

alter table public.body_measurements enable row level security;
alter table public.entry_tests enable row level security;

drop policy if exists "body_measurements_select_own" on public.body_measurements;
drop policy if exists "body_measurements_insert_own" on public.body_measurements;
drop policy if exists "body_measurements_update_own" on public.body_measurements;
drop policy if exists "body_measurements_delete_own" on public.body_measurements;

create policy "body_measurements_select_own"
  on public.body_measurements for select
  to authenticated
  using (user_id = auth.uid());

create policy "body_measurements_insert_own"
  on public.body_measurements for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "body_measurements_update_own"
  on public.body_measurements for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "body_measurements_delete_own"
  on public.body_measurements for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "entry_tests_select_own" on public.entry_tests;
drop policy if exists "entry_tests_insert_own" on public.entry_tests;
drop policy if exists "entry_tests_update_own" on public.entry_tests;
drop policy if exists "entry_tests_delete_own" on public.entry_tests;

create policy "entry_tests_select_own"
  on public.entry_tests for select
  to authenticated
  using (user_id = auth.uid());

create policy "entry_tests_insert_own"
  on public.entry_tests for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "entry_tests_update_own"
  on public.entry_tests for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "entry_tests_delete_own"
  on public.entry_tests for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert, update, delete on public.body_measurements to authenticated;
grant select, insert, update, delete on public.entry_tests to authenticated;
