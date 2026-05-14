/** Affichage lisible des durées de repos (livre / UI). */
export function formatRest(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  if (s < 60) return `${s}s`
  const min = Math.floor(s / 60)
  const sec = s % 60
  if (sec === 0) return `${min} min`
  return `${min} min ${sec}`
}
