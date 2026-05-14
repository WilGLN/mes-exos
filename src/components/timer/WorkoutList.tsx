import { buildPhasesFromWorkoutConfig, estimateTotalSeconds } from '../../utils/buildIntervalPhases'
import type { BuiltPhase, TimerWorkout } from '../../types/timer'
import { formatMmSs } from '../../utils/formatMmSs'
import { formatRest } from '../../utils/formatRest'

export type WorkoutListProps = {
  workouts: TimerWorkout[]
  onRemove: (id: string) => void
  onLaunch: (phases: BuiltPhase[]) => void
  onEdit: (w: TimerWorkout) => void
  onNew: () => void
}

const TYPE_LBL: Record<TimerWorkout['type'], string> = {
  tabata: 'Tabata',
  hiit: 'HIIT',
  amrap: 'AMRAP',
  emom: 'EMOM',
  pyramid: 'Pyramide',
  custom: 'Personnalisé',
}

export function WorkoutList({ workouts, onRemove, onLaunch, onEdit, onNew }: WorkoutListProps) {
  return (
    <div className="workout-list">
      {workouts.length === 0 ? (
        <p className="workout-list-empty">Aucune séance sauvegardée. Créez votre première !</p>
      ) : (
        <ul className="workout-list-ul">
          {workouts.map((w) => {
            const sec = estimateTotalSeconds(w.config)
            return (
              <li key={w.id} className="workout-card card">
                <div className="workout-card-main">
                  <p className="workout-card-name">{w.name}</p>
                  <p className="workout-card-meta mono">
                    {TYPE_LBL[w.type]} · {formatRest(sec)} ({formatMmSs(sec)})
                  </p>
                </div>
                <div className="workout-card-actions">
                  <button
                    type="button"
                    className="btn-icon sm"
                    aria-label="Lancer"
                    title="Lancer"
                    onClick={() => onLaunch(buildPhasesFromWorkoutConfig(w.config))}
                  >
                    ▶
                  </button>
                  <button type="button" className="btn-icon sm" aria-label="Modifier" title="Modifier" onClick={() => onEdit(w)}>
                    ✏️
                  </button>
                  <button type="button" className="btn-icon sm" aria-label="Supprimer" title="Supprimer" onClick={() => onRemove(w.id)}>
                    🗑
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <button type="button" className="btn btn-primary workout-list-fab" onClick={onNew}>
        + Nouvelle séance
      </button>
    </div>
  )
}
