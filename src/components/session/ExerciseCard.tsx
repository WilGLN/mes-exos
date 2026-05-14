import type { WorkoutSessionExercise } from '../../types/training'

type Props = {
  exercise: WorkoutSessionExercise | null
  setLabel: string
  repsTarget: string
  /** Repos entre séries (ou inter-exercice si affiché ainsi par le parent). */
  restBetweenLabel?: string
  lastPerf: string
  note: string
  showBookHint?: boolean
  sideLabel?: string
}

export function ExerciseCard({ exercise, setLabel, repsTarget, restBetweenLabel, lastPerf, note, showBookHint, sideLabel }: Props) {
  if (!exercise) {
    return (
      <section className="card exo-card">
        <p className="exo-num">Chargement…</p>
      </section>
    )
  }
  const tempoLabel =
    exercise.tempo_mode === 'lent' ? 'Rythme lent' : exercise.tempo_mode === 'rapide' ? 'Rythme rapide' : exercise.tempo_mode === 'special' ? 'Rythme spécial' : 'Rythme normal'

  return (
    <section className="card exo-card">
      <p className="exo-num">
        {exercise.exercise_code} — {exercise.nom_court}
      </p>
      <h2 className="exo-nm">{exercise.groupe_principal}</h2>
      <p className="exo-var mono">{setLabel + (sideLabel ? ` · ${sideLabel}` : '')}</p>
      <p className="body muted" style={{ marginTop: 6 }}>
        Cible: {repsTarget}
      </p>
      <p className="body muted" style={{ marginTop: 4 }}>
        Dernière fois: {lastPerf}
      </p>
      {restBetweenLabel ? (
        <p className="body muted" style={{ marginTop: 4 }}>
          Repos (série / transition): {restBetweenLabel}
        </p>
      ) : null}
      <p className="body muted" style={{ marginTop: 4 }}>
        {note}
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <span className="pill">{tempoLabel}</span>
        {showBookHint ? <span className="mono muted">Voir détails dans le livre</span> : null}
      </div>
    </section>
  )
}
