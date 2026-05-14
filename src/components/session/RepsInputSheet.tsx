import { useEffect, useState } from 'react'
import { formatRest } from '../../utils/formatRest'

type Props = {
  open: boolean
  title: string
  defaultValue: number
  doneText: string
  countdownSeconds: number
  onConfirm: (reps: number) => void
  onSkip: () => void
  onClose: () => void
}

export function RepsInputSheet({ open, title, defaultValue, doneText, countdownSeconds, onConfirm, onSkip, onClose }: Props) {
  const [reps, setReps] = useState(String(defaultValue))
  useEffect(() => {
    if (open) setReps(String(defaultValue))
  }, [open, defaultValue])
  if (!open) return null
  return (
    <div className="repos-sheet-root" role="dialog" aria-modal="true" aria-label="Saisie répétitions">
      <button type="button" className="repos-sheet-backdrop" onClick={onClose} aria-label="Fermer" />
      <div className="repos-sheet-panel">
        <div className="repos-sheet-handle" aria-hidden />
        <p className="eyebrow">{title}</p>
        <input
          className="input mono"
          style={{ textAlign: 'center', fontSize: '2.2rem', minHeight: 72 }}
          type="number"
          inputMode="numeric"
          min={0}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          autoFocus
        />
        <p className="body muted" style={{ marginTop: 8 }}>
          Déjà validé: {doneText}
        </p>
        <p className="mono" style={{ marginTop: 4, color: countdownSeconds <= 5 ? 'var(--red)' : 'var(--ac)' }}>
          Repos en cours: {formatRest(Math.max(0, countdownSeconds))}
        </p>
        <div className="repos-sheet-actions" style={{ marginTop: 12 }}>
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(Math.max(0, Number(reps) || 0))}>
            Confirmer
          </button>
          <button type="button" className="btn btn-secondary" onClick={onSkip}>
            Passer
          </button>
        </div>
      </div>
    </div>
  )
}
