export type TempoMode = 'normal' | 'rapide' | 'lent' | 'special'
export type SideMode = 'droite_puis_gauche' | 'alterne' | 'non_applicable'
export type RepsMode = 'fixe' | 'max' | 'progression' | 'temps'

export type WorkoutSessionExercise = {
  workout_exercise_id: string
  exercise_code: string
  nom_court: string
  groupe_principal: string
  ordre: number
  series: number
  reps_mode: RepsMode
  reps_cible_min: number | null
  reps_cible_max: number | null
  reps_note: string | null
  rest_seconds: number
  rest_after_exercise_seconds: number
  tempo_mode: TempoMode
  unilateral: boolean
  side_mode: SideMode
  caution_note: string | null
  book_reference_note: string | null
}

export type SetEntry = {
  set_number: number
  reps: number
  completed: boolean
  side?: 'droite' | 'gauche'
}

export type WorkoutSessionState =
  | 'loading'
  | 'ready'
  | 'exercise_intro'
  | 'set_in_progress'
  | 'reps_input'
  | 'resting'
  | 'exercise_transition'
  | 'complete'

export type SessionJournalInput = {
  workout_id: string
  rpe?: number
  energy?: number
  sleep_quality?: number
  pain_notes?: string
  free_notes?: string
}
