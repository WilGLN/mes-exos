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

/** Ligne de la vue `v_workout_journal` (séances terminées). */
export type WorkoutJournalListRow = {
  id: string
  day_utc: string
  title: string | null
  status: string
  rpe: number | null
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  exercise_count: number | null
  set_count: number | null
  total_reps: number | null
}

export type InProgressWorkoutRow = {
  id: string
  title: string | null
  status: string
  started_at: string
}

/** Séances non terminées (reprise possible). */
export async function fetchInProgressWorkouts(
  limit = 8,
): Promise<{ data: InProgressWorkoutRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, title, status, started_at')
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: new Error(error.message) }
  return { data: (data ?? []) as InProgressWorkoutRow[], error: null }
}

export type WeeklyTargetRow = {
  id: string
  week_start: string
  target_sessions: number
  notes: string | null
}

export async function fetchWeeklyTarget(
  weekStart: string,
): Promise<{ data: WeeklyTargetRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('weekly_targets')
    .select('id, week_start, target_sessions, notes')
    .eq('week_start', weekStart)
    .maybeSingle()

  if (error) return { data: null, error: new Error(error.message) }
  return { data: (data as WeeklyTargetRow) ?? null, error: null }
}

export async function upsertWeeklyTarget(
  weekStart: string,
  targetSessions: number,
  notes?: string | null,
): Promise<{ error: Error | null }> {
  const { data: u } = await supabase.auth.getUser()
  const uid = u.user?.id
  if (!uid) return { error: new Error('Non connecté') }

  const n = Math.max(1, Math.min(14, Math.floor(targetSessions)))
  const { error } = await supabase.from('weekly_targets').upsert(
    {
      user_id: uid,
      week_start: weekStart,
      target_sessions: n,
      notes: notes ?? null,
    },
    { onConflict: 'user_id,week_start' },
  )

  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export async function fetchPersonalRecordsCount(): Promise<{ count: number; error: Error | null }> {
  const { count, error } = await supabase.from('personal_records').select('id', { count: 'exact', head: true })

  if (error) return { count: 0, error: new Error(error.message) }
  return { count: count ?? 0, error: null }
}

export async function fetchWorkoutJournalList(
  limit = 100,
): Promise<{ data: WorkoutJournalListRow[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('v_workout_journal')
    .select('id, day_utc, title, status, rpe, started_at, ended_at, duration_seconds, exercise_count, set_count, total_reps')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: new Error(error.message) }
  return { data: (data ?? []) as WorkoutJournalListRow[], error: null }
}

/** Entrée `session_journal` + titre séance. */
export type SessionJournalListRow = {
  id: string
  workout_id: string
  rpe: number | null
  energy: number | null
  sleep_quality: number | null
  pain_notes: string | null
  free_notes: string | null
  created_at: string
  workout_title: string | null
  workout_started_at: string | null
}

export async function fetchSessionJournalWithTitles(
  limit = 60,
): Promise<{ data: SessionJournalListRow[]; error: Error | null }> {
  const { data: rows, error } = await supabase
    .from('session_journal')
    .select('id, workout_id, rpe, energy, sleep_quality, pain_notes, free_notes, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: new Error(error.message) }
  const list = rows ?? []
  if (!list.length) return { data: [], error: null }

  const ids = [...new Set(list.map((r) => r.workout_id as string))]
  const { data: ws, error: wErr } = await supabase.from('workouts').select('id, title, started_at').in('id', ids)
  if (wErr) return { data: [], error: new Error(wErr.message) }
  const map = new Map((ws ?? []).map((w) => [w.id as string, w as { title: string | null; started_at: string }]))

  return {
    data: list.map((r) => {
      const w = map.get(r.workout_id as string)
      return {
        id: r.id as string,
        workout_id: r.workout_id as string,
        rpe: r.rpe as number | null,
        energy: r.energy as number | null,
        sleep_quality: r.sleep_quality as number | null,
        pain_notes: r.pain_notes as string | null,
        free_notes: r.free_notes as string | null,
        created_at: r.created_at as string,
        workout_title: w?.title ?? null,
        workout_started_at: w?.started_at ?? null,
      }
    }),
    error: null,
  }
}

export async function deleteSessionJournalEntry(journalId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('session_journal').delete().eq('id', journalId)
  if (error) return { error: new Error(error.message) }
  return { error: null }
}

/** Supprime une séance terminée (workout) : cascade exercices / séries / journal post-séance. */
export async function deleteWorkoutById(workoutId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('workouts').delete().eq('id', workoutId)
  if (error) return { error: new Error(error.message) }
  return { error: null }
}
