-- =============================================================================
-- Lafay Tracker — mensurations (Méthode Lafay)
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

comment on table public.body_measurements is 'Mensurations mensuelles ; comparer measured_at pour la progression.';

create index if not exists idx_body_measurements_user_date
  on public.body_measurements (user_id, measured_at desc);

alter table public.body_measurements enable row level security;

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

grant select, insert, update, delete on public.body_measurements to authenticated;
