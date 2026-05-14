import { supabase } from './supabase'

export { DEFAULT_REPOS_SECONDS } from './lafayTimer'

export type ProgramRow = {
  id: string
  slug: string
  name: string
  description: string | null
  level: number
  sessions_per_week: number | null
  sort_order: number
}

export type ProfileRow = {
  id: string
  display_name: string | null
  active_program_id: string | null
  active_training_level_id?: string | null
}

/** Préférences profil (JSONB) — minuterie, objectif, etc. */
export type TimerPreferences = {
  repos_defaut_secondes?: number
  son_fin?: boolean
  vibration?: boolean
  demarrage_auto?: boolean
  appliquer_repos_programme_auto?: boolean
  autoriser_override_manuel_repos?: boolean
  afficher_criteres_passage_en_seance?: boolean
  objectif?: 'perte_gras' | 'prise_muscle' | 'entretien' | null
  niveau_actuel_libelle?: string
}

export type ProfileWithPreferences = ProfileRow & {
  preferences: TimerPreferences & Record<string, unknown>
}

export async function fetchProfileWithPreferences(
  userId: string,
): Promise<{ data: ProfileWithPreferences | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, active_program_id, active_training_level_id, preferences')
    .eq('id', userId)
    .maybeSingle()

  if (error) return { data: null, error: new Error(error.message) }
  return { data: data as ProfileWithPreferences | null, error: null }
}

export async function mergeProfilePreferences(
  patch: Partial<TimerPreferences>,
): Promise<{ error: Error | null }> {
  const { data: u } = await supabase.auth.getUser()
  const id = u.user?.id
  if (!id) return { error: new Error('Non connecté') }

  const { data: row, error: selErr } = await supabase.from('profiles').select('preferences').eq('id', id).maybeSingle()
  if (selErr) return { error: new Error(selErr.message) }

  const prev = (row?.preferences as Record<string, unknown> | null) ?? {}
  const next = { ...prev, ...patch }

  const { error } = await supabase.from('profiles').update({ preferences: next }).eq('id', id)
  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export async function updateProfileDisplayName(displayName: string | null): Promise<{ error: Error | null }> {
  const { data: u } = await supabase.auth.getUser()
  const id = u.user?.id
  if (!id) return { error: new Error('Non connecté') }

  const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', id)
  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export async function fetchPrograms(): Promise<{ data: ProgramRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('programs')
    .select('id, slug, name, description, level, sessions_per_week, sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: new Error(error.message) }
  return { data: (data ?? []) as ProgramRow[], error: null }
}

export async function fetchProfile(userId: string): Promise<{ data: ProfileRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, active_program_id, active_training_level_id')
    .eq('id', userId)
    .maybeSingle()

  if (error) return { data: null, error: new Error(error.message) }
  return { data: data as ProfileRow | null, error: null }
}

export async function setActiveProgram(programId: string | null): Promise<{ error: Error | null }> {
  const { data: u } = await supabase.auth.getUser()
  const id = u.user?.id
  if (!id) return { error: new Error('Non connecté') }

  const { error } = await supabase.from('profiles').update({ active_program_id: programId }).eq('id', id)

  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export async function startWorkoutFromProgramSession(
  programSessionId: string,
): Promise<{ workoutId: string | null; title: string | null; error: Error | null }> {
  const { data, error } = await supabase.rpc('start_workout_from_program_session', {
    p_program_session_id: programSessionId,
  })

  if (error) return { workoutId: null, title: null, error: new Error(error.message) }
  const row = data as { ok?: boolean; workout_id?: string; title?: string; error?: string } | null
  if (!row?.ok) {
    return {
      workoutId: null,
      title: null,
      error: new Error(row?.error ?? 'start_workout_failed'),
    }
  }
  return { workoutId: row.workout_id ?? null, title: row.title ?? null, error: null }
}

export type ProgramSessionRow = {
  id: string
  code: string
  title: string
  sort_order: number
}

export async function fetchProgramSessions(programId: string): Promise<{ data: ProgramSessionRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('program_sessions')
    .select('id, code, title, sort_order')
    .eq('program_id', programId)
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: new Error(error.message) }
  return { data: (data ?? []) as ProgramSessionRow[], error: null }
}

export type WorkoutBrief = {
  id: string
  title: string
  status: string
}

export async function fetchWorkoutById(workoutId: string): Promise<{ data: WorkoutBrief | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, title, status')
    .eq('id', workoutId)
    .maybeSingle()

  if (error) return { data: null, error: new Error(error.message) }
  return { data: data as WorkoutBrief | null, error: null }
}

export type WorkoutSetRecap = {
  set_index: number
  reps: number
  completed: boolean | null
}

export type WorkoutExerciseRecap = {
  id: string
  name: string
  sort_order: number
  workout_sets: WorkoutSetRecap[] | null
}

export async function fetchWorkoutRecap(
  workoutId: string,
): Promise<{ data: WorkoutExerciseRecap[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('id, name, sort_order, workout_sets(set_index, reps, completed)')
    .eq('workout_id', workoutId)
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: new Error(error.message) }
  const rows = (data ?? []) as WorkoutExerciseRecap[]
  for (const row of rows) {
    if (row.workout_sets?.length) {
      row.workout_sets.sort((a, b) => a.set_index - b.set_index)
    }
  }
  return { data: rows, error: null }
}

export type WorkoutExerciseSessionRow = {
  id: string
  name: string
  muscle_group: string | null
  sort_order: number
  config: Record<string, unknown>
  workout_sets: { set_index: number; rest_seconds: number | null }[] | null
}

export async function fetchWorkoutExercisesForSession(
  workoutId: string,
): Promise<{ data: WorkoutExerciseSessionRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('id, name, muscle_group, sort_order, config, workout_sets(set_index, rest_seconds)')
    .eq('workout_id', workoutId)
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: new Error(error.message) }
  const rows = (data ?? []) as WorkoutExerciseSessionRow[]
  for (const row of rows) {
    if (row.workout_sets?.length) {
      row.workout_sets.sort((a, b) => a.set_index - b.set_index)
    }
  }
  return { data: rows, error: null }
}

/** Repos après la série `completedSetIndex` (1-based) pour l’exercice courant. */
export function resolveRestAfterSet(
  ex: WorkoutExerciseSessionRow | undefined,
  completedSetIndex: number,
  defaultSeconds: number,
): number {
  if (!ex) return defaultSeconds
  const fromSet = ex.workout_sets?.find((s) => s.set_index === completedSetIndex)?.rest_seconds
  if (typeof fromSet === 'number' && fromSet >= 0) return fromSet
  const cfg = ex.config?.rest_seconds
  if (typeof cfg === 'number' && cfg >= 0) return cfg
  if (typeof cfg === 'string' && cfg.trim() !== '') {
    const n = Number(cfg)
    if (!Number.isNaN(n) && n >= 0) return n
  }
  return defaultSeconds
}

export async function completeWorkout(
  workoutId: string,
  rpe: number | null,
  notes: string | null,
): Promise<{ error: Error | null }> {
  const { data, error } = await supabase.rpc('complete_workout', {
    p_workout_id: workoutId,
    p_rpe: rpe,
    p_notes: notes && notes.trim() ? notes.trim() : null,
  })

  if (error) return { error: new Error(error.message) }
  const row = data as { ok?: boolean; error?: string } | null
  if (!row?.ok) return { error: new Error(row?.error ?? 'complete_workout_failed') }
  return { error: null }
}
