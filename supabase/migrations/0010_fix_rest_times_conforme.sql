-- =============================================================================
-- Migration 0010 : Ajustement repos entre séries / après exercice (référence livre)
-- UPDATE ciblés uniquement — ne réécrit pas le seed 0009.
-- Les codes / séances suivent le seed 0009 (ex. niveau 3 : C1 et non C2).
-- =============================================================================

begin;

-- ---------- Niveau 1 : repos après exercice 25 s (K2 fin de séance 120 s) ----------
update public.training_level_session_exercises tlse
set rest_after_exercise_seconds = 25
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-1'
  and tlse.exercise_code in ('A1', 'C1', 'E', 'F', 'G', 'H');

update public.training_level_session_exercises tlse
set rest_seconds = 60, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-1'
  and tlse.exercise_code = 'K2';

-- ---------- Niveau 2 : idem ----------
update public.training_level_session_exercises tlse
set rest_after_exercise_seconds = 25
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-2'
  and tlse.exercise_code in ('B1', 'A', 'C1', 'E', 'F', 'G', 'H');

update public.training_level_session_exercises tlse
set rest_seconds = 60, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-2'
  and tlse.exercise_code = 'K2';

-- ---------- Niveau 3 ----------
update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 25
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-3'
  and tlse.exercise_code in ('B', 'A2');

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-3'
  and tlse.exercise_code = 'C1';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-3'
  and tlse.exercise_code = 'E1';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-3'
  and tlse.exercise_code = 'F';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 90
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-3'
  and tlse.exercise_code = 'G';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 60
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-3'
  and tlse.exercise_code = 'H';

update public.training_level_session_exercises tlse
set rest_seconds = 60, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-3'
  and tlse.exercise_code = 'K2';

-- ---------- Niveau 4 ----------
update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 25
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-4'
  and tlse.exercise_code = 'B';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-4'
  and tlse.exercise_code in ('A3', 'C2');

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-4'
  and tlse.exercise_code = 'E1';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-4'
  and tlse.exercise_code = 'F';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 60
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-4'
  and tlse.exercise_code in ('G', 'H');

update public.training_level_session_exercises tlse
set rest_seconds = 60, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-4'
  and tlse.exercise_code = 'K2';

-- ---------- Niveau 5 : B / A4 / C2 — 2 min entre séries max-rep, 3 min après bloc ----------
update public.training_level_session_exercises tlse
set rest_seconds = 120, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-5'
  and tlse.exercise_code in ('B', 'A4', 'C2');

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-5'
  and tlse.exercise_code = 'E2';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-5'
  and tlse.exercise_code = 'F';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 60
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-5'
  and tlse.exercise_code in ('G', 'H');

update public.training_level_session_exercises tlse
set rest_seconds = 90, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-5'
  and tlse.exercise_code = 'K';

-- ---------- Niveau 6 ----------
update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 25
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-6'
  and tlse.exercise_code = 'B';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 240
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-6'
  and tlse.exercise_code = 'A5';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-6'
  and tlse.exercise_code = 'C3';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-6'
  and tlse.exercise_code = 'E2';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-6'
  and tlse.exercise_code = 'F';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 60
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-6'
  and tlse.exercise_code in ('G', 'H');

update public.training_level_session_exercises tlse
set rest_seconds = 90, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-6'
  and tlse.exercise_code = 'K';

-- ---------- Niveau 7 — séance A (sort_order 1) ----------
update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 25
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-7'
  and tls.sort_order = 1
  and tlse.exercise_code = 'B';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 240
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-7'
  and tls.sort_order = 1
  and tlse.exercise_code = 'A5';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-7'
  and tls.sort_order = 1
  and tlse.exercise_code = 'C3';

-- ---------- Niveau 7 — séance B tirage ----------
update public.training_level_session_exercises tlse
set rest_seconds = 120, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-7'
  and tls.sort_order = 2
  and tlse.exercise_code = 'K';

update public.training_level_session_exercises tlse
set rest_seconds = 60, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-7'
  and tls.sort_order = 2
  and tlse.exercise_code = 'K2';

-- ---------- Niveau 7 — séance C ----------
update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-7'
  and tls.sort_order = 3
  and tlse.exercise_code = 'E2';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-7'
  and tls.sort_order = 3
  and tlse.exercise_code = 'F';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 60
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-7'
  and tls.sort_order = 3
  and tlse.exercise_code in ('G', 'H');

-- ---------- Niveaux 8–13 : ajustements structure A/B/C du seed ----------
-- Séance poussée (1) : repos longs après bloc pompes / dips
update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 25
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug in ('niveau-8', 'niveau-9', 'niveau-10', 'niveau-11', 'niveau-12', 'niveau-13')
  and tls.sort_order = 1
  and tlse.exercise_code in ('B2');

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 240
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug in ('niveau-8', 'niveau-9', 'niveau-10', 'niveau-11', 'niveau-12', 'niveau-13')
  and tls.sort_order = 1
  and tlse.exercise_code in ('A6', 'A7');

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug in ('niveau-8', 'niveau-9', 'niveau-10', 'niveau-11', 'niveau-12', 'niveau-13')
  and tls.sort_order = 1
  and tlse.exercise_code in ('C4', 'C5');

-- Séance tirage (2)
update public.training_level_session_exercises tlse
set rest_seconds = 90, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug in ('niveau-8', 'niveau-9', 'niveau-10', 'niveau-11', 'niveau-12', 'niveau-13')
  and tls.sort_order = 2
  and tlse.exercise_code = 'K';

update public.training_level_session_exercises tlse
set rest_seconds = 60, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug in ('niveau-8', 'niveau-9', 'niveau-10', 'niveau-11', 'niveau-12', 'niveau-13')
  and tls.sort_order = 2
  and tlse.exercise_code = 'K1';

-- Séance jambes (3)
update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 180
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug in ('niveau-8', 'niveau-9', 'niveau-10', 'niveau-11', 'niveau-12', 'niveau-13')
  and tls.sort_order = 3
  and tlse.exercise_code = 'E2';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 120
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug in ('niveau-8', 'niveau-9', 'niveau-10', 'niveau-11', 'niveau-12', 'niveau-13')
  and tls.sort_order = 3
  and tlse.exercise_code = 'F1';

update public.training_level_session_exercises tlse
set rest_seconds = 25, rest_after_exercise_seconds = 60
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug in ('niveau-8', 'niveau-9', 'niveau-10', 'niveau-11', 'niveau-12', 'niveau-13')
  and tls.sort_order = 3
  and tlse.exercise_code in ('G1', 'H');

-- ---------- Niveau 9 : B1 équivalent B2 — 1 min 30 ----------
update public.training_level_session_exercises tlse
set rest_seconds = 90, rest_after_exercise_seconds = 90
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-9'
  and tls.sort_order = 1
  and tlse.exercise_code = 'B2';

-- ---------- Niveau 13 : repos entre séries 45 s (bloc principal poussée) + note ----------
update public.training_level_session_exercises tlse
set rest_seconds = 45,
  reps_note = concat_ws(' · ', nullif(trim(tlse.reps_note), ''), 'Repos 45 s entre séries — voir livre')
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug = 'niveau-13'
  and tls.sort_order = 1
  and tlse.exercise_code in ('B2', 'A7', 'C5');

-- ---------- 12 bis / 12 ter / entretien : inter-exercice 25 s sauf tirage ----------
update public.training_level_session_exercises tlse
set rest_after_exercise_seconds = 25
from public.training_level_sessions tls
join public.training_levels tl on tl.id = tls.level_id
where tls.id = tlse.session_id
  and tl.slug in ('niveau-12-bis', 'niveau-12-ter', 'entretien-avance')
  and tlse.exercise_code not in ('K', 'K1', 'K2');

commit;
