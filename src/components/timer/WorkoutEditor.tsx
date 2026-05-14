import { useMemo, useState } from 'react'
import type { CustomPhase, PyramidDirection, TimerWorkout, TimerWorkoutConfig, TimerWorkoutType } from '../../types/timer'
import { estimateTotalSeconds } from '../../utils/buildIntervalPhases'
import { formatMmSs, parseMmSsLoose } from '../../utils/formatMmSs'
import { formatRest } from '../../utils/formatRest'
import { CustomPhaseEditor } from './CustomPhaseEditor'
import { SpinButton } from './SpinButton'

export type WorkoutEditorProps = {
  initial: TimerWorkout | null
  onClose: () => void
  onSave: (w: TimerWorkout) => void
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `tw-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function defaultCustomPhases(): CustomPhase[] {
  return [
    {
      id: newId(),
      name: 'Préparation',
      duration: 10,
      type: 'prepare',
    },
    { id: newId(), name: 'Travail', duration: 30, type: 'work' },
    { id: newId(), name: 'Repos', duration: 15, type: 'rest' },
  ]
}

function configFromWorkout(w: TimerWorkout): TimerWorkoutConfig {
  return w.config
}

export function WorkoutEditor({ initial, onClose, onSave }: WorkoutEditorProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [wtype, setWtype] = useState<TimerWorkoutType>(initial?.type ?? 'tabata')

  const ic = initial ? configFromWorkout(initial) : null

  const [tabata, setTabata] = useState(
    ic?.type === 'tabata' ? ic.tabata : { workSec: 20, restSec: 10, rounds: 8 },
  )
  const [hiit, setHiit] = useState(
    ic?.type === 'hiit' ? { ...ic.hiit, name: ic.hiit.name ?? '' } : { workSec: 40, restSec: 20, cycles: 8, name: '' },
  )
  const [amrapMmSs, setAmrapMmSs] = useState(
    ic?.type === 'amrap' ? formatMmSs(ic.amrap.totalSec) : '12:00',
  )
  const [amrapName, setAmrapName] = useState(ic?.type === 'amrap' ? (ic.amrap.name ?? '') : '')
  const [emomMin, setEmomMin] = useState(ic?.type === 'emom' ? ic.emom.minutes : 10)
  const [py, setPy] = useState(
    ic?.type === 'pyramid'
      ? ic.pyramid
      : { baseSec: 20, incrementSec: 10, steps: 5, direction: 'both' as PyramidDirection, restBetweenSec: 15 },
  )
  const [customPhases, setCustomPhases] = useState<CustomPhase[]>(
    ic?.type === 'custom' && ic.custom.phases.length ? ic.custom.phases : defaultCustomPhases(),
  )
  const [customRepeat, setCustomRepeat] = useState(ic?.type === 'custom' ? ic.custom.repeat : 1)
  const [customPauseRep, setCustomPauseRep] = useState(
    ic?.type === 'custom' ? (ic.custom.pauseBetweenRepeatsSec ?? 0) : 0,
  )

  const config: TimerWorkoutConfig | null = useMemo(() => {
    switch (wtype) {
      case 'tabata':
        return { type: 'tabata', tabata: { ...tabata } }
      case 'hiit':
        return { type: 'hiit', hiit: { ...hiit, name: hiit.name.trim() || undefined } }
      case 'amrap': {
        const sec = parseMmSsLoose(amrapMmSs) ?? 60
        return { type: 'amrap', amrap: { totalSec: Math.max(1, sec), name: amrapName.trim() || undefined } }
      }
      case 'emom':
        return { type: 'emom', emom: { minutes: emomMin } }
      case 'pyramid':
        return { type: 'pyramid', pyramid: { ...py } }
      case 'custom':
        return {
          type: 'custom',
          custom: {
            phases: customPhases,
            repeat: Math.max(1, Math.min(20, customRepeat)),
            pauseBetweenRepeatsSec: Math.max(0, Math.min(120, customPauseRep)),
          },
        }
      default:
        return null
    }
  }, [wtype, tabata, hiit, amrapMmSs, amrapName, emomMin, py, customPhases, customRepeat, customPauseRep])

  const totalSec = config ? estimateTotalSeconds(config) : 0
  const cycleSec =
    wtype === 'custom' && config?.type === 'custom'
      ? estimateTotalSeconds({ type: 'custom', custom: { ...config.custom, repeat: 1 } })
      : totalSec
  const cycles = wtype === 'custom' && config?.type === 'custom' ? config.custom.repeat : 1

  function submit() {
    if (!config) return
    const now = new Date().toISOString()
    const w: TimerWorkout = {
      id: initial?.id ?? newId(),
      name: name.trim() || 'Sans nom',
      type: wtype,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      config,
    }
    onSave(w)
    onClose()
  }

  const types: { id: TimerWorkoutType; label: string }[] = [
    { id: 'tabata', label: 'Tabata' },
    { id: 'hiit', label: 'HIIT' },
    { id: 'amrap', label: 'AMRAP' },
    { id: 'emom', label: 'EMOM' },
    { id: 'pyramid', label: 'Pyramide' },
    { id: 'custom', label: 'Personnalisé' },
  ]

  return (
    <div className="workout-editor-root" role="dialog" aria-modal="true" aria-label="Éditeur de séance">
      <div className="workout-editor-panel card">
        <div className="workout-editor-head">
          <h2 className="workout-editor-title">{initial ? 'Modifier la séance' : 'Nouvelle séance'}</h2>
          <button type="button" className="workout-editor-x" aria-label="Fermer" onClick={onClose}>
            ×
          </button>
        </div>

        <label className="interval-field interval-field-full">
          <span>Nom</span>
          <input className="interval-text" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </label>

        <div className="timer-subtabs timer-subtabs-wrap" role="tablist" aria-label="Type de séance">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className={`timer-subtab${wtype === t.id ? ' timer-subtab-on' : ''}`}
              onClick={() => setWtype(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {wtype === 'tabata' ? (
          <div className="interval-builder-grid">
            <label className="interval-field">
              <span>Travail</span>
              <SpinButton
                ariaLabel="Travail tabata"
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
                ariaLabel="Repos tabata"
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
                ariaLabel="Rounds tabata"
                value={tabata.rounds}
                min={1}
                max={30}
                onChange={(rounds) => setTabata((s) => ({ ...s, rounds }))}
              />
            </label>
          </div>
        ) : null}

        {wtype === 'hiit' ? (
          <div className="interval-builder-grid">
            <label className="interval-field interval-field-full">
              <span>Nom (optionnel)</span>
              <input
                className="interval-text"
                type="text"
                value={hiit.name}
                maxLength={40}
                onChange={(e) => setHiit((s) => ({ ...s, name: e.target.value }))}
              />
            </label>
            <label className="interval-field">
              <span>Travail</span>
              <SpinButton
                ariaLabel="Travail hiit"
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
                ariaLabel="Repos hiit"
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
                ariaLabel="Cycles hiit"
                value={hiit.cycles}
                min={1}
                max={40}
                onChange={(cycles) => setHiit((s) => ({ ...s, cycles }))}
              />
            </label>
          </div>
        ) : null}

        {wtype === 'amrap' ? (
          <div className="interval-builder-grid">
            <label className="interval-field interval-field-full">
              <span>Durée (mm:ss)</span>
              <input className="interval-text mono" type="text" value={amrapMmSs} onChange={(e) => setAmrapMmSs(e.target.value)} />
            </label>
            <label className="interval-field interval-field-full">
              <span>Nom (optionnel)</span>
              <input className="interval-text" type="text" value={amrapName} onChange={(e) => setAmrapName(e.target.value)} />
            </label>
          </div>
        ) : null}

        {wtype === 'emom' ? (
          <div className="interval-builder-grid">
            <label className="interval-field">
              <span>Minutes</span>
              <SpinButton ariaLabel="Minutes emom" value={emomMin} min={1} max={60} suffix="min" onChange={setEmomMin} />
            </label>
          </div>
        ) : null}

        {wtype === 'pyramid' ? (
          <div className="interval-builder-grid">
            <label className="interval-field">
              <span>Base</span>
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
                ariaLabel="Incrément"
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
                ariaLabel="Paliers"
                value={py.steps}
                min={2}
                max={20}
                onChange={(steps) => setPy((s) => ({ ...s, steps }))}
              />
            </label>
            <label className="interval-field">
              <span>Repos</span>
              <SpinButton
                ariaLabel="Repos pyramide"
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

        {wtype === 'custom' ? (
          <>
            <CustomPhaseEditor phases={customPhases} onChange={setCustomPhases} />
            <div className="interval-builder-grid">
              <label className="interval-field">
                <span>Répéter</span>
                <SpinButton
                  ariaLabel="Répétitions séquence"
                  value={customRepeat}
                  min={1}
                  max={20}
                  onChange={setCustomRepeat}
                />
              </label>
              <label className="interval-field">
                <span>Pause entre cycles</span>
                <SpinButton
                  ariaLabel="Pause entre cycles"
                  value={customPauseRep}
                  min={0}
                  max={120}
                  suffix="s"
                  onChange={setCustomPauseRep}
                />
              </label>
            </div>
          </>
        ) : null}

        <p className="interval-total mono">
          Durée totale : {formatRest(cycleSec)} ({formatMmSs(cycleSec)})
          {cycles > 1 ? ` — × ${cycles} cycles = ${formatRest(totalSec)} (${formatMmSs(totalSec)})` : null}
        </p>

        <div className="workout-editor-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}
