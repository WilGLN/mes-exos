import { useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

export type BodyMeasurementRow = {
  id: string
  user_id: string
  measured_at: string
  weight_kg: number | null
  chest_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  thigh_cm: number | null
  calf_cm: number | null
  shoulders_cm: number | null
  arm_cm: number | null
  photos_taken: boolean
  photo_date: string | null
  notes: string | null
  created_at: string
}

export type EntryTestRow = {
  id: string
  user_id: string
  tested_at: string
  reps_a: number | null
  reps_b: number | null
  reps_c: number | null
  reps_a1: number | null
  recommended_program: string | null
  notes: string | null
  created_at: string
}

export type EntryTestInput = {
  tested_at: string
  reps_a: number | null
  reps_b: number | null
  reps_c: number | null
  reps_a1: number | null
  notes: string | null
}

export type BodyMeasurementInput = {
  measured_at: string
  weight_kg: number | null
  chest_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  thigh_cm: number | null
  calf_cm: number | null
  shoulders_cm: number | null
  arm_cm: number | null
  photos_taken: boolean
  photo_date: string | null
  notes: string | null
}

const ENTRY_TEST_COLUMNS =
  'id, user_id, tested_at, reps_a, reps_b, reps_c, reps_a1, recommended_program, notes, created_at'

function coerceReps(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? Math.round(n) : null
}

function normalizeEntryTestRow(raw: Record<string, unknown>): EntryTestRow {
  const testedAt = raw.tested_at
  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    tested_at: typeof testedAt === 'string' ? testedAt.slice(0, 10) : String(testedAt ?? ''),
    reps_a: coerceReps(raw.reps_a),
    reps_b: coerceReps(raw.reps_b),
    reps_c: coerceReps(raw.reps_c),
    reps_a1: coerceReps(raw.reps_a1),
    recommended_program: raw.recommended_program != null ? String(raw.recommended_program) : null,
    notes: raw.notes != null ? String(raw.notes) : null,
    created_at: String(raw.created_at ?? ''),
  }
}

async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non connecté')
  return user.id
}

export function useProfile() {
  const getLatestMeasurements = useCallback(async (userId: string): Promise<BodyMeasurementRow | null> => {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throw error
    return (data?.[0] as BodyMeasurementRow | undefined) ?? null
  }, [])

  const getMeasurementsHistory = useCallback(async (userId: string, limit = 6): Promise<BodyMeasurementRow[]> => {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as BodyMeasurementRow[]
  }, [])

  const addMeasurement = useCallback(async (row: BodyMeasurementInput) => {
    const userId = await requireUserId()
    const { error } = await supabase.from('body_measurements').insert({
      user_id: userId,
      measured_at: row.measured_at,
      weight_kg: row.weight_kg,
      chest_cm: row.chest_cm,
      waist_cm: row.waist_cm,
      hips_cm: row.hips_cm,
      thigh_cm: row.thigh_cm,
      calf_cm: row.calf_cm,
      shoulders_cm: row.shoulders_cm,
      arm_cm: row.arm_cm,
      photos_taken: row.photos_taken,
      photo_date: row.photo_date,
      notes: row.notes,
    })
    if (error) throw error
  }, [])

  const updateMeasurement = useCallback(async (id: string, row: BodyMeasurementInput) => {
    const { error } = await supabase
      .from('body_measurements')
      .update({
        measured_at: row.measured_at,
        weight_kg: row.weight_kg,
        chest_cm: row.chest_cm,
        waist_cm: row.waist_cm,
        hips_cm: row.hips_cm,
        thigh_cm: row.thigh_cm,
        calf_cm: row.calf_cm,
        shoulders_cm: row.shoulders_cm,
        arm_cm: row.arm_cm,
        photos_taken: row.photos_taken,
        photo_date: row.photo_date,
        notes: row.notes,
      })
      .eq('id', id)
    if (error) throw error
  }, [])

  const deleteMeasurement = useCallback(async (id: string) => {
    const { error } = await supabase.from('body_measurements').delete().eq('id', id)
    if (error) throw error
  }, [])

  const getLatestEntryTest = useCallback(async (userId: string): Promise<EntryTestRow | null> => {
    const { data, error } = await supabase
      .from('entry_tests')
      .select(ENTRY_TEST_COLUMNS)
      .eq('user_id', userId)
      .order('tested_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
    if (error) throw error
    const row = data?.[0]
    return row ? normalizeEntryTestRow(row as Record<string, unknown>) : null
  }, [])

  const addEntryTest = useCallback(async (row: EntryTestInput): Promise<EntryTestRow> => {
    const userId = await requireUserId()
    const { data, error } = await supabase
      .from('entry_tests')
      .insert({
        user_id: userId,
        tested_at: row.tested_at,
        reps_a: row.reps_a,
        reps_b: row.reps_b,
        reps_c: row.reps_c,
        reps_a1: row.reps_a1,
        notes: row.notes,
      })
      .select(ENTRY_TEST_COLUMNS)
      .single()
    if (error) throw error
    return normalizeEntryTestRow(data as Record<string, unknown>)
  }, [])

  const updateEntryTest = useCallback(async (id: string, row: EntryTestInput): Promise<EntryTestRow> => {
    const { data, error } = await supabase
      .from('entry_tests')
      .update({
        tested_at: row.tested_at,
        reps_a: row.reps_a,
        reps_b: row.reps_b,
        reps_c: row.reps_c,
        reps_a1: row.reps_a1,
        notes: row.notes,
      })
      .eq('id', id)
      .select(ENTRY_TEST_COLUMNS)
      .single()
    if (error) throw error
    return normalizeEntryTestRow(data as Record<string, unknown>)
  }, [])

  const deleteEntryTest = useCallback(async (id: string) => {
    const { error } = await supabase.from('entry_tests').delete().eq('id', id)
    if (error) throw error
  }, [])

  return useMemo(
    () => ({
      getLatestMeasurements,
      getMeasurementsHistory,
      addMeasurement,
      updateMeasurement,
      deleteMeasurement,
      getLatestEntryTest,
      addEntryTest,
      updateEntryTest,
      deleteEntryTest,
    }),
    [
      getLatestMeasurements,
      getMeasurementsHistory,
      addMeasurement,
      updateMeasurement,
      deleteMeasurement,
      getLatestEntryTest,
      addEntryTest,
      updateEntryTest,
      deleteEntryTest,
    ],
  )
}
