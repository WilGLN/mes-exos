import { supabase } from './supabase'
import type { TrainingLevel, TrainingLevelDetail, TrainingLevelSession, UserLevelProgress } from '../types/trainingCatalog'

export async function fetchTrainingLevels(filter?: {
  type?: 'progression' | 'entretien' | 'avance'
  debutant?: boolean
}): Promise<{ data: TrainingLevel[]; error: Error | null }> {
  let q = supabase
    .from('training_levels')
    .select(
      'id, slug, titre, sort_order, type, description_courte, frequence_recommandee, duree_phase, objectifs, conditions_entree, conditions_passage, remarques, disclaimer_livre, difficulty_badge',
    )
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
  if (filter?.type) q = q.eq('type', filter.type)
  if (filter?.debutant) q = q.lte('sort_order', 3)

  const { data, error } = await q
  if (error) return { data: [], error: new Error(error.message) }
  return { data: (data ?? []) as TrainingLevel[], error: null }
}

export async function fetchTrainingLevelBySlug(
  slug: string,
): Promise<{ data: TrainingLevelDetail | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('training_levels')
    .select(
      `
      id, slug, titre, sort_order, type, description_courte, frequence_recommandee, duree_phase, objectifs,
      conditions_entree, conditions_passage, remarques, disclaimer_livre, difficulty_badge,
      training_level_sessions (
        id, level_id, nom, sort_order, nb_seances_par_semaine, notes_courtes,
        training_level_session_exercises (
          id, sort_order, exercise_code, series, reps_mode, reps_cible_min, reps_cible_max, reps_note,
          rest_seconds, rest_after_exercise_seconds, tempo_mode, unilateral, side_mode, progression_rule,
          cap_rule, caution_note, book_reference_note,
          exercise_library (
            code, nom_court, groupe_principal, materiel_resume, cues_courtes, warning_court, detail_source
          )
        )
      )`,
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) return { data: null, error: new Error(error.message) }
  if (!data) return { data: null, error: null }

  const typed = data as TrainingLevelDetail
  typed.training_level_sessions = (typed.training_level_sessions ?? []).sort((a, b) => a.sort_order - b.sort_order)
  for (const s of typed.training_level_sessions) {
    s.training_level_session_exercises = (s.training_level_session_exercises ?? []).sort((a, b) => a.sort_order - b.sort_order)
  }
  return { data: typed, error: null }
}

export async function fetchTrainingSessionsForLevel(
  levelId: string,
): Promise<{ data: TrainingLevelSession[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('training_level_sessions')
    .select('id, level_id, nom, sort_order, nb_seances_par_semaine, notes_courtes')
    .eq('level_id', levelId)
    .order('sort_order', { ascending: true })
  if (error) return { data: [], error: new Error(error.message) }
  return { data: (data ?? []) as TrainingLevelSession[], error: null }
}

export async function setActiveTrainingLevel(levelId: string): Promise<{ error: Error | null }> {
  const { data, error } = await supabase.rpc('set_active_training_level', { p_level_id: levelId })
  if (error) return { error: new Error(error.message) }
  const row = data as { ok?: boolean; error?: string } | null
  if (!row?.ok) return { error: new Error(row?.error ?? 'set_active_training_level_failed') }
  return { error: null }
}

export async function startWorkoutFromTrainingSession(
  trainingSessionId: string,
): Promise<{ workoutId: string | null; title: string | null; error: Error | null }> {
  const { data, error } = await supabase.rpc('start_workout_from_training_session', {
    p_training_session_id: trainingSessionId,
  })
  if (error) return { workoutId: null, title: null, error: new Error(error.message) }
  const row = data as { ok?: boolean; workout_id?: string; title?: string; error?: string } | null
  if (!row?.ok) return { workoutId: null, title: null, error: new Error(row?.error ?? 'start_workout_failed') }
  return { workoutId: row.workout_id ?? null, title: row.title ?? null, error: null }
}

export async function fetchUserActiveLevel(
  userId: string,
): Promise<{ levelId: string | null; error: Error | null }> {
  const { data, error } = await supabase.from('profiles').select('active_training_level_id').eq('id', userId).maybeSingle()
  if (error) return { levelId: null, error: new Error(error.message) }
  return { levelId: (data?.active_training_level_id as string | null) ?? null, error: null }
}

export async function fetchUserLevelProgress(
  userId: string,
  levelId: string,
): Promise<{ data: UserLevelProgress | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('user_level_progress')
    .select(
      'id, user_id, level_id, start_date, last_activity_date, key_exercise_bests, current_status, last_session_id, next_recommended_session_id',
    )
    .eq('user_id', userId)
    .eq('level_id', levelId)
    .maybeSingle()
  if (error) return { data: null, error: new Error(error.message) }
  return { data: (data as UserLevelProgress | null) ?? null, error: null }
}

export async function recordUserLevelTransition(input: {
  fromLevelId?: string | null
  toLevelId?: string | null
  reason: 'objectif_atteint' | 'stagnation' | 'choix_manuel'
  notes?: string | null
}): Promise<{ error: Error | null }> {
  const { data: authData } = await supabase.auth.getUser()
  const uid = authData.user?.id
  if (!uid) return { error: new Error('Non connecté') }

  const { error } = await supabase.from('user_level_transitions').insert({
    user_id: uid,
    from_level_id: input.fromLevelId ?? null,
    to_level_id: input.toLevelId ?? null,
    reason: input.reason,
    notes: input.notes ?? null,
  })
  if (error) return { error: new Error(error.message) }
  return { error: null }
}
