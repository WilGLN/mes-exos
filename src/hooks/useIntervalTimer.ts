import { useCallback, useEffect, useRef, useState } from 'react'
import type { BuiltPhase, IntervalTimerState } from '../types/timer'

type Props = {
  sonEnabled: boolean
  vibrationEnabled: boolean
  audioCtxRef: React.MutableRefObject<AudioContext | null>
}

function playTone(acRef: React.MutableRefObject<AudioContext | null>, hz: number, ms: number) {
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
    /* autoplay */
  }
}

/**
 * Préparation 3 s puis enchaînement des phases avec deadline (anti-dérive).
 * Pause / reprise : fige le temps restant.
 */
export function useIntervalTimer({ sonEnabled, vibrationEnabled, audioCtxRef }: Props) {
  const [state, setState] = useState<IntervalTimerState>('idle')
  const [phases, setPhases] = useState<BuiltPhase[]>([])
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [timeLeftSec, setTimeLeftSec] = useState(0)
  const [elapsedSessionMs, setElapsedSessionMs] = useState(0)

  const phasesRef = useRef<BuiltPhase[]>([])
  const phaseIndexRef = useRef(0)
  const modeRef = useRef<'prepare' | 'run' | 'idle'>('idle')
  const deadlineMsRef = useRef(0)
  const pausedRemainMsRef = useRef(0)
  const pausedModeRef = useRef<'prepare' | 'run'>('run')
  const [epoch, setEpoch] = useState(0)
  const lastBeepSecRef = useRef<number | null>(null)
  const lastVibeSecRef = useRef<number | null>(null)
  const sessionStartRef = useRef<number | null>(null)

  /**
   * Arrêt : coupe la deadline, réinitialise les repères bips / vibration.
   * Toute progression (phaseIndex, phases) est conservée en mémoire jusqu’au prochain startSequence.
   */
  const stop = useCallback(() => {
    modeRef.current = 'idle'
    deadlineMsRef.current = 0
    setState('idle')
    setTimeLeftSec(0)
    setEpoch(0)
    lastBeepSecRef.current = null
    lastVibeSecRef.current = null
    sessionStartRef.current = null
  }, [])

  /**
   * Passage à la phase d’index `idx` : nouvelle deadline = now + durée phase (temps réel).
   * Fin de séquence : idx >= list.length → état `complete`, bip de fin, vibration optionnelle.
   */
  const goRunPhase = useCallback(
    (idx: number) => {
      const list = phasesRef.current
      if (idx >= list.length) {
        modeRef.current = 'idle'
        setState('complete')
        setTimeLeftSec(0)
        if (sessionStartRef.current) setElapsedSessionMs(Date.now() - sessionStartRef.current)
        if (vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 80, 200])
        }
        if (sonEnabled) playTone(audioCtxRef, 660, 320)
        return
      }
      const p = list[idx]
      phaseIndexRef.current = idx
      setPhaseIndex(idx)
      modeRef.current = 'run'
      deadlineMsRef.current = Date.now() + p.durationSec * 1000
      setTimeLeftSec(p.durationSec)
      setState('running')
      lastBeepSecRef.current = null
      lastVibeSecRef.current = null
      setEpoch((e) => e + 1)
    },
    [audioCtxRef, sonEnabled, vibrationEnabled],
  )

  /**
   * Démarre une séquence : copie `list` dans phasesRef, prépare 3 s (deadline now+3000),
   * phaseIndex 0, état `prepare`. Le tick useEffect recalcule timeLeftSec depuis deadlineMsRef.
   */
  const startSequence = useCallback(
    (list: BuiltPhase[]) => {
      if (!list.length) return
      stop()
      phasesRef.current = list
      setPhases(list)
      setPhaseIndex(0)
      phaseIndexRef.current = 0
      modeRef.current = 'prepare'
      deadlineMsRef.current = Date.now() + 3000
      setTimeLeftSec(3)
      setState('prepare')
      setElapsedSessionMs(0)
      sessionStartRef.current = Date.now()
      lastBeepSecRef.current = null
      lastVibeSecRef.current = null
      setEpoch(1)
    },
    [stop],
  )

  const pause = useCallback(() => {
    if (state !== 'running' && state !== 'prepare') return
    pausedModeRef.current = modeRef.current === 'prepare' ? 'prepare' : 'run'
    const leftMs = Math.max(0, deadlineMsRef.current - Date.now())
    pausedRemainMsRef.current = leftMs
    deadlineMsRef.current = Number.MAX_SAFE_INTEGER
    setState('paused')
    setTimeLeftSec(Math.ceil(leftMs / 1000))
    setEpoch((e) => e + 1)
  }, [state])

  const resume = useCallback(() => {
    if (state !== 'paused') return
    deadlineMsRef.current = Date.now() + pausedRemainMsRef.current
    setState(pausedModeRef.current === 'prepare' ? 'prepare' : 'running')
    setEpoch((e) => e + 1)
  }, [state])

  const skipPhase = useCallback(() => {
    if (state === 'idle' || state === 'complete') return
    if (state === 'prepare') {
      goRunPhase(0)
      return
    }
    const cur = phasesRef.current[phaseIndexRef.current]
    if (sonEnabled) {
      if (cur?.kind === 'work') playTone(audioCtxRef, 330, 400)
      else playTone(audioCtxRef, 880, 200)
    }
    goRunPhase(phaseIndexRef.current + 1)
  }, [audioCtxRef, goRunPhase, sonEnabled, state])

  const prevPhase = useCallback(() => {
    if (state !== 'running' && state !== 'paused') return
    const p = phasesRef.current[phaseIndexRef.current]
    if (!p) return
    deadlineMsRef.current = Date.now() + p.durationSec * 1000
    pausedRemainMsRef.current = p.durationSec * 1000
    setTimeLeftSec(p.durationSec)
    setEpoch((e) => e + 1)
  }, [state])

  /**
   * Boucle ~110 ms : lit Date.now() vs deadlineMsRef pour limiter la dérive (pas un simple −1 s / s).
   * Préparation 3 s → puis enchaînement phases ; fin de phase : bips selon kind, puis goRunPhase suivant.
   */
  useEffect(() => {
    if (state !== 'running' && state !== 'prepare') return
    const id = window.setInterval(() => {
      const now = Date.now()
      const leftMs = Math.max(0, deadlineMsRef.current - now)
      const left = Math.ceil(leftMs / 1000)
      setTimeLeftSec(left)

      if (modeRef.current === 'prepare') {
        if (left > 0 && sonEnabled && lastBeepSecRef.current !== left && left <= 3) {
          lastBeepSecRef.current = left
          playTone(audioCtxRef, 520 + left * 40, 70)
        }
        if (left <= 0) {
          lastBeepSecRef.current = null
          goRunPhase(0)
        }
        return
      }

      if (modeRef.current === 'run') {
        const cur = phasesRef.current[phaseIndexRef.current]
        if (cur && sonEnabled && left > 0 && left <= 5) {
          if (lastBeepSecRef.current !== left) {
            lastBeepSecRef.current = left
            playTone(audioCtxRef, left === 1 ? 660 : 440, left === 1 ? 120 : 70)
          }
        }
        if (vibrationEnabled && left > 0 && left <= 3 && typeof navigator !== 'undefined' && navigator.vibrate) {
          if (lastVibeSecRef.current !== left) {
            lastVibeSecRef.current = left
            navigator.vibrate(left === 1 ? [60, 40, 60] : 55)
          }
        }
        if (left <= 0) {
          lastBeepSecRef.current = null
          lastVibeSecRef.current = null
          const kind = cur?.kind
          if (sonEnabled) {
            if (kind === 'work') playTone(audioCtxRef, 330, 400)
            else playTone(audioCtxRef, 880, 200)
          }
          goRunPhase(phaseIndexRef.current + 1)
        }
      }
    }, 110)
    return () => window.clearInterval(id)
  }, [state, epoch, goRunPhase, sonEnabled, vibrationEnabled, audioCtxRef])

  const currentPhase = phases[phaseIndex] ?? null

  return {
    state,
    phases,
    phaseIndex,
    timeLeftSec,
    currentPhase,
    elapsedSessionMs,
    startSequence,
    stop,
    pause,
    resume,
    skipPhase,
    prevPhase,
  }
}
