import { useCallback, useState } from 'react'
import { deleteTimerWorkout, loadTimerWorkouts, upsertTimerWorkout } from '../utils/timerWorkoutStorage'
import type { TimerWorkout } from '../types/timer'

export function useTimerWorkouts() {
  const [list, setList] = useState<TimerWorkout[]>(() => loadTimerWorkouts())

  const refresh = useCallback(() => {
    setList(loadTimerWorkouts())
  }, [])

  const save = useCallback((w: TimerWorkout) => {
    setList(upsertTimerWorkout(w))
  }, [])

  const remove = useCallback((id: string) => {
    setList(deleteTimerWorkout(id))
  }, [])

  return { list, save, remove, refresh }
}
