export type TrainingLevelType = 'progression' | 'entretien' | 'avance'
export type RepsMode = 'fixe' | 'max' | 'progression' | 'temps'
export type TempoMode = 'normal' | 'rapide' | 'lent' | 'special'

export type ExerciseLibraryItem = {
  code: string
  nom_court: string
  groupe_principal: string
  materiel_resume: string | null
  cues_courtes: string[]
  warning_court: string | null
  detail_source: string
}

export type TrainingLevel = {
  id: string
  slug: string
  titre: string
  sort_order: number
  type: TrainingLevelType
  description_courte: string | null
  frequence_recommandee: string | null
  duree_phase: string | null
  objectifs: string[]
  conditions_entree: string | null
  conditions_passage: string | null
  remarques: string | null
  disclaimer_livre: string
  difficulty_badge: string | null
}

export type TrainingLevelSessionExercise = {
  id: string
  sort_order: number
  exercise_code: string
  series: number | null
  reps_mode: RepsMode
  reps_cible_min: number | null
  reps_cible_max: number | null
  reps_note: string | null
  rest_seconds: number | null
  rest_after_exercise_seconds: number | null
  tempo_mode: TempoMode
  unilateral: boolean
  side_mode: string
  progression_rule: string | null
  cap_rule: string | null
  caution_note: string | null
  book_reference_note: string
  exercise_library: ExerciseLibraryItem | null
}

export type TrainingLevelSession = {
  id: string
  level_id: string
  nom: string
  sort_order: number
  nb_seances_par_semaine: number | null
  notes_courtes: string | null
  training_level_session_exercises: TrainingLevelSessionExercise[]
}

export type TrainingLevelDetail = TrainingLevel & {
  training_level_sessions: TrainingLevelSession[]
}

export type UserLevelProgress = {
  id: string
  user_id: string
  level_id: string
  start_date: string
  last_activity_date: string | null
  key_exercise_bests: Record<string, number>
  current_status: 'active' | 'completed' | 'paused'
  last_session_id: string | null
  next_recommended_session_id: string | null
}
