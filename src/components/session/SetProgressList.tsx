import type { SetEntry } from '../../types/training'

type Props = {
  total: number
  current: number
  entries: SetEntry[]
}

export function SetProgressList({ total, current, entries }: Props) {
  const bySet = new Map(entries.map((e) => [e.set_number, e]))
  return (
    <div className="card" style={{ marginTop: 10 }}>
      {Array.from({ length: total }, (_, i) => {
        const k = i + 1
        const hit = bySet.get(k)
        const label = hit ? (hit.completed ? `✅ ${hit.reps} reps` : '⏸️ passée') : k === current ? '⬜ en cours' : '⬜'
        return (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--bd)' }}>
            <span className="mono">Série {k}</span>
            <span className="mono muted">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
