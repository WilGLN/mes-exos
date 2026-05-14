import type { WorkoutJournalListRow } from '../lib/catalog'

/** Lundi (date UTC `YYYY-MM-DD`) de la semaine contenant `d`. */
export function mondayUtcWeekStart(d = new Date()): string {
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const day = d.getUTCDate()
  const wd = d.getUTCDay()
  const delta = wd === 0 ? -6 : 1 - wd
  const t = Date.UTC(y, m, day + delta)
  return new Date(t).toISOString().slice(0, 10)
}

export function addDaysUtc(isoDate: string, delta: number): string {
  const [Y, M, D] = isoDate.split('-').map(Number)
  const t = Date.UTC(Y, M - 1, D + delta)
  return new Date(t).toISOString().slice(0, 10)
}

function completedDays(rows: WorkoutJournalListRow[]): Set<string> {
  const s = new Set<string>()
  for (const r of rows) {
    if (r.status === 'completed') s.add(r.day_utc)
  }
  return s
}

/**
 * Série de jours consécutifs (UTC) se terminant au jour de la séance la plus récente.
 * Ex. séances lun / mar / mer sans jeu → 3.
 */
export function currentWorkoutStreak(rows: WorkoutJournalListRow[]): number {
  const days = completedDays(rows)
  if (!days.size) return 0
  const sorted = [...days].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0))
  let cur = sorted[0]
  let n = 0
  while (days.has(cur)) {
    n++
    cur = addDaysUtc(cur, -1)
  }
  return n
}

export function countWorkoutsInUtcWeek(rows: WorkoutJournalListRow[], weekStart: string): number {
  const endEx = addDaysUtc(weekStart, 7)
  return rows.filter((r) => r.status === 'completed' && r.day_utc >= weekStart && r.day_utc < endEx).length
}

export function lastCompletedStartedAt(rows: WorkoutJournalListRow[]): string | null {
  const done = rows.filter((r) => r.status === 'completed')
  if (!done.length) return null
  return done.reduce((a, b) => (a.started_at > b.started_at ? a : b)).started_at
}
