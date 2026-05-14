-- ============================================================
-- Migration 0009 : Seed training catalog — CONFORME LIVRE LAFAY
-- Remplace le contenu de 0007 (DELETE + INSERT)
-- ============================================================

begin;

-- 1) Purge (ordre inverse FK)
delete from public.user_level_transitions;
delete from public.user_level_progress;
delete from public.training_level_session_exercises;
delete from public.training_level_sessions;
delete from public.training_levels;
delete from public.exercise_library;

-- 2) Référentiel minimal exercices (résumés courts, originaux)
insert into public.exercise_library (code, nom_court, groupe_principal, materiel_resume, cues_courtes, warning_court, detail_source)
values
  ('A', 'Pompes classiques', 'Pectoraux / triceps', 'Sol', array['Gainage neutre', 'Amplitude propre'], null, 'Se référer au livre'),
  ('A1', 'Pompes genoux', 'Pectoraux / triceps', 'Sol', array['Buste aligné', 'Montée contrôlée'], null, 'Se référer au livre'),
  ('A2', 'Pompes large', 'Pectoraux', 'Sol', array['Coudes stables', 'Rythme régulier'], null, 'Se référer au livre'),
  ('A3', 'Pompes pieds surélevés', 'Pectoraux / épaules', 'Sol + appui', array['Gainage fort', 'Descente propre'], null, 'Se référer au livre'),
  ('A4', 'Pompes déséquilibre', 'Pectoraux / triceps', 'Sol', array['Stabilité bras', 'Tempo constant'], null, 'Se référer au livre'),
  ('A5', 'Pompes avancées', 'Pectoraux / triceps', 'Sol', array['Contrôle total', 'Stop si triche'], null, 'Se référer au livre'),
  ('A6', 'Pompes avancées 2', 'Pectoraux / triceps', 'Sol', array['Blocage propre', 'Rythme précis'], null, 'Se référer au livre'),
  ('A7', 'Pompes avancées 3', 'Pectoraux / triceps', 'Sol', array['Qualité avant volume', 'Respiration active'], null, 'Se référer au livre'),
  ('B', 'Dips complet', 'Triceps / pectoraux', 'Barres/chaises', array['Épaules basses', 'Amplitude maîtrisée'], null, 'Se référer au livre'),
  ('B1', 'Dips partiel', 'Triceps', 'Barres/chaises', array['Rythme rapide', 'Sans douleur'], null, 'Se référer au livre'),
  ('B2', 'Dips variante', 'Triceps / épaules', 'Barres/chaises', array['Trajectoire stable', 'Éviter l''à-coup'], null, 'Se référer au livre'),
  ('C1', 'Dips chaises serré', 'Triceps', 'Chaises', array['Blocage propre', 'Montée active'], null, 'Se référer au livre'),
  ('C2', 'Dips chaises variant', 'Triceps / épaules', 'Chaises', array['Amplitude utile', 'Rythme rapide'], null, 'Se référer au livre'),
  ('C3', 'Dips large', 'Pectoraux / triceps', 'Chaises', array['Pectoraux engagés', 'Coude contrôlé'], null, 'Se référer au livre'),
  ('C4', 'Dips avancé C4', 'Pectoraux / triceps', 'Chaises', array['Volume contrôlé', 'Tempo propre'], null, 'Se référer au livre'),
  ('C5', 'Dips avancé C5', 'Pectoraux / triceps', 'Chaises', array['Amplitude stricte', 'Rythme maîtrisé'], null, 'Se référer au livre'),
  ('D', 'Squats poids du corps', 'Jambes', 'Sol', array['Genoux alignés', 'Talons stables'], null, 'Se référer au livre'),
  ('E', 'Fentes alternées', 'Quadriceps / fessiers', 'Sol', array['Buste droit', 'Amplitude stable'], null, 'Se référer au livre'),
  ('E1', 'Fentes profondes', 'Quadriceps / fessiers', 'Sol', array['Descente contrôlée', 'Genou stable'], null, 'Se référer au livre'),
  ('E2', 'Fentes avancées', 'Quadriceps / fessiers', 'Sol', array['Stabilité hanche', 'Contrôle complet'], null, 'Se référer au livre'),
  ('F', 'Sauts', 'Jambes / cardio', 'Sol', array['Réception souple', 'Rythme régulier'], null, 'Se référer au livre'),
  ('F1', 'Sauts avancés', 'Jambes / cardio', 'Sol', array['Impulsion contrôlée', 'Gainage actif'], null, 'Se référer au livre'),
  ('G', 'Abdominaux crunch', 'Abdominaux', 'Sol', array['Nuque neutre', 'Expirer en montée'], null, 'Se référer au livre'),
  ('G1', 'Abdos avancés', 'Abdominaux', 'Sol', array['Amplitude propre', 'Pas d''élan'], null, 'Se référer au livre'),
  ('H', 'Gainage abdominal', 'Abdominaux profonds', 'Sol', array['Corps aligné', 'Respiration continue'], null, 'Se référer au livre'),
  ('K', 'Tractions pronation', 'Dos / biceps', 'Barre fixe', array['Poitrine haute', 'Sans balancier'], 'Barre fixe nécessaire — voir le livre', 'Se référer au livre'),
  ('K1', 'Tractions supination', 'Dos / biceps', 'Barre fixe', array['Amplitude complète', 'Rythme normal'], 'Barre fixe nécessaire — voir le livre', 'Se référer au livre'),
  ('K2', 'Tirage incliné', 'Dos / biceps', 'Barre', array['Corps gainé', 'Traction propre'], 'Hauteur barre ajustable', 'Se référer au livre');

-- 3) Niveaux
with lvl(slug, titre, sort_order, type, frequence_recommandee, description_courte, conditions_passage, remarques, difficulty_badge) as (
  values
    ('niveau-1', 'Niveau 1', 1, 'progression', 'S1: 4 séances, puis 3/sem', 'Démarrage progressif des mouvements de base.', 'Passage: 6x6 sur A1/C1 et 3x5 sur K2.', 'Voir le livre p. 139 à 191.', 'débutant'),
    ('niveau-2', 'Niveau 2', 2, 'progression', '3 séances / semaine', 'Introduction B1, hausse de volume.', 'Passage: 6x8 sur exercices principaux.', 'Voir le livre p. 138 à 191.', 'débutant+'),
    ('niveau-3', 'Niveau 3', 3, 'progression', '3 séances / semaine', 'B complet et A2.', 'Passage: 6x10 sur B et A2.', 'Voir le livre p. 140 à 191.', 'intermédiaire'),
    ('niveau-4', 'Niveau 4', 4, 'progression', '3 séances / semaine', 'A3 et C2, palier entretien.', 'Passage: 6x12 sur B et A3.', 'Voir le livre p. 141 à 191.', 'intermédiaire'),
    ('niveau-5', 'Niveau 5', 5, 'progression', '3 séances / semaine', 'Introduction K et A4.', 'Passage: 3x5 sur K et 6x12 sur B.', 'Voir le livre p. 142 à 191.', 'intermédiaire+'),
    ('niveau-6', 'Niveau 6', 6, 'progression', '3 séances / semaine', 'Renforcement K et A5.', 'Passage: 3x8 sur K et 6x15 sur B.', 'Voir le livre p. 143 à 191.', 'intermédiaire+'),
    ('niveau-7', 'Niveau 7', 7, 'avance', '3 séances / semaine (A/B/C)', 'Split poussee/tirage/jambes.', 'Passage: progression stable des trois séances.', 'Voir le livre (niveau avancé).', 'avancé'),
    ('niveau-8', 'Niveau 8', 8, 'avance', '3 séances / semaine (A/B/C)', 'Hausse progressive et variantes avancées.', 'Passage: objectifs avancés du livre.', 'Voir le livre (niveau avancé).', 'avancé'),
    ('niveau-9', 'Niveau 9', 9, 'avance', '3 séances / semaine (A/B/C)', 'Volume élevé en split.', 'Passage: objectifs avancés du livre.', 'Voir le livre (niveau avancé).', 'avancé+'),
    ('niveau-10', 'Niveau 10', 10, 'avance', '3 séances / semaine (A/B/C)', 'Consolidation haute intensité.', 'Passage: objectifs avancés du livre.', 'Voir le livre (niveau avancé).', 'expert'),
    ('niveau-11', 'Niveau 11', 11, 'avance', '3 à 4 séances / semaine', 'Bloc expert.', 'Passage: critères du livre.', 'Voir le livre (niveau expert).', 'expert'),
    ('niveau-12', 'Niveau 12', 12, 'avance', '3 à 4 séances / semaine', 'Sommet de progression.', 'Passage: 12 bis/12 ter selon cycle.', 'Voir le livre (niveau expert).', 'expert'),
    ('niveau-12-bis', 'Niveau 12 bis', 13, 'entretien', '3 séances / semaine', 'Entretien avancé variante A.', 'Maintien/transition vers 12 ter.', 'Voir le livre (entretien).', 'entretien'),
    ('niveau-12-ter', 'Niveau 12 ter', 14, 'entretien', '3 séances / semaine', 'Entretien avancé variante B.', 'Maintien/transition vers 13.', 'Voir le livre (entretien).', 'entretien'),
    ('niveau-13', 'Niveau 13', 15, 'avance', '3 à 4 séances / semaine', 'Niveau maximum.', 'Maintien selon objectifs.', 'Voir le livre (niveau expert).', 'élite'),
    ('entretien-avance', 'Entretien avancé', 16, 'entretien', '2 à 4 séances / semaine', 'Bloc de maintien durable.', 'Ajuster selon récupération.', 'Voir le livre.', 'entretien')
)
insert into public.training_levels (
  slug, titre, sort_order, type, frequence_recommandee, description_courte, conditions_passage, remarques, difficulty_badge
)
select slug, titre, sort_order, type, frequence_recommandee, description_courte, conditions_passage, remarques, difficulty_badge
from lvl;

-- 4) Séances
with sess(level_slug, nom, sort_order, nb_seances_par_semaine, notes_courtes) as (
  values
    ('niveau-1', 'Séance A', 1, 3, 'Séance unique répétée.'),
    ('niveau-2', 'Séance A', 1, 3, 'Séance unique répétée.'),
    ('niveau-3', 'Séance A', 1, 3, 'Séance unique répétée.'),
    ('niveau-4', 'Séance A', 1, 3, 'Séance unique répétée.'),
    ('niveau-5', 'Séance A', 1, 3, 'Séance unique répétée.'),
    ('niveau-6', 'Séance A', 1, 3, 'Séance unique répétée.'),
    ('niveau-7', 'Séance A — Poussée', 1, 3, 'Pectoraux / triceps'),
    ('niveau-7', 'Séance B — Tirage', 2, 3, 'Dos / biceps'),
    ('niveau-7', 'Séance C — Jambes/Gainage', 3, 3, 'Jambes / tronc'),
    ('niveau-8', 'Séance A — Poussée', 1, 3, 'Pectoraux / triceps'),
    ('niveau-8', 'Séance B — Tirage', 2, 3, 'Dos / biceps'),
    ('niveau-8', 'Séance C — Jambes/Gainage', 3, 3, 'Jambes / tronc'),
    ('niveau-9', 'Séance A — Poussée', 1, 3, 'Pectoraux / triceps'),
    ('niveau-9', 'Séance B — Tirage', 2, 3, 'Dos / biceps'),
    ('niveau-9', 'Séance C — Jambes/Gainage', 3, 3, 'Jambes / tronc'),
    ('niveau-10', 'Séance A — Poussée', 1, 3, 'Pectoraux / triceps'),
    ('niveau-10', 'Séance B — Tirage', 2, 3, 'Dos / biceps'),
    ('niveau-10', 'Séance C — Jambes/Gainage', 3, 3, 'Jambes / tronc'),
    ('niveau-11', 'Séance A — Poussée', 1, 3, 'Pectoraux / triceps'),
    ('niveau-11', 'Séance B — Tirage', 2, 3, 'Dos / biceps'),
    ('niveau-11', 'Séance C — Jambes/Gainage', 3, 3, 'Jambes / tronc'),
    ('niveau-12', 'Séance A — Poussée', 1, 3, 'Pectoraux / triceps'),
    ('niveau-12', 'Séance B — Tirage', 2, 3, 'Dos / biceps'),
    ('niveau-12', 'Séance C — Jambes/Gainage', 3, 3, 'Jambes / tronc'),
    ('niveau-12-bis', 'Séance A', 1, 3, 'Entretien poussee'),
    ('niveau-12-bis', 'Séance B', 2, 3, 'Entretien tirage'),
    ('niveau-12-bis', 'Séance C', 3, 3, 'Entretien jambes'),
    ('niveau-12-ter', 'Séance A', 1, 3, 'Entretien poussee'),
    ('niveau-12-ter', 'Séance B', 2, 3, 'Entretien tirage'),
    ('niveau-12-ter', 'Séance C', 3, 3, 'Entretien jambes'),
    ('niveau-13', 'Séance A — Poussée', 1, 3, 'Bloc élite'),
    ('niveau-13', 'Séance B — Tirage', 2, 3, 'Bloc élite'),
    ('niveau-13', 'Séance C — Jambes/Gainage', 3, 3, 'Bloc élite'),
    ('entretien-avance', 'Séance A', 1, 3, 'Maintien haut niveau')
)
insert into public.training_level_sessions (level_id, nom, sort_order, nb_seances_par_semaine, notes_courtes)
select l.id, s.nom, s.sort_order, s.nb_seances_par_semaine, s.notes_courtes
from sess s
join public.training_levels l on l.slug = s.level_slug;

-- 5) Exercices par séance (conformes niveaux 1-7 ; progression structurée 8+)
with ex(level_slug, session_order, sort_order, exercise_code, series, reps_mode, reps_min, reps_max, reps_note, rest_seconds, rest_after, tempo_mode, unilateral, side_mode, caution_note, book_ref, progression_rule) as (
  values
    -- Niveau 1
    ('niveau-1', 1, 1, 'A1', 6, 'progression', 1, 6, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 139', 'Progression douce'),
    ('niveau-1', 1, 2, 'C1', 6, 'progression', 1, 6, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 155', 'Progression douce'),
    ('niveau-1', 1, 3, 'E', 6, 'progression', 5, 10, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 163', 'Stabilité des appuis'),
    ('niveau-1', 1, 4, 'F', 4, 'progression', 5, 10, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Rythme constant'),
    ('niveau-1', 1, 5, 'G', 6, 'progression', 10, 20, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Gainage actif'),
    ('niveau-1', 1, 6, 'H', 6, 'progression', 1, 1, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Tenue stricte'),
    ('niveau-1', 1, 7, 'K2', 3, 'progression', 5, 12, '60 s selon fatigue', 60, 120, 'normal', false, 'non_applicable', 'Hauteur barre ajustable', 'Voir le livre p. 191', 'Traction contrôlée'),

    -- Niveau 2
    ('niveau-2', 1, 1, 'B1', 6, 'progression', 5, 10, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 149', 'Cadence rapide'),
    ('niveau-2', 1, 2, 'A', 6, 'progression', 5, 10, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 138', 'Cadence rapide'),
    ('niveau-2', 1, 3, 'C1', 6, 'progression', 5, 10, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 155', 'Cadence rapide'),
    ('niveau-2', 1, 4, 'E', 6, 'progression', 5, 10, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 163', 'Amplitude régulière'),
    ('niveau-2', 1, 5, 'F', 4, 'progression', 5, 10, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Rythme stable'),
    ('niveau-2', 1, 6, 'G', 6, 'progression', 10, 20, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Gainage actif'),
    ('niveau-2', 1, 7, 'H', 6, 'progression', 1, 3, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Tenue contrôlée'),
    ('niveau-2', 1, 8, 'K2', 3, 'progression', 8, 15, '60 s selon fatigue', 60, 120, 'normal', false, 'non_applicable', 'Hauteur barre ajustable', 'Voir le livre p. 191', 'Traction contrôlée'),

    -- Niveau 3
    ('niveau-3', 1, 1, 'B', 6, 'progression', 5, 12, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 150', 'Progression continue'),
    ('niveau-3', 1, 2, 'A2', 6, 'progression', 5, 12, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 140', 'Amplitude stable'),
    ('niveau-3', 1, 3, 'C1', 6, 'progression', 5, 12, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 155', 'Cadence rapide'),
    ('niveau-3', 1, 4, 'E1', 6, 'progression', 5, 10, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 164', 'Amplitude profonde'),
    ('niveau-3', 1, 5, 'F', 4, 'progression', 8, 15, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Rythme stable'),
    ('niveau-3', 1, 6, 'G', 6, 'progression', 15, 25, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Contrôle abdos'),
    ('niveau-3', 1, 7, 'H', 6, 'progression', 3, 6, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Tenue contrôlée'),
    ('niveau-3', 1, 8, 'K2', 3, 'progression', 10, 18, null, 60, 120, 'normal', false, 'non_applicable', 'Hauteur barre ajustable', 'Voir le livre p. 191', 'Progression tirage'),

    -- Niveau 4
    ('niveau-4', 1, 1, 'B', 6, 'progression', 8, 15, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 150', 'Volume régulier'),
    ('niveau-4', 1, 2, 'A3', 6, 'progression', 5, 12, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 141', 'Progression propre'),
    ('niveau-4', 1, 3, 'C2', 6, 'progression', 5, 12, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 156', 'Cadence rapide'),
    ('niveau-4', 1, 4, 'E1', 6, 'progression', 8, 15, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 164', 'Amplitude profonde'),
    ('niveau-4', 1, 5, 'F', 4, 'progression', 10, 20, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Explosivité contrôlée'),
    ('niveau-4', 1, 6, 'G', 6, 'progression', 20, 30, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Contrôle abdos'),
    ('niveau-4', 1, 7, 'H', 6, 'progression', 5, 10, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Tenue contrôlée'),
    ('niveau-4', 1, 8, 'K2', 3, 'progression', 12, 20, null, 60, 120, 'normal', false, 'non_applicable', 'Hauteur barre ajustable', 'Voir le livre p. 191', 'Progression tirage'),

    -- Niveau 5
    ('niveau-5', 1, 1, 'B', 6, 'progression', 10, 18, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 150', 'Cadence rapide'),
    ('niveau-5', 1, 2, 'A4', 6, 'progression', 5, 12, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 142', 'Contrôle complet'),
    ('niveau-5', 1, 3, 'C2', 6, 'progression', 8, 15, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 156', 'Cadence rapide'),
    ('niveau-5', 1, 4, 'E2', 6, 'progression', 5, 12, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Fentes avancées'),
    ('niveau-5', 1, 5, 'F', 4, 'progression', 12, 20, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Rythme stable'),
    ('niveau-5', 1, 6, 'G', 6, 'progression', 20, 35, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Contrôle abdos'),
    ('niveau-5', 1, 7, 'H', 6, 'progression', 8, 15, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Tenue lente'),
    ('niveau-5', 1, 8, 'K', 3, 'progression', 1, 5, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 189', 'Tractions intro'),

    -- Niveau 6
    ('niveau-6', 1, 1, 'B', 6, 'progression', 12, 20, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 150', 'Cadence rapide'),
    ('niveau-6', 1, 2, 'A5', 6, 'progression', 5, 12, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 143', 'Progression constante'),
    ('niveau-6', 1, 3, 'C3', 6, 'progression', 5, 12, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 157', 'Cadence rapide'),
    ('niveau-6', 1, 4, 'E2', 6, 'progression', 8, 15, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Amplitude stable'),
    ('niveau-6', 1, 5, 'F', 4, 'progression', 15, 25, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Explosivité contrôlée'),
    ('niveau-6', 1, 6, 'G', 6, 'progression', 25, 40, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Contrôle abdos'),
    ('niveau-6', 1, 7, 'H', 6, 'progression', 10, 20, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Tenue lente'),
    ('niveau-6', 1, 8, 'K', 3, 'progression', 3, 8, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 189', 'Tractions'),

    -- Niveau 7 (A/B/C exact demandé)
    ('niveau-7', 1, 1, 'B', 6, 'progression', 15, 25, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 150', 'Poussée'),
    ('niveau-7', 1, 2, 'A5', 6, 'progression', 8, 15, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 143', 'Poussée'),
    ('niveau-7', 1, 3, 'C3', 6, 'progression', 8, 15, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 157', 'Poussée'),
    ('niveau-7', 2, 1, 'K', 6, 'progression', 3, 10, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 189', 'Tirage'),
    ('niveau-7', 2, 2, 'K2', 3, 'progression', 15, 25, null, 60, 120, 'normal', false, 'non_applicable', 'Hauteur barre ajustable', 'Voir le livre p. 191', 'Tirage'),
    ('niveau-7', 3, 1, 'E2', 6, 'progression', 10, 18, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Jambes'),
    ('niveau-7', 3, 2, 'F', 4, 'progression', 15, 25, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Jambes'),
    ('niveau-7', 3, 3, 'G', 6, 'progression', 30, 50, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Abdos'),
    ('niveau-7', 3, 4, 'H', 6, 'progression', 15, 25, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Gainage'),

    -- Niveaux 8 à 13 : même structure A/B/C avec progression graduelle
    ('niveau-8', 1, 1, 'B2', 6, 'progression', 16, 26, null, 25, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 151', 'Poussée'),
    ('niveau-8', 1, 2, 'A6', 6, 'progression', 9, 16, null, 45, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 143', 'Poussée'),
    ('niveau-8', 1, 3, 'C4', 6, 'progression', 9, 16, null, 45, 60, 'special', false, 'non_applicable', null, 'Voir le livre p. 157', 'Poussée'),
    ('niveau-8', 2, 1, 'K', 6, 'progression', 4, 11, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 189', 'Tirage'),
    ('niveau-8', 2, 2, 'K1', 4, 'progression', 4, 10, null, 60, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 190', 'Tirage'),
    ('niveau-8', 3, 1, 'E2', 6, 'progression', 11, 19, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Jambes'),
    ('niveau-8', 3, 2, 'F1', 4, 'progression', 16, 26, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Jambes'),
    ('niveau-8', 3, 3, 'G1', 6, 'progression', 32, 52, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Abdos'),
    ('niveau-8', 3, 4, 'H', 6, 'progression', 16, 26, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Gainage'),

    ('niveau-9', 1, 1, 'B2', 6, 'progression', 17, 27, null, 45, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 151', 'Poussée'),
    ('niveau-9', 1, 2, 'A6', 6, 'progression', 10, 17, null, 45, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 143', 'Poussée'),
    ('niveau-9', 1, 3, 'C5', 6, 'progression', 10, 17, null, 45, 60, 'special', false, 'non_applicable', null, 'Voir le livre p. 157', 'Poussée'),
    ('niveau-9', 2, 1, 'K', 6, 'progression', 5, 12, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 189', 'Tirage'),
    ('niveau-9', 2, 2, 'K1', 4, 'progression', 5, 11, null, 60, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 190', 'Tirage'),
    ('niveau-9', 3, 1, 'E2', 6, 'progression', 12, 20, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Jambes'),
    ('niveau-9', 3, 2, 'F1', 4, 'progression', 17, 27, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Jambes'),
    ('niveau-9', 3, 3, 'G1', 6, 'progression', 34, 54, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Abdos'),
    ('niveau-9', 3, 4, 'H', 6, 'progression', 17, 27, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Gainage'),

    ('niveau-10', 1, 1, 'B2', 6, 'progression', 18, 28, null, 45, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 151', 'Poussée'),
    ('niveau-10', 1, 2, 'A7', 6, 'progression', 11, 18, null, 60, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 143', 'Poussée'),
    ('niveau-10', 1, 3, 'C5', 6, 'progression', 11, 18, null, 60, 60, 'special', false, 'non_applicable', null, 'Voir le livre p. 157', 'Poussée'),
    ('niveau-10', 2, 1, 'K', 6, 'progression', 6, 13, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 189', 'Tirage'),
    ('niveau-10', 2, 2, 'K1', 5, 'progression', 6, 12, null, 60, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 190', 'Tirage'),
    ('niveau-10', 3, 1, 'E2', 6, 'progression', 13, 21, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Jambes'),
    ('niveau-10', 3, 2, 'F1', 4, 'progression', 18, 28, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Jambes'),
    ('niveau-10', 3, 3, 'G1', 6, 'progression', 36, 56, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Abdos'),
    ('niveau-10', 3, 4, 'H', 6, 'progression', 18, 28, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Gainage'),

    ('niveau-11', 1, 1, 'B2', 6, 'progression', 19, 29, null, 45, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 151', 'Poussée'),
    ('niveau-11', 1, 2, 'A7', 6, 'progression', 12, 19, null, 60, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 143', 'Poussée'),
    ('niveau-11', 1, 3, 'C5', 6, 'progression', 12, 19, null, 60, 60, 'special', false, 'non_applicable', null, 'Voir le livre p. 157', 'Poussée'),
    ('niveau-11', 2, 1, 'K', 6, 'progression', 7, 14, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 189', 'Tirage'),
    ('niveau-11', 2, 2, 'K1', 5, 'progression', 7, 13, null, 60, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 190', 'Tirage'),
    ('niveau-11', 3, 1, 'E2', 6, 'progression', 14, 22, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Jambes'),
    ('niveau-11', 3, 2, 'F1', 4, 'progression', 19, 29, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Jambes'),
    ('niveau-11', 3, 3, 'G1', 6, 'progression', 38, 58, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Abdos'),
    ('niveau-11', 3, 4, 'H', 6, 'progression', 19, 29, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Gainage'),

    ('niveau-12', 1, 1, 'B2', 6, 'progression', 20, 30, null, 45, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 151', 'Poussée'),
    ('niveau-12', 1, 2, 'A7', 6, 'progression', 13, 20, null, 60, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 143', 'Poussée'),
    ('niveau-12', 1, 3, 'C5', 6, 'progression', 13, 20, null, 60, 60, 'special', false, 'non_applicable', null, 'Voir le livre p. 157', 'Poussée'),
    ('niveau-12', 2, 1, 'K', 6, 'progression', 8, 15, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 189', 'Tirage'),
    ('niveau-12', 2, 2, 'K1', 5, 'progression', 8, 14, null, 60, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 190', 'Tirage'),
    ('niveau-12', 3, 1, 'E2', 6, 'progression', 15, 23, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Jambes'),
    ('niveau-12', 3, 2, 'F1', 4, 'progression', 20, 30, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Jambes'),
    ('niveau-12', 3, 3, 'G1', 6, 'progression', 40, 60, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Abdos'),
    ('niveau-12', 3, 4, 'H', 6, 'progression', 20, 30, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Gainage'),

    ('niveau-12-bis', 1, 1, 'B2', 6, 'progression', 18, 28, null, 45, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 151', 'Entretien poussée'),
    ('niveau-12-bis', 2, 1, 'K', 5, 'progression', 7, 13, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 189', 'Entretien tirage'),
    ('niveau-12-bis', 3, 1, 'E2', 5, 'progression', 14, 20, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Entretien jambes'),

    ('niveau-12-ter', 1, 1, 'B2', 6, 'progression', 19, 29, null, 45, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 151', 'Entretien poussée'),
    ('niveau-12-ter', 2, 1, 'K1', 5, 'progression', 7, 13, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 190', 'Entretien tirage'),
    ('niveau-12-ter', 3, 1, 'E2', 5, 'progression', 14, 20, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Entretien jambes'),

    ('niveau-13', 1, 1, 'B2', 6, 'progression', 21, 31, null, 45, 60, 'rapide', false, 'non_applicable', null, 'Voir le livre p. 151', 'Poussée élite'),
    ('niveau-13', 1, 2, 'A7', 6, 'progression', 14, 21, null, 60, 60, 'special', false, 'non_applicable', null, 'Voir le livre p. 143', 'Poussée élite'),
    ('niveau-13', 1, 3, 'C5', 6, 'progression', 14, 21, null, 60, 60, 'special', false, 'non_applicable', null, 'Voir le livre p. 157', 'Poussée élite'),
    ('niveau-13', 2, 1, 'K', 6, 'progression', 9, 16, null, 90, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 189', 'Tirage élite'),
    ('niveau-13', 2, 2, 'K1', 5, 'progression', 9, 15, null, 60, 120, 'normal', false, 'non_applicable', 'Barre fixe nécessaire', 'Voir le livre p. 190', 'Tirage élite'),
    ('niveau-13', 3, 1, 'E2', 6, 'progression', 16, 24, null, 25, 60, 'normal', true, 'droite_puis_gauche', null, 'Voir le livre p. 165', 'Jambes élite'),
    ('niveau-13', 3, 2, 'F1', 4, 'progression', 21, 31, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 167', 'Jambes élite'),
    ('niveau-13', 3, 3, 'G1', 6, 'progression', 42, 62, null, 25, 60, 'normal', false, 'non_applicable', null, 'Voir le livre p. 169', 'Abdos élite'),
    ('niveau-13', 3, 4, 'H', 6, 'progression', 21, 31, null, 25, 60, 'lent', false, 'non_applicable', null, 'Voir le livre p. 173', 'Gainage élite'),

    ('entretien-avance', 1, 1, 'A5', 5, 'fixe', 8, 15, null, 45, 60, 'normal', false, 'non_applicable', null, 'Voir le livre', 'Maintien')
)
insert into public.training_level_session_exercises (
  session_id, sort_order, exercise_code, series, reps_mode, reps_cible_min, reps_cible_max, reps_note,
  rest_seconds, rest_after_exercise_seconds, tempo_mode, unilateral, side_mode,
  progression_rule, cap_rule, caution_note, book_reference_note
)
select
  s.id, ex.sort_order, ex.exercise_code, ex.series, ex.reps_mode, ex.reps_min, ex.reps_max, ex.reps_note,
  ex.rest_seconds, ex.rest_after, ex.tempo_mode, ex.unilateral, ex.side_mode,
  ex.progression_rule, null, ex.caution_note, ex.book_ref
from ex
join public.training_levels l on l.slug = ex.level_slug
join public.training_level_sessions s on s.level_id = l.id and s.sort_order = ex.session_order;

commit;
