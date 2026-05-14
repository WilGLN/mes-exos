import type { TimerWorkout } from '../types/timer'

const KEY = 'lafay_timer_workouts'

export function loadTimerWorkouts(): TimerWorkout[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as TimerWorkout[]
  } catch {
    return []
  }
}

export function saveTimerWorkouts(list: TimerWorkout[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* quota / mode privé */
  }
}

export function upsertTimerWorkout(w: TimerWorkout): TimerWorkout[] {
  const list = loadTimerWorkouts()
  const i = list.findIndex((x) => x.id === w.id)
  if (i >= 0) list[i] = w
  else list.unshift(w)
  saveTimerWorkouts(list)
  return list
}

export function deleteTimerWorkout(id: string): TimerWorkout[] {
  const list = loadTimerWorkouts().filter((x) => x.id !== id)
  saveTimerWorkouts(list)
  return list
}
