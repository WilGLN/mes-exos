-- =============================================================================
-- Lafay Tracker — migration 0007
-- Seed catalogue Lafay (résumé original, court, non substitutif)
-- =============================================================================

insert into public.exercise_library (code, nom_court, groupe_principal, materiel_resume, cues_courtes, warning_court)
values
  ('A', 'Pompes classiques', 'Pectoraux / triceps', 'Sol', array['Amplitude propre', 'Gainage neutre'], null),
  ('A1', 'Pompes serrées', 'Triceps / pectoraux', 'Sol', array['Coudes contrôlés', 'Rythme stable'], 'Réduire l''amplitude si douleur poignet'),
  ('A2', 'Pompes pieds surélevés', 'Pectoraux supérieurs', 'Support stable', array['Bassin aligné', 'Descente contrôlée'], null),
  ('A12', 'Pompes avancées', 'Pectoraux / épaules', 'Support selon variante', array['Reste propre', 'Stop avant rupture'], 'Exercice avancé'),
  ('B', 'Dips', 'Triceps / pectoraux', 'Barres parallèles', array['Épaules basses', 'Amplitude maîtrisée'], 'Éviter de forcer en bas'),
  ('C', 'Tractions larges', 'Dos / biceps', 'Barre de traction', array['Poitrine haute', 'Pas d''élan'], null),
  ('C3', 'Tractions variantes', 'Dos', 'Barre de traction', array['Contrôle du rythme', 'Trajectoire propre'], null),
  ('D', 'Squats poids du corps', 'Jambes', 'Sol', array['Genoux suivis', 'Pieds stables'], null),
  ('E', 'Fentes', 'Jambes / fessiers', 'Sol', array['Buste gainé', 'Amplitude progressive'], null),
  ('F', 'Mollets', 'Mollets', 'Marche/step', array['Pause en haut', 'Descente lente'], null),
  ('G', 'Abdos enroulés', 'Sangle abdominale', 'Sol/tapis', array['Souffle régulier', 'Nuque neutre'], null),
  ('H', 'Gainage', 'Tronc', 'Sol/tapis', array['Corps aligné', 'Respiration active'], null),
  ('I', 'Dos/posture', 'Dos', 'Barre/support', array['Rythme propre', 'Scapulas actives'], null),
  ('I1', 'Dos variante 1', 'Dos', 'Barre/support', array['Amplitude complète', 'Sans à-coup'], null),
  ('I4', 'Dos variante 4', 'Dos', 'Barre/support', array['Cadence lente', 'Contrôle total'], 'Variante exigeante'),
  ('I5', 'Dos variante 5', 'Dos', 'Barre/support', array['Cadence lente', 'Contrôle total'], 'Variante exigeante'),
  ('J', 'Poussée avancée', 'Pectoraux / triceps', 'Barres/support', array['Technique stricte', 'Repos régulier'], 'Niveau avancé'),
  ('K', 'Tirage avancé', 'Dos / biceps', 'Barre', array['Amplitude complète', 'Rythme propre'], 'Niveau avancé'),
  ('K2', 'Tirage K2', 'Dos / biceps', 'Barre', array['Cadence régulière', 'Stop avant triche'], null),
  ('L', 'Jambes avancé', 'Jambes', 'Sol/support', array['Stabilité', 'Respiration'], null)
on conflict (code) do update
set
  nom_court = excluded.nom_court,
  groupe_principal = excluded.groupe_principal,
  materiel_resume = excluded.materiel_resume,
  cues_courtes = excluded.cues_courtes,
  warning_court = excluded.warning_court;

with levels(slug, titre, sort_order, type, description_courte, frequence_recommandee, duree_phase, objectifs, conditions_entree, conditions_passage, remarques, difficulty_badge) as (
  values
    ('niveau-1', 'Niveau 1', 1, 'progression', 'Entrée progressive, volume technique.', '3 à 4 séances / semaine', '4 à 8 semaines', array['Installer la régularité', 'Valider les bases'], 'Nouveau pratiquant ou reprise', 'Objectifs de reps stables sur les exercices pivot', 'Rythme normal, repos strict.', 'débutant'),
    ('niveau-2', 'Niveau 2', 2, 'progression', 'Consolidation des bases avec progression simple.', '3 à 4 séances / semaine', '4 à 8 semaines', array['Augmenter la tolérance au volume'], 'Sortie Niveau 1 validée', 'Progression sur B et C sur plusieurs séances', 'Rester propre avant d''accélérer.', 'débutant+'),
    ('niveau-3', 'Niveau 3', 3, 'progression', 'Montée contrôlée du volume.', '3 à 4 séances / semaine', '4 à 10 semaines', array['Stabilité technique sous fatigue'], 'Entrée après validation niveau 2', 'Bloc validé sur exercices clés', 'Repos entre exercices à surveiller.', 'intermédiaire'),
    ('niveau-4', 'Niveau 4', 4, 'progression', 'Travail plus dense, récupération prioritaire.', '3 séances / semaine', '6 à 10 semaines', array['Augmenter capacité de travail'], 'Progression régulière niveau 3', 'Atteinte de la cible sur 2 semaines', 'Intégrer repos longs entre groupes.', 'intermédiaire'),
    ('niveau-5', 'Niveau 5', 5, 'progression', 'Densité et maîtrise de l''effort.', '3 séances / semaine', '6 à 10 semaines', array['Mieux tolérer la charge globale'], 'Niveau 4 stable', 'Séries propres + récupération correcte', 'Ne pas sacrifier la forme.', 'intermédiaire+'),
    ('niveau-6', 'Niveau 6', 6, 'progression', 'Progression soutenue avec contrôle du rythme.', '3 séances / semaine', '6 à 12 semaines', array['Progresser sans casser la régularité'], 'Niveau 5 validé', 'Objectifs atteints sur exercices pivots', 'Repos long quand prescrit.', 'intermédiaire+'),
    ('niveau-7', 'Niveau 7', 7, 'progression', 'Entrée avancée, gestion du repos stratégique.', '3 séances / semaine', '8 à 12 semaines', array['Conserver qualité sous forte contrainte'], 'Base solide sur niveaux 5-6', 'Progression stable sur blocs J/K/L', 'Repos 90 s fréquent.', 'avancé'),
    ('niveau-8', 'Niveau 8', 8, 'progression', 'Bloc avancé avec techniques de continuation.', '3 séances / semaine', '8 à 12 semaines', array['Poursuivre progression avancée'], 'Niveau 7 validé', 'Objectif des séries clés atteint', 'Micro-pauses internes possibles (3-5 s).', 'avancé'),
    ('niveau-9', 'Niveau 9', 9, 'progression', 'Densité élevée et précision d''exécution.', '3 séances / semaine', '8 à 12 semaines', array['Optimiser volume utile'], 'Niveau 8 validé', 'Capacité de répétition confirmée', 'Éviter les variations non prévues.', 'avancé'),
    ('niveau-10', 'Niveau 10', 10, 'progression', 'Bloc exigeant, prioriser récupération.', '2 à 3 séances / semaine', '8 à 12 semaines', array['Stabiliser haut niveau'], 'Historique régulier', 'Maintien de la performance sur plusieurs semaines', 'Réduire fatigue périphérique.', 'expert'),
    ('niveau-11', 'Niveau 11', 11, 'progression', 'Travail expert avec contrôle strict.', '2 à 3 séances / semaine', '8 à 12 semaines', array['Affiner rendement'], 'Niveau 10 solide', 'Progression nette sur exercices clés', 'Volume qualitatif > volume brut.', 'expert'),
    ('niveau-12', 'Niveau 12', 12, 'progression', 'Très avancé, gestion fine de la charge.', '2 à 3 séances / semaine', '8 à 12 semaines', array['Préserver performance maximale'], 'Niveau 11 validé', 'Objectifs atteints sans dégradation technique', 'Surveiller surcharge.', 'expert'),
    ('niveau-13', 'Niveau 13', 13, 'progression', 'Sommet de progression standard.', '2 à 3 séances / semaine', '8 à 12 semaines', array['Consolider le plus haut niveau'], 'Niveau 12 validé', 'Stabilité durable des performances', 'Planifier déload selon fatigue.', 'expert'),
    ('niveau-12-bis', 'Niveau 12 bis', 14, 'avance', 'Variante avancée de consolidation.', '2 à 3 séances / semaine', '6 à 10 semaines', array['Explorer variante avancée'], 'Niveau 11-12 maîtrisé', 'Progression sur indicateurs ciblés', 'Ajustements prudents.', 'expert+'),
    ('niveau-12-ter', 'Niveau 12 ter', 15, 'avance', 'Variante avancée orientée maintien/perf.', '2 à 3 séances / semaine', '6 à 10 semaines', array['Maintenir haut niveau'], 'Niveau 12 bis ou équivalent', 'Stabilité sur cycle complet', 'Gestion récupération prioritaire.', 'expert+'),
    ('entretien-avance', 'Continuer progresser / Entretien', 16, 'entretien', 'Parcours avancé résumé pour maintien et progression lente.', '2 à 4 séances / semaine', 'Cycle continu', array['Maintien long terme', 'Progression graduelle'], 'Après un bloc avancé', 'Atteinte d''objectifs personnalisés', 'Adapter selon forme hebdomadaire.', 'entretien')
)
insert into public.training_levels (
  slug, titre, sort_order, type, description_courte, frequence_recommandee, duree_phase,
  objectifs, conditions_entree, conditions_passage, remarques, difficulty_badge
)
select * from levels
on conflict (slug) do update
set
  titre = excluded.titre,
  sort_order = excluded.sort_order,
  type = excluded.type,
  description_courte = excluded.description_courte,
  frequence_recommandee = excluded.frequence_recommandee,
  duree_phase = excluded.duree_phase,
  objectifs = excluded.objectifs,
  conditions_entree = excluded.conditions_entree,
  conditions_passage = excluded.conditions_passage,
  remarques = excluded.remarques,
  difficulty_badge = excluded.difficulty_badge;

with sess(level_slug, nom, sort_order, nb_seances_par_semaine, notes_courtes) as (
  values
    ('niveau-1', 'Séance A', 1, 3, 'Bloc de départ, cadence normale, repos strict.'),
    ('niveau-1', 'Séance B', 2, 3, 'Variante légère de répartition.'),
    ('niveau-2', 'Séance A', 1, 3, 'Progression contrôlée.'),
    ('niveau-3', 'Séance A', 1, 3, 'Montée de volume progressive.'),
    ('niveau-4', 'Séance A', 1, 3, 'Repos inter-exercices plus long.'),
    ('niveau-5', 'Séance A', 1, 3, 'Qualité stricte.'),
    ('niveau-6', 'Séance A', 1, 3, 'Progression continue.'),
    ('niveau-7', 'Séance A', 1, 3, 'Bloc avancé J/K/L.'),
    ('niveau-8', 'Séance A', 1, 3, 'Continuation avancée.'),
    ('niveau-9', 'Séance A', 1, 3, 'Densité élevée.'),
    ('niveau-10', 'Séance A', 1, 2, 'Volume expert.'),
    ('niveau-11', 'Séance A', 1, 2, 'Bloc expert consolidé.'),
    ('niveau-12', 'Séance A', 1, 2, 'Charge technique élevée.'),
    ('niveau-13', 'Séance A', 1, 2, 'Stabilisation performance.'),
    ('niveau-12-bis', 'Séance Bis', 1, 2, 'Variante avancée.'),
    ('niveau-12-ter', 'Séance Ter', 1, 2, 'Variante avancée 2.'),
    ('entretien-avance', 'Séance Entretien', 1, 3, 'Parcours adaptable.')
)
insert into public.training_level_sessions (level_id, nom, sort_order, nb_seances_par_semaine, notes_courtes)
select l.id, s.nom, s.sort_order, s.nb_seances_par_semaine, s.notes_courtes
from sess s
join public.training_levels l on l.slug = s.level_slug
on conflict (level_id, sort_order) do update
set
  nom = excluded.nom,
  nb_seances_par_semaine = excluded.nb_seances_par_semaine,
  notes_courtes = excluded.notes_courtes;

with ex(level_slug, session_order, sort_order, exercise_code, series, reps_mode, reps_cible_min, reps_cible_max, reps_note, rest_seconds, rest_after_exercise_seconds, tempo_mode, unilateral, side_mode, progression_rule, cap_rule, caution_note) as (
  values
    ('niveau-1', 1, 1, 'A', 6, 'max', 8, 20, 'Amplitude propre.', 25, 120, 'normal', false, 'non_applicable', 'Ajouter 1 rep moyenne/semaine.', 'Stop si perte de forme.', 'Échauffement poignets/épaules.'),
    ('niveau-1', 1, 2, 'B', 6, 'max', 4, 12, 'Détermine la progression initiale.', 25, 120, 'normal', false, 'non_applicable', 'Progression graduelle.', 'Rester propre.', 'Éviter profondeur douloureuse.'),
    ('niveau-1', 1, 3, 'C', 6, 'max', 3, 10, 'Tractions strictes.', 25, 120, 'normal', false, 'non_applicable', 'Construire régularité.', 'Pas d''élan.', null),
    ('niveau-1', 1, 4, 'D', 4, 'fixe', 12, 20, 'Jambes contrôle.', 25, 60, 'normal', false, 'non_applicable', 'Augmenter graduellement.', 'Priorité forme.', null),
    ('niveau-1', 1, 5, 'G', 4, 'temps', 30, 45, 'Tenue active.', 25, 60, 'normal', false, 'non_applicable', 'Allonger de 5 s quand propre.', 'Stop si compensation.', null),

    ('niveau-1', 2, 1, 'A1', 6, 'max', 6, 16, 'Prise serrée contrôlée.', 25, 120, 'normal', false, 'non_applicable', 'Progression douce.', 'Stabilité poignets.', 'Adapter amplitude si gêne.'),
    ('niveau-1', 2, 2, 'C', 6, 'max', 3, 10, 'Tractions strictes.', 25, 120, 'normal', false, 'non_applicable', 'Monter progressivement.', 'Pas de triche.', null),
    ('niveau-1', 2, 3, 'E', 4, 'fixe', 10, 16, 'Fentes contrôlées.', 25, 60, 'normal', true, 'droite_puis_gauche', 'Ajouter reps symétriquement.', 'Conserver équilibre.', null),

    ('niveau-2', 1, 1, 'A', 6, 'progression', 10, 22, 'Montée régulière.', 25, 120, 'normal', false, 'non_applicable', 'Ajouter volume quand stable.', 'Ne pas forcer en échec sale.', null),
    ('niveau-2', 1, 2, 'K2', 6, 'max', 4, 12, 'Repos 60 s possible selon fatigue.', 60, 120, 'normal', false, 'non_applicable', 'Progression sur tirage.', 'Rythme propre.', null),
    ('niveau-2', 1, 3, 'D', 5, 'fixe', 14, 24, 'Jambes volume modéré.', 25, 60, 'normal', false, 'non_applicable', 'Ajouter reps progressivement.', 'Alignement genoux.', null),

    ('niveau-3', 1, 1, 'A2', 6, 'progression', 8, 18, 'Inclinaison stable.', 25, 120, 'normal', false, 'non_applicable', 'Priorité amplitude.', 'Stop si perte gainage.', null),
    ('niveau-3', 1, 2, 'B', 6, 'progression', 6, 14, 'Rythme stable.', 25, 120, 'normal', false, 'non_applicable', 'Monter graduellement.', 'Préserver épaules.', null),
    ('niveau-3', 1, 3, 'I', 4, 'temps', 30, 60, 'Posture active.', 25, 120, 'lent', false, 'non_applicable', 'Allonger progressivement.', 'Rester propre.', null),

    ('niveau-7', 1, 1, 'J', 6, 'progression', 6, 14, 'Bloc avancé.', 90, 180, 'special', false, 'non_applicable', 'Progression lente continue.', 'Priorité technique.', 'Échauffement renforcé.'),
    ('niveau-7', 1, 2, 'K', 6, 'progression', 5, 12, 'Tirage avancé.', 90, 180, 'special', false, 'non_applicable', 'Augmenter sur semaines.', 'Pas de triche.', null),
    ('niveau-7', 1, 3, 'L', 6, 'progression', 8, 18, 'Jambes avancées.', 90, 180, 'normal', false, 'non_applicable', 'Monter progressivement.', 'Conserver stabilité.', null),

    ('niveau-8', 1, 1, 'B', 6, 'max', 6, 16, 'Micro-pauses 3–5 s possibles en série.', 90, 180, 'special', false, 'non_applicable', 'Continuation contrôlée.', 'Pas d''arrêt prolongé.', 'Technique avancée.'),
    ('niveau-8', 1, 2, 'I1', 6, 'progression', 6, 14, 'Dos avancé.', 90, 180, 'special', false, 'non_applicable', 'Progression lente.', 'Contrôle total.', null),
    ('niveau-8', 1, 3, 'J', 6, 'progression', 7, 15, 'Poussée avancée.', 90, 180, 'special', false, 'non_applicable', 'Volume qualitatif.', 'Ne pas sacrifier forme.', null),

    ('niveau-9', 1, 1, 'I4', 6, 'progression', 5, 12, 'Cadence lente.', 90, 180, 'lent', false, 'non_applicable', 'Progression technique.', 'Amplitude stricte.', 'Variante exigeante.'),
    ('niveau-9', 1, 2, 'I5', 6, 'progression', 5, 12, 'Cadence lente.', 90, 180, 'lent', false, 'non_applicable', 'Progression technique.', 'Amplitude stricte.', 'Variante exigeante.'),
    ('niveau-9', 1, 3, 'K', 6, 'progression', 6, 14, 'Tirage dense.', 90, 180, 'normal', false, 'non_applicable', 'Monter graduellement.', 'Stop avant triche.', null),

    ('niveau-10', 1, 1, 'A12', 6, 'progression', 5, 10, 'Bloc expert.', 120, 180, 'special', false, 'non_applicable', 'Incréments prudents.', 'Récupération prioritaire.', 'Niveau expert.'),
    ('niveau-11', 1, 1, 'J', 6, 'progression', 6, 12, 'Consolidation expert.', 120, 180, 'special', false, 'non_applicable', 'Stabilité hebdo.', 'Technique stricte.', null),
    ('niveau-12', 1, 1, 'K', 6, 'progression', 6, 12, 'Bloc très avancé.', 120, 180, 'special', false, 'non_applicable', 'Progression lente.', 'Éviter surcharge.', null),
    ('niveau-13', 1, 1, 'L', 6, 'progression', 8, 16, 'Sommet progression.', 120, 180, 'normal', false, 'non_applicable', 'Maintenir qualité.', 'Récupérer activement.', null),
    ('niveau-12-bis', 1, 1, 'I4', 6, 'progression', 5, 11, 'Variante bis.', 120, 180, 'lent', false, 'non_applicable', 'Progression prudente.', 'Technique stricte.', null),
    ('niveau-12-ter', 1, 1, 'I5', 6, 'progression', 5, 11, 'Variante ter.', 120, 180, 'lent', false, 'non_applicable', 'Progression prudente.', 'Technique stricte.', null),
    ('entretien-avance', 1, 1, 'A', 5, 'fixe', 10, 18, 'Maintien qualité.', 60, 120, 'normal', false, 'non_applicable', 'Ajuster selon forme.', 'Éviter échec systématique.', null),
    ('entretien-avance', 1, 2, 'C', 5, 'fixe', 6, 12, 'Maintien dos.', 60, 120, 'normal', false, 'non_applicable', 'Volume stable.', 'Technique stricte.', null),
    ('entretien-avance', 1, 3, 'D', 4, 'fixe', 12, 22, 'Maintien jambes.', 60, 90, 'normal', false, 'non_applicable', 'Progression lente optionnelle.', 'Confort articulaire.', null)
)
insert into public.training_level_session_exercises (
  session_id, sort_order, exercise_code, series, reps_mode, reps_cible_min, reps_cible_max, reps_note,
  rest_seconds, rest_after_exercise_seconds, tempo_mode, unilateral, side_mode, progression_rule, cap_rule, caution_note
)
select
  s.id, ex.sort_order, ex.exercise_code, ex.series, ex.reps_mode, ex.reps_cible_min, ex.reps_cible_max, ex.reps_note,
  ex.rest_seconds, ex.rest_after_exercise_seconds, ex.tempo_mode, ex.unilateral, ex.side_mode, ex.progression_rule, ex.cap_rule, ex.caution_note
from ex
join public.training_levels l on l.slug = ex.level_slug
join public.training_level_sessions s on s.level_id = l.id and s.sort_order = ex.session_order
on conflict (session_id, sort_order) do update
set
  exercise_code = excluded.exercise_code,
  series = excluded.series,
  reps_mode = excluded.reps_mode,
  reps_cible_min = excluded.reps_cible_min,
  reps_cible_max = excluded.reps_cible_max,
  reps_note = excluded.reps_note,
  rest_seconds = excluded.rest_seconds,
  rest_after_exercise_seconds = excluded.rest_after_exercise_seconds,
  tempo_mode = excluded.tempo_mode,
  unilateral = excluded.unilateral,
  side_mode = excluded.side_mode,
  progression_rule = excluded.progression_rule,
  cap_rule = excluded.cap_rule,
  caution_note = excluded.caution_note;
