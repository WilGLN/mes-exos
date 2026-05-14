type Props = {
  niveau: string
  seance: string
  progression: string
  onAbandon: () => void
  onPreviousExercise?: () => void
}

export function WorkoutHeader({ niveau, seance, progression, onAbandon, onPreviousExercise }: Props) {
  return (
    <div className="sess-head">
      <button type="button" className="btn-icon sm" aria-label="Exercice précédent" onClick={onPreviousExercise}>
        ←
      </button>
      <div className="sess-mid">
        <p className="sess-name">{niveau}</p>
        <p className="sess-prog">
          {seance} · {progression}
        </p>
      </div>
      <button type="button" className="btn-icon sm" aria-label="Abandonner la séance" onClick={onAbandon}>
        ✕
      </button>
    </div>
  )
}
