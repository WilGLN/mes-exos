import type { TimerWorkout, TimerWorkoutType } from '../types/timer'
import { supabase, isSupabaseConfigured } from './supabase'
import { clearTimerWorkoutsLocal, deleteTimerWorkout, loadTimerWorkouts, upsertTimerWorkout } from '../utils/timerWorkoutStorage'

type DbTimerSavedRow = {
  id: string
  user_id: string
  name: string
  workout_type: string
  config: TimerWorkout['config']
  created_at: string
  updated_at: string
}

function rowToWorkout(r: DbTimerSavedRow): TimerWorkout {
  return {
    id: r.id,
    name: r.name,
    type: r.workout_type as TimerWorkoutType,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    config: r.config,
  }
}

export async function fetchTimerWorkoutsRemote(): Promise<{ data: TimerWorkout[]; error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { data: loadTimerWorkouts(), error: null }
  }
  const { data: u } = await supabase.auth.getUser()
  const uid = u.user?.id
  if (!uid) return { data: [], error: new Error('Non connecté') }

  const { data, error } = await supabase
    .from('timer_saved_workouts')
    .select('id, user_id, name, workout_type, config, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error) return { data: [], error: new Error(error.message) }
  const rows = (data ?? []) as DbTimerSavedRow[]
  return { data: rows.map(rowToWorkout), error: null }
}

export async function upsertTimerWorkoutRemote(w: TimerWorkout): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    upsertTimerWorkout(w)
    return { error: null }
  }
  const { data: u } = await supabase.auth.getUser()
  const uid = u.user?.id
  if (!uid) return { error: new Error('Non connecté') }

  const payload = {
    id: w.id,
    user_id: uid,
    name: w.name.trim() || 'Sans nom',
    workout_type: w.type,
    config: w.config,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
  }

  const { error } = await supabase.from('timer_saved_workouts').upsert(payload, { onConflict: 'id' })
  if (error) return { error: new Error(error.message) }
  return { error: null }
}

export async function deleteTimerWorkoutRemote(id: string): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    deleteTimerWorkout(id)
    return { error: null }
  }
  const { data: u } = await supabase.auth.getUser()
  if (!u.user?.id) return { error: new Error('Non connecté') }

  const { error } = await supabase.from('timer_saved_workouts').delete().eq('id', id)
  if (error) return { error: new Error(error.message) }
  return { error: null }
}

/**
 * Si le cloud est vide mais le navigateur a encore d’anciennes données localStorage,
 * les pousse une fois puis vide le local (évite les doublons au prochain chargement).
 */
export async function migrateLocalTimerWorkoutsIfEmptyRemote(): Promise<{ migrated: number; error: Error | null }> {
  if (!isSupabaseConfigured) return { migrated: 0, error: null }
  const { data: u } = await supabase.auth.getUser()
  if (!u.user?.id) return { migrated: 0, error: null }

  const first = await fetchTimerWorkoutsRemote()
  if (first.error) return { migrated: 0, error: first.error }
  if (first.data.length > 0) return { migrated: 0, error: null }

  const local = loadTimerWorkouts()
  if (!local.length) return { migrated: 0, error: null }

  for (const w of local) {
    const { error } = await upsertTimerWorkoutRemote(w)
    if (error) return { migrated: 0, error }
  }
  clearTimerWorkoutsLocal()
  return { migrated: local.length, error: null }
}
