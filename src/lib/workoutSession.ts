import { supabase } from './supabase'
import type { SessionJournalInput, SetEntry, WorkoutSessionExercise } from '../types/training'

type RpcStartResult = { ok?: boolean; workout_id?: string; title?: string; error?: string } | null

export async function startWorkoutFromTrainingSession(training_level_session_id: string): Promise<{ workoutId: string }> {
  const { data, error } = await supabase.rpc('start_workout_from_training_session', {
    p_training_session_id: training_level_session_id,
  })
  if (error) throw new Error(error.message)
  const row = data as RpcStartResult
  if (!row?.ok || !row.workout_id) throw new Error(row?.error ?? 'start_workout_failed')
  return { workoutId: row.workout_id }
}

function parseConfig(raw: Record<string, unknown>, row: { id: string; name: string; muscle_group: string | null; sort_order: number }): WorkoutSessionExercise {
  const exerciseCode = typeof raw.exercise_code === 'string' ? raw.exercise_code : row.name.split('—')[0]?.trim() ?? 'EX'
  return {
    workout_exercise_id: row.id,
    exercise_code: exerciseCode,
    nom_court: row.name.split('—')[1]?.trim() ?? row.name,
    groupe_principal: row.muscle_group ?? '—',
    ordre: row.sort_order,
    series: Math.max(1, Number(raw.series ?? 1)),
    reps_mode: (raw.reps_mode as WorkoutSessionExercise['reps_mode']) ?? 'max',
    reps_cible_min: raw.reps_cible_min == null ? null : Number(raw.reps_cible_min),
    reps_cible_max: raw.reps_cible_max == null ? null : Number(raw.reps_cible_max),
    reps_note: typeof raw.reps_note === 'string' ? raw.reps_note : null,
    rest_seconds: Math.max(0, Number(raw.rest_seconds ?? 25)),
    rest_after_exercise_seconds: Math.max(0, Number(raw.rest_after_exercise_seconds ?? 120)),
    tempo_mode: (raw.tempo_mode as WorkoutSessionExercise['tempo_mode']) ?? 'normal',
    unilateral: raw.unilateral === true,
    side_mode: (raw.side_mode as WorkoutSessionExercise['side_mode']) ?? 'non_applicable',
    caution_note: typeof raw.caution_note === 'string' ? raw.caution_note : null,
    book_reference_note: typeof raw.book_reference_note === 'string' ? raw.book_reference_note : 'Voir le livre',
  }
}

export async function getWorkoutExercisesWithDetails(workoutId: string): Promise<WorkoutSessionExercise[]> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('id, name, muscle_group, sort_order, config')
    .eq('workout_id', workoutId)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => parseConfig((r.config as Record<string, unknown>) ?? {}, r))
}

export async function getWorkoutSetEntries(workoutExerciseId: string): Promise<SetEntry[]> {
  const { data, error } = await supabase
    .from('workout_sets')
    .select('set_index, reps, completed, notes')
    .eq('workout_exercise_id', workoutExerciseId)
    .order('set_index', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? [])
    .filter((r) => {
      // Les lignes seedées au démarrage (0 reps, completed=false, sans note) ne doivent pas apparaître comme "passées".
      return !(r.completed === false && r.reps === 0 && (r.notes == null || r.notes === ''))
    })
    .map((r) => {
      const n = typeof r.notes === 'string' && (r.notes === 'droite' || r.notes === 'gauche') ? (r.notes as 'droite' | 'gauche') : undefined
      return { set_number: r.set_index, reps: r.reps, completed: r.completed !== false, side: n }
    })
}

export async function insertWorkoutSet(data: {
  workout_exercise_id: string
  set_number: number
  reps: number
  rest_seconds: number
  completed: boolean
  side?: 'droite' | 'gauche'
  exercise_code?: string
}): Promise<void> {
  const { error } = await supabase.from('workout_sets').upsert(
    {
      workout_exercise_id: data.workout_exercise_id,
      set_index: data.set_number,
      reps: data.reps,
      rest_seconds: data.rest_seconds,
      completed: data.completed,
      // Marque explicite si série passée, pour ne pas confondre avec les placeholders initiaux.
      notes: data.completed ? data.side ?? null : data.side ?? 'skipped',
    },
    { onConflict: 'workout_exercise_id,set_index' },
  )
  if (error) throw new Error(error.message)

  if (data.reps > 0 && data.exercise_code) {
    const { data: ex } = await supabase.from('exercises').select('id').eq('slug', data.exercise_code.toLowerCase()).maybeSingle()
    if (ex?.id) {
      await supabase.rpc('record_personal_best', {
        p_exercise_id: ex.id,
        p_reps: data.reps,
        p_workout_id: null,
      })
    }
  }
}

export async function completeWorkout(workoutId: string, rpe?: number): Promise<void> {
  const { data, error } = await supabase.rpc('complete_workout', {
    p_workout_id: workoutId,
    p_rpe: rpe ?? null,
    p_notes: null,
  })
  if (error) throw new Error(error.message)
  const row = data as { ok?: boolean; error?: string } | null
  if (!row?.ok) throw new Error(row?.error ?? 'complete_workout_failed')
}

export async function abandonWorkout(workoutId: string): Promise<void> {
  const { data, error } = await supabase.rpc('abandon_workout', { p_workout_id: workoutId })
  if (error) throw new Error(error.message)
  const row = data as { ok?: boolean; error?: string } | null
  if (!row?.ok) throw new Error(row?.error ?? 'abandon_workout_failed')
}

export async function insertSessionJournal(data: SessionJournalInput): Promise<void> {
  const { data: authData } = await supabase.auth.getUser()
  const uid = authData.user?.id
  if (!uid) throw new Error('Non connecté')
  const { error } = await supabase.from('session_journal').insert({
    user_id: uid,
    workout_id: data.workout_id,
    rpe: data.rpe ?? null,
    energy: data.energy ?? null,
    sleep_quality: data.sleep_quality ?? null,
    pain_notes: data.pain_notes ?? null,
    free_notes: data.free_notes ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function getLastPerformance(exercise_code: string): Promise<SetEntry[]> {
  const { data: authData } = await supabase.auth.getUser()
  const uid = authData.user?.id
  if (!uid) return []

  const { data: exRows, error: exErr } = await supabase
    .from('workout_exercises')
    .select('id, workout_id, sort_order, config')
    .contains('config', { exercise_code })
    .limit(20)
  if (exErr || !exRows?.length) return []

  for (const ex of exRows) {
    const { data: w } = await supabase.from('workouts').select('id,user_id,status,ended_at').eq('id', ex.workout_id).maybeSingle()
    if (!w || w.user_id !== uid || w.status !== 'completed') continue
    const sets = await getWorkoutSetEntries(ex.id)
    if (sets.length) return sets
  }
  return []
}

export async function updateProgressOnComplete(workoutId: string): Promise<void> {
  const { data: authData } = await supabase.auth.getUser()
  const uid = authData.user?.id
  if (!uid) return
  const { data: profile } = await supabase.from('profiles').select('active_training_level_id').eq('id', uid).maybeSingle()
  const levelId = profile?.active_training_level_id as string | null
  if (!levelId) return

  const { data: exs } = await supabase
    .from('workout_exercises')
    .select('id, sort_order')
    .eq('workout_id', workoutId)
    .order('sort_order', { ascending: true })
  if (!exs?.length) return

  const mainEx = exs[0]
  const { data: sets } = await supabase
    .from('workout_sets')
    .select('reps')
    .eq('workout_exercise_id', mainEx.id)
    .eq('completed', true)
  const total = (sets ?? []).reduce((a, s) => a + (s.reps ?? 0), 0)

  const { data: cur } = await supabase
    .from('user_level_progress')
    .select('sessions_completed')
    .eq('user_id', uid)
    .eq('level_id', levelId)
    .maybeSingle()

  await supabase
    .from('user_level_progress')
    .update({
      last_session_date: new Date().toISOString(),
      last_activity_date: new Date().toISOString().slice(0, 10),
      sessions_completed: (cur?.sessions_completed ?? 0) + 1,
      last_key_exercise_total: total,
    })
    .eq('user_id', uid)
    .eq('level_id', levelId)
}
