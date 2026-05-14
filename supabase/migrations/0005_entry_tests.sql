-- =============================================================================
-- Lafay Tracker — tests de départ (reps A, B, C, A1) + programme recommandé
-- =============================================================================

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

comment on table public.entry_tests is 'Tests initiaux ; reps_b détermine recommended_program (livre Lafay).';

create index if not exists idx_entry_tests_user_date
  on public.entry_tests (user_id, tested_at desc);

alter table public.entry_tests enable row level security;

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

grant select, insert, update, delete on public.entry_tests to authenticated;
