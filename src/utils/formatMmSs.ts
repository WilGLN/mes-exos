/** Affichage mm:ss pour le chrono (ex. 02:30). */
export function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** Parse une chaîne "m:ss" ou "mm:ss" → secondes, ou null si invalide. */
export function parseMmSsLoose(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const parts = t.split(':').map((x) => x.trim())
  if (parts.length === 1) {
    const n = Number(parts[0])
    if (!Number.isFinite(n) || n < 0) return null
    return Math.min(Math.floor(n), 5999) // plafonner ~99 min
  }
  if (parts.length === 2) {
    const mm = Number(parts[0])
    const ss = Number(parts[1])
    if (!Number.isFinite(mm) || !Number.isFinite(ss) || mm < 0 || ss < 0 || ss > 59) return null
    return Math.min(mm * 60 + Math.floor(ss), 5999)
  }
  return null
}
