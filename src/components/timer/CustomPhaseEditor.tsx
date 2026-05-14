import type { CustomPhase, PhaseKind } from '../../types/timer'
import { SpinButton } from './SpinButton'

export type CustomPhaseEditorProps = {
  phases: CustomPhase[]
  onChange: (next: CustomPhase[]) => void
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `ph-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function CustomPhaseEditor({ phases, onChange }: CustomPhaseEditorProps) {
  function updateAt(i: number, patch: Partial<CustomPhase>) {
    const next = phases.map((p, j) => (j === i ? { ...p, ...patch } : p))
    onChange(next)
  }

  function removeAt(i: number) {
    onChange(phases.filter((_, j) => j !== i))
  }

  function addAfter(i: number) {
    const neo: CustomPhase = {
      id: uid(),
      name: 'Nouvelle phase',
      duration: 30,
      type: 'work',
    }
    const next = [...phases.slice(0, i + 1), neo, ...phases.slice(i + 1)]
    onChange(next)
  }

  return (
    <div className="custom-phase-editor">
      {phases.length === 0 ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            onChange([
              {
                id: uid(),
                name: 'Préparation',
                duration: 10,
                type: 'prepare',
              },
            ])
          }
        >
          + Première phase
        </button>
      ) : null}
      {phases.map((p, i) => (
        <div key={p.id} className={`custom-phase-card custom-phase-${p.type}`}>
          <div className="custom-phase-row">
            <label className="custom-phase-lbl">
              Type
              <select
                className="custom-phase-select"
                value={p.type}
                onChange={(e) => updateAt(i, { type: e.target.value as PhaseKind })}
              >
                <option value="prepare">Préparation</option>
                <option value="work">Travail</option>
                <option value="rest">Repos</option>
              </select>
            </label>
            <button type="button" className="custom-phase-trash" aria-label="Supprimer la phase" onClick={() => removeAt(i)}>
              🗑
            </button>
          </div>
          <label className="custom-phase-lbl">
            Nom
            <input
              className="custom-phase-input"
              type="text"
              value={p.name}
              maxLength={48}
              onChange={(e) => updateAt(i, { name: e.target.value })}
            />
          </label>
          <label className="custom-phase-lbl">
            Durée (secondes)
            <SpinButton
              ariaLabel={`Durée ${p.name}`}
              value={p.duration}
              min={1}
              max={3600}
              suffix="s"
              onChange={(duration) => updateAt(i, { duration })}
            />
          </label>
          <button type="button" className="custom-phase-add btn btn-secondary" onClick={() => addAfter(i)}>
            + Bloc sous cette phase
          </button>
        </div>
      ))}
    </div>
  )
}
