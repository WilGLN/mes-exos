import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  deleteTimerWorkoutRemote,
  fetchTimerWorkoutsRemote,
  migrateLocalTimerWorkoutsIfEmptyRemote,
  upsertTimerWorkoutRemote,
} from '../lib/timerWorkoutRemote'
import type { TimerWorkout } from '../types/timer'

export function useTimerWorkouts() {
  const { user } = useAuth()
  const [list, setList] = useState<TimerWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    if (!user?.id) {
      setList([])
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const mig = await migrateLocalTimerWorkoutsIfEmptyRemote()
    if (mig.error) {
      setError(mig.error.message)
      setList([])
      setLoading(false)
      return
    }
    const { data, error: e } = await fetchTimerWorkoutsRemote()
    setLoading(false)
    if (e) {
      setError(e.message)
      setList([])
    } else {
      setError(null)
      setList(data)
    }
  }, [user?.id])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const save = useCallback(
    async (w: TimerWorkout) => {
      setError(null)
      const { error: e } = await upsertTimerWorkoutRemote(w)
      if (e) {
        setError(e.message)
        return
      }
      await loadAll()
    },
    [loadAll],
  )

  const remove = useCallback(
    async (id: string) => {
      setError(null)
      const { error: e } = await deleteTimerWorkoutRemote(id)
      if (e) {
        setError(e.message)
        return
      }
      await loadAll()
    },
    [loadAll],
  )

  return { list, save, remove, refresh: loadAll, loading, error }
}
