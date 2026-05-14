-- =============================================================================
-- Lafay Tracker — schéma Supabase (PostgreSQL)
-- Exécuter dans le SQL Editor Supabase (ou supabase db push)
-- =============================================================================
-- Domaine : profil, exercices, programmes & gabarits, séances utilisateur,
--           séries, jours de repos, records personnels, vues journal/stats.
-- Sécurité : RLS sur toutes les tables ; aucune clé service_role ici.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$
begin
  create type public.workout_status as enum ('in_progress', 'completed', 'abandoned');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Catalogue d’exercices (référence stable : PR, filtres, stats)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  muscle_group text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.exercises is 'Exercices normalisés ; slug stable pour API et analytics.';

-- ---------------------------------------------------------------------------
-- Programmes & gabarits de séances
-- ---------------------------------------------------------------------------
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  level int not null default 1,
  sessions_per_week int,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.programs is 'Programmes (niveaux, fréquence) ; is_published = visible aux utilisateurs.';

create table if not exists public.program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs (id) on delete cascade,
  code text not null,
  title text not null,
  sort_order int not null default 0,
  unique (program_id, code)
);

comment on table public.program_sessions is 'Séances modèle (A, B, …) pour un programme.';

create table if not exists public.program_session_exercises (
  id uuid primary key default gen_random_uuid(),
  program_session_id uuid not null references public.program_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  sort_order int not null default 0,
  target_sets int not null default 3,
  target_reps_hint text,
  notes jsonb not null default '{}'::jsonb,
  unique (program_session_id, sort_order)
);

comment on table public.program_session_exercises is 'Exercices du gabarit : ordre, séries cibles, notes JSON (tempo, hauteur, etc.).';

-- ---------------------------------------------------------------------------
-- Profil utilisateur (1:1 auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  active_program_id uuid references public.programs (id) on delete set null,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Extension profil ; active_program_id pour l’accueil « programme actif ».';

-- ---------------------------------------------------------------------------
-- Séances réalisées (workouts)
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  program_session_id uuid references public.program_sessions (id) on delete set null,
  title text not null,
  status public.workout_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  rpe smallint,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workouts_rpe_range check (rpe is null or (rpe >= 1 and rpe <= 10))
);

comment on table public.workouts is 'Instance de séance : brouillon (en cours), terminée, abandonnée.';

create index if not exists idx_workouts_user_started on public.workouts (user_id, started_at desc);
create index if not exists idx_workouts_user_status on public.workouts (user_id, status);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  sort_order int not null default 0,
  name text not null,
  muscle_group text,
  config jsonb not null default '{}'::jsonb,
  unique (workout_id, sort_order)
);

comment on table public.workout_exercises is 'Snapshot des exercices pour l’historique.';

create index if not exists idx_workout_exercises_workout on public.workout_exercises (workout_id);
create index if not exists idx_workout_exercises_exercise on public.workout_exercises (exercise_id);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_index int not null,
  reps int not null default 0,
  rest_seconds int,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workout_exercise_id, set_index),
  constraint workout_sets_set_index_pos check (set_index >= 1),
  constraint workout_sets_reps_nonneg check (reps >= 0),
  constraint workout_sets_rest_nonneg check (rest_seconds is null or rest_seconds >= 0)
);

comment on table public.workout_sets is 'Séries : reps, durée de repos après la série (secondes).';

create index if not exists idx_workout_sets_we on public.workout_sets (workout_exercise_id);

-- ---------------------------------------------------------------------------
-- Jours de repos (journal « Repos »)
-- ---------------------------------------------------------------------------
create table if not exists public.rest_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rest_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, rest_date)
);

comment on table public.rest_days is 'Marque un jour sans entraînement (affichage journal).';

create index if not exists idx_rest_days_user on public.rest_days (user_id, rest_date desc);

-- ---------------------------------------------------------------------------
-- Records personnels (meilleure perf par exercice)
-- ---------------------------------------------------------------------------
create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  best_reps int not null,
  previous_best int,
  delta int,
  achieved_at timestamptz not null default now(),
  workout_id uuid references public.workouts (id) on delete set null,
  unique (user_id, exercise_id)
);

comment on table public.personal_records is 'Meilleur nombre de reps (corps) par exercice ; upsert côté app ou trigger.';

create index if not exists idx_pr_user on public.personal_records (user_id);

-- ---------------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_workouts_updated on public.workouts;
create trigger trg_workouts_updated
  before update on public.workouts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profil créé à l’inscription
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.programs enable row level security;
alter table public.program_sessions enable row level security;
alter table public.program_session_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.rest_days enable row level security;
alter table public.personal_records enable row level security;

-- Profils : lecture / mise à jour du sien
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Catalogue : lecture pour anon + authenticated (sans fuite de données perso)
create policy "exercises_select_catalog"
  on public.exercises for select
  to anon, authenticated
  using (true);

create policy "programs_select_published"
  on public.programs for select
  to anon, authenticated
  using (is_published = true);

create policy "program_sessions_select_catalog"
  on public.program_sessions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.programs p
      where p.id = program_sessions.program_id
        and p.is_published = true
    )
  );

create policy "program_session_exercises_select_catalog"
  on public.program_session_exercises for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.program_sessions ps
      join public.programs pr on pr.id = ps.program_id
      where ps.id = program_session_exercises.program_session_id
        and pr.is_published = true
    )
  );

-- Workouts : CRUD sur ses lignes uniquement
create policy "workouts_select_own"
  on public.workouts for select
  to authenticated
  using (user_id = auth.uid());

create policy "workouts_insert_own"
  on public.workouts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "workouts_update_own"
  on public.workouts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "workouts_delete_own"
  on public.workouts for delete
  to authenticated
  using (user_id = auth.uid());

-- Exercices de séance : via workout
create policy "workout_exercises_select_own"
  on public.workout_exercises for select
  to authenticated
  using (
    exists (select 1 from public.workouts w where w.id = workout_exercises.workout_id and w.user_id = auth.uid())
  );

create policy "workout_exercises_insert_own"
  on public.workout_exercises for insert
  to authenticated
  with check (
    exists (select 1 from public.workouts w where w.id = workout_exercises.workout_id and w.user_id = auth.uid())
  );

create policy "workout_exercises_update_own"
  on public.workout_exercises for update
  to authenticated
  using (
    exists (select 1 from public.workouts w where w.id = workout_exercises.workout_id and w.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.workouts w where w.id = workout_exercises.workout_id and w.user_id = auth.uid())
  );

create policy "workout_exercises_delete_own"
  on public.workout_exercises for delete
  to authenticated
  using (
    exists (select 1 from public.workouts w where w.id = workout_exercises.workout_id and w.user_id = auth.uid())
  );

-- Séries : via workout_exercises -> workouts
create policy "workout_sets_select_own"
  on public.workout_sets for select
  to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_sets.workout_exercise_id
        and w.user_id = auth.uid()
    )
  );

create policy "workout_sets_insert_own"
  on public.workout_sets for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_sets.workout_exercise_id
        and w.user_id = auth.uid()
    )
  );

create policy "workout_sets_update_own"
  on public.workout_sets for update
  to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_sets.workout_exercise_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_sets.workout_exercise_id
        and w.user_id = auth.uid()
    )
  );

create policy "workout_sets_delete_own"
  on public.workout_sets for delete
  to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_sets.workout_exercise_id
        and w.user_id = auth.uid()
    )
  );

-- Repos
create policy "rest_days_select_own"
  on public.rest_days for select
  to authenticated
  using (user_id = auth.uid());

create policy "rest_days_insert_own"
  on public.rest_days for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "rest_days_update_own"
  on public.rest_days for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "rest_days_delete_own"
  on public.rest_days for delete
  to authenticated
  using (user_id = auth.uid());

-- Records
create policy "personal_records_select_own"
  on public.personal_records for select
  to authenticated
  using (user_id = auth.uid());

create policy "personal_records_insert_own"
  on public.personal_records for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "personal_records_update_own"
  on public.personal_records for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "personal_records_delete_own"
  on public.personal_records for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Vue journal (séances terminées + agrégats)
-- ---------------------------------------------------------------------------
create or replace view public.v_workout_journal
with (security_invoker = true) as
select
  w.id,
  w.user_id,
  (w.started_at at time zone 'utc')::date as day_utc,
  w.title,
  w.status,
  w.rpe,
  w.started_at,
  w.ended_at,
  case
    when w.ended_at is not null then extract(epoch from (w.ended_at - w.started_at))::int
    else null
  end as duration_seconds,
  count(distinct we.id) filter (where we.id is not null) as exercise_count,
  count(ws.id) filter (where ws.completed) as set_count,
  coalesce(sum(ws.reps) filter (where ws.completed), 0)::bigint as total_reps
from public.workouts w
left join public.workout_exercises we on we.workout_id = w.id
left join public.workout_sets ws on ws.workout_exercise_id = we.id
where w.status = 'completed'
group by w.id;

comment on view public.v_workout_journal is 'Liste des séances terminées avec volume ; filtrer user_id = auth.uid() côté requête.';

-- ---------------------------------------------------------------------------
-- Données initiales (démo cohérente avec l’UI actuelle)
-- ---------------------------------------------------------------------------
insert into public.exercises (slug, name, muscle_group, description)
values
  ('tractions', 'Tractions', 'Dos', 'Tractions prises pronation / méthode Lafay'),
  ('pompes-declinees', 'Pompes déclinées', 'Pectoraux', 'Pieds surélevés, tempo dans metadata'),
  ('dips-corps', 'Dips corps', 'Triceps', 'Barres parallèles'),
  ('squat-bulgare', 'Squat bulgare', 'Jambes', 'Fente bulgare'),
  ('pompes-classiques', 'Pompes', 'Pectoraux', 'Pompes au sol')
on conflict (slug) do nothing;

insert into public.programs (slug, name, description, level, sessions_per_week, is_published, sort_order)
values
  ('niveau-1-fondations', 'Niveau 1 – Fondations', 'Corps entier · 3 séances / sem', 1, 3, true, 1),
  ('niveau-2-progression', 'Niveau 2 – Progression', 'Split A/B · 4 séances / sem', 2, 4, true, 2)
on conflict (slug) do nothing;

-- Gabarits A/B niveau 1 (idempotent)
insert into public.program_sessions (program_id, code, title, sort_order)
select p.id, v.code, v.title, v.ord
from public.programs p
cross join (values
  ('A', 'Séance A · Traction / dos', 1),
  ('B', 'Séance B · Poussée', 2)
) as v(code, title, ord)
where p.slug = 'niveau-1-fondations'
  and not exists (
    select 1 from public.program_sessions ps
    where ps.program_id = p.id and ps.code = v.code
  );

-- Lignes d’exercices des gabarits A/B (idempotent)
insert into public.program_session_exercises (
  program_session_id, exercise_id, sort_order, target_sets, target_reps_hint, notes
)
select ps.id, e.id, r.ord, r.ts, r.hint, r.notes::jsonb
from public.program_sessions ps
join public.programs pr on pr.id = ps.program_id and pr.slug = 'niveau-1-fondations'
cross join (values
  ('A', 'tractions', 1, 3, '8–12', '{"tempo":"2-0-2"}'),
  ('A', 'pompes-classiques', 2, 3, '10–15', '{}'),
  ('A', 'squat-bulgare', 3, 3, '10/jambe', '{}'),
  ('B', 'pompes-declinees', 1, 3, '10+', '{"elevation_cm":40,"tempo":"2-0-2"}'),
  ('B', 'dips-corps', 2, 3, '8–12', '{}')
) as r(sess, ex_slug, ord, ts, hint, notes)
join public.exercises e on e.slug = r.ex_slug
where ps.code = r.sess
  and not exists (
    select 1 from public.program_session_exercises pse
    where pse.program_session_id = ps.id and pse.sort_order = r.ord
  );

-- ---------------------------------------------------------------------------
-- Droits API (PostgREST) : anon = catalogue lecture seule ; authenticated = données perso via RLS
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.exercises to anon, authenticated;
grant select on public.programs to anon, authenticated;
grant select on public.program_sessions to anon, authenticated;
grant select on public.program_session_exercises to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.workout_exercises to authenticated;
grant select, insert, update, delete on public.workout_sets to authenticated;
grant select, insert, update, delete on public.rest_days to authenticated;
grant select, insert, update, delete on public.personal_records to authenticated;

grant select on public.v_workout_journal to authenticated;

-- ---------------------------------------------------------------------------
-- Comptes déjà existants avant installation du trigger : créer les profils manquants
-- ---------------------------------------------------------------------------
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    split_part(u.email, '@', 1)
  )
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
