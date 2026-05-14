/** Types pour la page Chrono (timer libre + intervalles + localStorage). */

export type TimerWorkoutType = 'tabata' | 'hiit' | 'amrap' | 'emom' | 'pyramid' | 'custom'

export type PhaseKind = 'work' | 'rest' | 'prepare'

/** Phase exécutée par le lecteur d’intervalles (séquence aplatie). */
export type BuiltPhase = {
  id: string
  name: string
  durationSec: number
  kind: PhaseKind
}

export type TabataConfig = { workSec: number; restSec: number; rounds: number }

export type HiitConfig = { workSec: number; restSec: number; cycles: number; name?: string }

export type AmrapConfig = { totalSec: number; name?: string }

export type EmomConfig = { minutes: number }

export type PyramidDirection = 'up' | 'down' | 'both'

export type PyramidConfig = {
  baseSec: number
  incrementSec: number
  steps: number
  direction: PyramidDirection
  restBetweenSec: number
}

export type CustomPhase = {
  id: string
  name: string
  duration: number
  type: PhaseKind
}

export type CustomConfig = {
  phases: CustomPhase[]
  repeat: number
  /** Pause entre répétitions de la séquence entière (secondes). */
  pauseBetweenRepeatsSec?: number
}

export type TimerWorkoutConfig =
  | { type: 'tabata'; tabata: TabataConfig }
  | { type: 'hiit'; hiit: HiitConfig }
  | { type: 'amrap'; amrap: AmrapConfig }
  | { type: 'emom'; emom: EmomConfig }
  | { type: 'pyramid'; pyramid: PyramidConfig }
  | { type: 'custom'; custom: CustomConfig }

export type TimerWorkout = {
  id: string
  name: string
  type: TimerWorkoutType
  createdAt: string
  updatedAt: string
  config: TimerWorkoutConfig
}

export type IntervalTimerState = 'idle' | 'prepare' | 'running' | 'paused' | 'between' | 'complete'
