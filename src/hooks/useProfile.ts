import { useCallback } from 'react'
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

async function requireUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
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
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data as BodyMeasurementRow | null
  }, [])

  const getMeasurementsHistory = useCallback(
    async (userId: string, limit = 6): Promise<BodyMeasurementRow[]> => {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(limit)
      if (error) throw error
      return (data ?? []) as BodyMeasurementRow[]
    },
    [],
  )

  const addMeasurement = useCallback(async (row: Partial<BodyMeasurementRow> & { measured_at?: string }) => {
    const userId = await requireUserId()
    const { error } = await supabase.from('body_measurements').insert({
      user_id: userId,
      measured_at: row.measured_at ?? new Date().toISOString().slice(0, 10),
      weight_kg: row.weight_kg ?? null,
      chest_cm: row.chest_cm ?? null,
      waist_cm: row.waist_cm ?? null,
      hips_cm: row.hips_cm ?? null,
      thigh_cm: row.thigh_cm ?? null,
      calf_cm: row.calf_cm ?? null,
      shoulders_cm: row.shoulders_cm ?? null,
      arm_cm: row.arm_cm ?? null,
      photos_taken: row.photos_taken ?? false,
      photo_date: row.photo_date ?? null,
      notes: row.notes ?? null,
    })
    if (error) throw error
  }, [])

  const getLatestEntryTest = useCallback(async (userId: string): Promise<EntryTestRow | null> => {
    const { data, error } = await supabase
      .from('entry_tests')
      .select('*')
      .eq('user_id', userId)
      .order('tested_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data as EntryTestRow | null
  }, [])

  const addEntryTest = useCallback(async (row: Partial<EntryTestRow> & { tested_at?: string }) => {
    const userId = await requireUserId()
    const { error } = await supabase.from('entry_tests').insert({
      user_id: userId,
      tested_at: row.tested_at ?? new Date().toISOString().slice(0, 10),
      reps_a: row.reps_a ?? null,
      reps_b: row.reps_b ?? null,
      reps_c: row.reps_c ?? null,
      reps_a1: row.reps_a1 ?? null,
      notes: row.notes ?? null,
    })
    if (error) throw error
  }, [])

  return {
    getLatestMeasurements,
    getMeasurementsHistory,
    addMeasurement,
    getLatestEntryTest,
    addEntryTest,
  }
}
