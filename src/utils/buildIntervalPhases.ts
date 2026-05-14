import type {
  AmrapConfig,
  BuiltPhase,
  CustomConfig,
  EmomConfig,
  HiitConfig,
  PyramidConfig,
  TabataConfig,
  TimerWorkoutConfig,
} from '../types/timer'

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

/** Tabata / HIIT : travail puis repos entre chaque tour (pas de repos après le dernier travail). */
export function buildTabataLikePhases(workSec: number, restSec: number, rounds: number, labelPrefix: string): BuiltPhase[] {
  const out: BuiltPhase[] = []
  for (let r = 1; r <= rounds; r++) {
    out.push({
      id: uid('w'),
      name: `${labelPrefix} ${r}/${rounds}`,
      durationSec: Math.max(1, workSec),
      kind: 'work',
    })
    if (r < rounds && restSec > 0) {
      out.push({
        id: uid('r'),
        name: 'Repos',
        durationSec: restSec,
        kind: 'rest',
      })
    }
  }
  return out
}

export function buildFromTabata(c: TabataConfig): BuiltPhase[] {
  return buildTabataLikePhases(c.workSec, c.restSec, c.rounds, 'Travail')
}

export function buildFromHiit(c: HiitConfig): BuiltPhase[] {
  return buildTabataLikePhases(c.workSec, c.restSec, c.cycles, c.name?.trim() || 'HIIT')
}

export function buildFromAmrap(c: AmrapConfig): BuiltPhase[] {
  return [
    {
      id: uid('amrap'),
      name: c.name?.trim() || 'AMRAP',
      durationSec: Math.max(1, c.totalSec),
      kind: 'work',
    },
  ]
}

export function buildFromEmom(c: EmomConfig): BuiltPhase[] {
  const m = Math.max(1, Math.min(60, c.minutes))
  const out: BuiltPhase[] = []
  for (let i = 1; i <= m; i++) {
    out.push({
      id: uid('emom'),
      name: `Minute ${i}/${m}`,
      durationSec: 60,
      kind: 'work',
    })
  }
  return out
}

export function buildFromPyramid(c: PyramidConfig): BuiltPhase[] {
  const base = Math.max(1, c.baseSec)
  const inc = Math.max(0, c.incrementSec)
  const steps = Math.max(1, Math.min(30, c.steps))
  const restB = Math.max(0, c.restBetweenSec)
  const durations: number[] = []

  if (c.direction === 'up') {
    for (let i = 0; i < steps; i++) durations.push(base + i * inc)
  } else if (c.direction === 'down') {
    for (let i = 0; i < steps; i++) durations.push(base + (steps - 1 - i) * inc)
  } else {
    for (let i = 0; i < steps; i++) durations.push(base + i * inc)
    for (let i = steps - 2; i >= 0; i--) durations.push(base + i * inc)
  }

  const out: BuiltPhase[] = []
  durations.forEach((d, idx) => {
    out.push({
      id: uid('py'),
      name: `Palier ${idx + 1}/${durations.length}`,
      durationSec: Math.max(1, d),
      kind: 'work',
    })
    if (restB > 0 && idx < durations.length - 1) {
      out.push({ id: uid('pyr'), name: 'Repos', durationSec: restB, kind: 'rest' })
    }
  })
  return out
}

export function buildFromCustom(c: CustomConfig): BuiltPhase[] {
  const repeat = Math.max(1, Math.min(20, c.repeat))
  const pause = Math.max(0, Math.min(120, c.pauseBetweenRepeatsSec ?? 0))
  const single: BuiltPhase[] = (c.phases.length ? c.phases : [{ id: 'x', name: 'Travail', duration: 30, type: 'work' as const }]).map(
    (p) => ({
      id: p.id,
      name: p.name.trim() || (p.type === 'rest' ? 'Repos' : p.type === 'prepare' ? 'Préparation' : 'Travail'),
      durationSec: Math.max(1, p.duration),
      kind: p.type,
    }),
  )
  const out: BuiltPhase[] = []
  for (let r = 0; r < repeat; r++) {
    single.forEach((ph) => {
      out.push({
        id: uid('c'),
        name: repeat > 1 ? `${ph.name} · ${r + 1}/${repeat}` : ph.name,
        durationSec: ph.durationSec,
        kind: ph.kind,
      })
    })
    if (pause > 0 && r < repeat - 1) {
      out.push({ id: uid('cp'), name: 'Pause entre cycles', durationSec: pause, kind: 'rest' })
    }
  }
  return out
}

export function buildPhasesFromWorkoutConfig(config: TimerWorkoutConfig): BuiltPhase[] {
  switch (config.type) {
    case 'tabata':
      return buildFromTabata(config.tabata)
    case 'hiit':
      return buildFromHiit(config.hiit)
    case 'amrap':
      return buildFromAmrap(config.amrap)
    case 'emom':
      return buildFromEmom(config.emom)
    case 'pyramid':
      return buildFromPyramid(config.pyramid)
    case 'custom':
      return buildFromCustom(config.custom)
    default:
      return []
  }
}

export function estimateTotalSeconds(config: TimerWorkoutConfig): number {
  return buildPhasesFromWorkoutConfig(config).reduce((a, p) => a + p.durationSec, 0)
}
