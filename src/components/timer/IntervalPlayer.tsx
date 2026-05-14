import type { MutableRefObject } from 'react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useIntervalTimer } from '../../hooks/useIntervalTimer'
import type { BuiltPhase, PhaseKind } from '../../types/timer'
import { formatMmSs } from '../../utils/formatMmSs'
import { formatRest } from '../../utils/formatRest'

export type IntervalPlayerProps = {
  phases: BuiltPhase[]
  onClose: () => void
  sonEnabled: boolean
  vibrationEnabled: boolean
  /** Pulse anneau 3 dernières secondes (travail vert, repos rouge). */
  flashEnabled: boolean
}

function playTone(acRef: MutableRefObject<AudioContext | null>, hz: number, ms: number) {
  try {
    let ac = acRef.current
    if (!ac) {
      ac = new AudioContext()
      acRef.current = ac
    }
    void ac.resume()
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.connect(g)
    g.connect(ac.destination)
    o.frequency.value = hz
    g.gain.value = 0.06
    o.start()
    o.stop(ac.currentTime + ms / 1000)
  } catch {
    /* */
  }
}

function phaseTitle(kind: PhaseKind | null, state: string): string {
  if (state === 'prepare') return 'PRÊT'
  if (!kind) return '—'
  if (kind === 'work') return 'TRAVAIL'
  if (kind === 'rest') return 'REPOS'
  return 'PRÉPARATION'
}

function ringStroke(kind: PhaseKind | null, state: string): string {
  if (state === 'prepare') return 'var(--blue-prepare, #60a5fa)'
  if (!kind) return 'var(--ac)'
  if (kind === 'work') return 'var(--green)'
  if (kind === 'rest') return 'var(--orange)'
  return 'var(--blue-prepare, #60a5fa)'
}

function workRoundLabel(phases: BuiltPhase[], phaseIndex: number, current: BuiltPhase | null): string {
  const totalW = phases.filter((p) => p.kind === 'work').length
  let wn = 0
  for (let i = 0; i < phaseIndex; i++) if (phases[i]?.kind === 'work') wn++
  if (current?.kind === 'work') wn += 1
  const tw = Math.max(1, totalW)
  return `${Math.min(wn, tw)} / ${tw}`
}

export function IntervalPlayer({ phases, onClose, sonEnabled, vibrationEnabled, flashEnabled }: IntervalPlayerProps) {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const prevPhaseIdx = useRef(-1)

  const hook = useIntervalTimer({
    sonEnabled,
    vibrationEnabled,
    audioCtxRef,
  })

  const { state, phaseIndex, timeLeftSec, currentPhase, startSequence, stop, pause, resume, skipPhase, prevPhase, elapsedSessionMs } =
    hook

  useEffect(() => {
    startSequence(phases)
    return () => {
      stop()
    }
    // Une séance = un montage contrôlé par la clé parente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const circumference = useMemo(() => 2 * Math.PI * 100, [])

  const phaseDuration = useMemo(() => {
    if (state === 'prepare') return 3
    return Math.max(1, currentPhase?.durationSec ?? 1)
  }, [state, currentPhase])

  const dashOffset = useMemo(() => {
    if (phaseDuration <= 0) return circumference
    return circumference * (1 - timeLeftSec / phaseDuration)
  }, [circumference, timeLeftSec, phaseDuration])

  const flashWork =
    flashEnabled && state === 'running' && timeLeftSec <= 3 && timeLeftSec > 0 && currentPhase?.kind === 'work'
  const flashRest =
    flashEnabled && state === 'running' && timeLeftSec <= 3 && timeLeftSec > 0 && currentPhase?.kind === 'rest'

  const kindForRing: PhaseKind | null = state === 'prepare' ? 'prepare' : currentPhase?.kind ?? null

  const handleStop = useCallback(() => {
    stop()
    onClose()
  }, [stop, onClose])

  useEffect(() => {
    if (state !== 'running' && state !== 'prepare') return
    if (phaseIndex === prevPhaseIdx.current) return
    prevPhaseIdx.current = phaseIndex
    const name = currentPhase?.name ?? ''
    const m = /^Minute (\d+)\//.exec(name)
    if (m && parseInt(m[1], 10) > 1) {
      playTone(audioCtxRef, 720, 90)
    }
  }, [state, phaseIndex, currentPhase])

  const roundTxt = useMemo(() => {
    if (state === 'prepare') return '—'
    return workRoundLabel(phases, phaseIndex, currentPhase)
  }, [phases, phaseIndex, currentPhase, state])

  const totalWork = phases.filter((p) => p.kind === 'work').length

  return (
    <div className="interval-player-root" role="dialog" aria-modal="true" aria-label="Lecteur d’intervalles">
      <div className="interval-player-inner">
        {state === 'complete' ? (
          <div className="interval-player-done">
            <p className="interval-player-done-title">Séance terminée ✓</p>
            <p className="interval-player-done-sub mono">
              Durée réelle : {formatRest(Math.max(0, Math.round(elapsedSessionMs / 1000)))}
            </p>
            <p className="interval-player-done-sub mono">
              Phases travail : {totalWork} — complétées : {totalWork}
            </p>
            <button type="button" className="btn btn-primary interval-player-done-btn" onClick={handleStop}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="interval-player-top">
              <span
                className={`interval-player-phase interval-player-phase-${kindForRing === null ? 'idle' : kindForRing}`}
              >
                {phaseTitle(kindForRing, state)}
              </span>
              <span className="interval-player-round mono">Round {roundTxt}</span>
            </div>

            <div
              className={`interval-player-ring t-ring${flashWork ? ' interval-player-ring-flash-work' : ''}${flashRest ? ' interval-player-ring-flash-rest' : ''}`}
            >
              <svg className="ring-svg" width={240} height={240} viewBox="0 0 220 220" aria-hidden>
                <circle className="ring-bg" cx={110} cy={110} r={100} />
                <circle
                  className="ring-fg interval-player-ring-fg"
                  cx={110}
                  cy={110}
                  r={100}
                  style={{
                    stroke: ringStroke(kindForRing, state),
                    strokeDasharray: circumference,
                    strokeDashoffset: dashOffset,
                  }}
                />
              </svg>
              <div className="t-center">
                <p className="t-disp t-disp-massive mono interval-player-time">{formatMmSs(timeLeftSec)}</p>
                {currentPhase?.name ? <p className="interval-player-name">{currentPhase.name}</p> : null}
              </div>
            </div>

            <div className="interval-player-nav">
              <button type="button" className="tc tc-side interval-player-nav-btn" onClick={prevPhase}>
                ◀ Phase
              </button>
              {state === 'paused' ? (
                <button type="button" className="tc tc-p" onClick={resume}>
                  Reprendre
                </button>
              ) : (
                <button type="button" className="tc tc-p" onClick={pause}>
                  Pause
                </button>
              )}
              <button type="button" className="tc tc-side interval-player-nav-btn" onClick={skipPhase}>
                Suivant ▶
              </button>
            </div>

            <button type="button" className="btn btn-secondary interval-player-stop" onClick={handleStop}>
              Arrêter la séance
            </button>
          </>
        )}
      </div>
    </div>
  )
}
