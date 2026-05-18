-- Colonnes reps manquantes si la table a été créée partiellement (CREATE IF NOT EXISTS sans ALTER).

alter table public.entry_tests add column if not exists reps_a smallint;
alter table public.entry_tests add column if not exists reps_b smallint;
alter table public.entry_tests add column if not exists reps_c smallint;
alter table public.entry_tests add column if not exists reps_a1 smallint;
alter table public.entry_tests add column if not exists notes text;

-- recommended_program : colonne générée (0005) ; ne pas ajouter ici si déjà présente.
