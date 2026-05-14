import { useMemo, useState } from 'react'
import type { BuiltPhase, PyramidDirection, TimerWorkoutConfig } from '../../types/timer'
import {
  buildFromAmrap,
  buildFromEmom,
  buildFromHiit,
  buildFromPyramid,
  buildFromTabata,
  estimateTotalSeconds,
} from '../../utils/buildIntervalPhases'
import { formatMmSs, parseMmSsLoose } from '../../utils/formatMmSs'
import { formatRest } from '../../utils/formatRest'
import { SpinButton } from './SpinButton'

export type IntervalBuilderProps = {
  onLaunch: (phases: BuiltPhase[]) => void
}

type Mode = 'tabata' | 'hiit' | 'amrap' | 'emom' | 'pyramid'

export function IntervalBuilder({ onLaunch }: IntervalBuilderProps) {
  const [mode, setMode] = useState<Mode>('tabata')

  const [tabata, setTabata] = useState({ workSec: 20, restSec: 10, rounds: 8 })
  const [hiit, setHiit] = useState({ workSec: 40, restSec: 20, cycles: 8, name: '' })
  const [amrapMmSs, setAmrapMmSs] = useState('12:00')
  const [amrapName, setAmrapName] = useState('')
  const [emomMin, setEmomMin] = useState(10)
  const [py, setPy] = useState({
    baseSec: 20,
    incrementSec: 10,
    steps: 5,
    direction: 'both' as PyramidDirection,
    restBetweenSec: 15,
  })

  const config: TimerWorkoutConfig | null = useMemo(() => {
    switch (mode) {
      case 'tabata':
        return { type: 'tabata', tabata: { ...tabata } }
      case 'hiit':
        return { type: 'hiit', hiit: { ...hiit, name: hiit.name.trim() || undefined } }
      case 'amrap': {
        const sec = parseMmSsLoose(amrapMmSs) ?? 0
        return { type: 'amrap', amrap: { totalSec: Math.max(1, sec), name: amrapName.trim() || undefined } }
      }
      case 'emom':
        return { type: 'emom', emom: { minutes: emomMin } }
      case 'pyramid':
        return { type: 'pyramid', pyramid: { ...py } }
      default:
        return null
    }
  }, [mode, tabata, hiit, amrapMmSs, amrapName, emomMin, py])

  const totalSec = config ? estimateTotalSeconds(config) : 0

  function launch() {
    if (!config) return
    switch (config.type) {
      case 'tabata':
        onLaunch(buildFromTabata(config.tabata))
        break
      case 'hiit':
        onLaunch(buildFromHiit(config.hiit))
        break
      case 'amrap':
        onLaunch(buildFromAmrap(config.amrap))
        break
      case 'emom':
        onLaunch(buildFromEmom(config.emom))
        break
      case 'pyramid':
        onLaunch(buildFromPyramid(config.pyramid))
        break
      default:
        break
    }
  }

  const modes: { id: Mode; label: string }[] = [
    { id: 'tabata', label: 'Tabata' },
    { id: 'hiit', label: 'HIIT' },
    { id: 'amrap', label: 'AMRAP' },
    { id: 'emom', label: 'EMOM' },
    { id: 'pyramid', label: 'Pyramide' },
  ]

  return (
    <div className="interval-builder">
      <p className="interval-builder-intro">Configure une séance rapide et lance-la sans l’enregistrer.</p>

      <div className="timer-subtabs" role="tablist" aria-label="Type d’intervalles">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={`timer-subtab${mode === m.id ? ' timer-subtab-on' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="interval-builder-form card">
        {mode === 'tabata' ? (
          <div className="interval-builder-grid">
            <label className="interval-field">
              <span>Travail</span>
              <SpinButton
                ariaLabel="Secondes travail"
                value={tabata.workSec}
                min={5}
                max={120}
                suffix="s"
                onChange={(workSec) => setTabata((s) => ({ ...s, workSec }))}
              />
            </label>
            <label className="interval-field">
              <span>Repos</span>
              <SpinButton
                ariaLabel="Secondes repos"
                value={tabata.restSec}
                min={0}
                max={120}
                suffix="s"
                onChange={(restSec) => setTabata((s) => ({ ...s, restSec }))}
              />
            </label>
            <label className="interval-field">
              <span>Rounds</span>
              <SpinButton
                ariaLabel="Nombre de rounds"
                value={tabata.rounds}
                min={1}
                max={30}
                onChange={(rounds) => setTabata((s) => ({ ...s, rounds }))}
              />
            </label>
          </div>
        ) : null}

        {mode === 'hiit' ? (
          <div className="interval-builder-grid">
            <label className="interval-field interval-field-full">
              <span>Nom (optionnel)</span>
              <input
                className="interval-text"
                type="text"
                maxLength={40}
                placeholder="ex. Circuit A"
                value={hiit.name}
                onChange={(e) => setHiit((s) => ({ ...s, name: e.target.value }))}
              />
            </label>
            <label className="interval-field">
              <span>Travail</span>
              <SpinButton
                ariaLabel="Secondes travail HIIT"
                value={hiit.workSec}
                min={5}
                max={300}
                suffix="s"
                onChange={(workSec) => setHiit((s) => ({ ...s, workSec }))}
              />
            </label>
            <label className="interval-field">
              <span>Repos</span>
              <SpinButton
                ariaLabel="Secondes repos HIIT"
                value={hiit.restSec}
                min={0}
                max={180}
                suffix="s"
                onChange={(restSec) => setHiit((s) => ({ ...s, restSec }))}
              />
            </label>
            <label className="interval-field">
              <span>Cycles</span>
              <SpinButton
                ariaLabel="Nombre de cycles"
                value={hiit.cycles}
                min={1}
                max={40}
                onChange={(cycles) => setHiit((s) => ({ ...s, cycles }))}
              />
            </label>
          </div>
        ) : null}

        {mode === 'amrap' ? (
          <div className="interval-builder-grid">
            <label className="interval-field interval-field-full">
              <span>Durée totale (mm:ss)</span>
              <input
                className="interval-text mono"
                type="text"
                inputMode="numeric"
                value={amrapMmSs}
                onChange={(e) => setAmrapMmSs(e.target.value)}
              />
            </label>
            <label className="interval-field interval-field-full">
              <span>Nom (optionnel)</span>
              <input
                className="interval-text"
                type="text"
                maxLength={40}
                value={amrapName}
                onChange={(e) => setAmrapName(e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {mode === 'emom' ? (
          <div className="interval-builder-grid">
            <label className="interval-field">
              <span>Minutes</span>
              <SpinButton
                ariaLabel="Minutes EMOM"
                value={emomMin}
                min={1}
                max={60}
                suffix="min"
                onChange={setEmomMin}
              />
            </label>
          </div>
        ) : null}

        {mode === 'pyramid' ? (
          <div className="interval-builder-grid">
            <label className="interval-field">
              <span>Temps de base</span>
              <SpinButton
                ariaLabel="Base pyramide"
                value={py.baseSec}
                min={5}
                max={120}
                suffix="s"
                onChange={(baseSec) => setPy((s) => ({ ...s, baseSec }))}
              />
            </label>
            <label className="interval-field">
              <span>Incrément</span>
              <SpinButton
                ariaLabel="Incrément pyramide"
                value={py.incrementSec}
                min={0}
                max={60}
                suffix="s"
                onChange={(incrementSec) => setPy((s) => ({ ...s, incrementSec }))}
              />
            </label>
            <label className="interval-field">
              <span>Paliers</span>
              <SpinButton
                ariaLabel="Nombre de paliers"
                value={py.steps}
                min={2}
                max={20}
                onChange={(steps) => setPy((s) => ({ ...s, steps }))}
              />
            </label>
            <label className="interval-field">
              <span>Repos entre paliers</span>
              <SpinButton
                ariaLabel="Repos entre paliers"
                value={py.restBetweenSec}
                min={0}
                max={120}
                suffix="s"
                onChange={(restBetweenSec) => setPy((s) => ({ ...s, restBetweenSec }))}
              />
            </label>
            <div className="interval-field interval-field-full">
              <span className="interval-field-lbl">Progression</span>
              <div className="timer-subtabs timer-subtabs-sm">
                {(
                  [
                    { id: 'up' as const, label: 'Montée' },
                    { id: 'down' as const, label: 'Descente' },
                    { id: 'both' as const, label: 'Montée + descente' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`timer-subtab${py.direction === d.id ? ' timer-subtab-on' : ''}`}
                    onClick={() => setPy((s) => ({ ...s, direction: d.id }))}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <p className="interval-total mono">
          Durée totale estimée : {formatRest(totalSec)} ({formatMmSs(totalSec)})
        </p>

        <button type="button" className="interval-launch btn btn-primary" onClick={launch}>
          {mode === 'tabata'
            ? 'Lancer Tabata'
            : mode === 'hiit'
              ? 'Lancer HIIT'
              : mode === 'amrap'
                ? 'Lancer AMRAP'
                : mode === 'emom'
                  ? 'Lancer EMOM'
                  : 'Lancer Pyramide'}
        </button>
      </div>
    </div>
  )
}
