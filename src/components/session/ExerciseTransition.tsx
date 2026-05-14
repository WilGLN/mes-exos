type Props = {
  open: boolean
  completedExerciseName: string
}

export function ExerciseTransition({ open, completedExerciseName }: Props) {
  if (!open) return null
  return (
    <div className="card" style={{ marginTop: 10, background: '#1e2a00', borderColor: 'var(--ac)' }}>
      <p className="mono" style={{ color: 'var(--ac)' }}>
        Exercice terminé ✓ — {completedExerciseName}
      </p>
    </div>
  )
}
