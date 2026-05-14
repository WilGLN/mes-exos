-- Retrait du catalogue « programmes » démo (0001). L’app s’appuie sur training_levels + migrations 0006+.

delete from public.program_session_exercises
where program_session_id in (
  select ps.id
  from public.program_sessions ps
  join public.programs p on p.id = ps.program_id
  where p.slug in ('niveau-1-fondations', 'niveau-2-progression')
);

delete from public.program_sessions
where program_id in (
  select id from public.programs where slug in ('niveau-1-fondations', 'niveau-2-progression')
);

update public.profiles
set active_program_id = null
where active_program_id in (
  select id from public.programs where slug in ('niveau-1-fondations', 'niveau-2-progression')
);

delete from public.programs
where slug in ('niveau-1-fondations', 'niveau-2-progression');
