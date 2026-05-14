import { useEffect, useMemo, useRef, useState } from 'react'
import { REPOS_PRESETS_LAFAY } from '../../lib/lafayTimer'
import { formatRest } from '../../utils/formatRest'

type Props = {
  open: boolean
  seconds: number
  canOverride: boolean
  vibration: boolean
  sound: boolean
  onDone: () => void
  onSkip: () => void
  onOverride?: (s: number) => void
}

export function RestTimerSheet({ open, seconds, canOverride, vibration, sound, onDone, onSkip, onOverride }: Props) {
  const [remaining, setRemaining] = useState(seconds)
  const [total, setTotal] = useState(seconds)
  const [timerEpoch, setTimerEpoch] = useState(0)
  const triggered = useRef(false)
  const c = useMemo(() => 2 * Math.PI * 88, [])
  useEffect(() => {
    if (!open) return
    setRemaining(seconds)
    setTotal(seconds)
    triggered.current = false
    setTimerEpoch((e) => e + 1)
  }, [open, seconds])
  useEffect(() => {
    if (!open || timerEpoch <= 0) return
    const id = window.setInterval(() => {
      setRemaining((x) => (x <= 0 ? 0 : x - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [open, timerEpoch])
  useEffect(() => {
    if (!open || remaining !== 0 || triggered.current) return
    triggered.current = true
    if (vibration && navigator.vibrate) navigator.vibrate([300, 100, 300])
    if (sound && window.AudioContext) {
      try {
        const ac = new AudioContext()
        const osc = ac.createOscillator()
        const gain = ac.createGain()
        osc.connect(gain)
        gain.connect(ac.destination)
        osc.frequency.value = 720
        gain.gain.value = 0.06
        osc.start()
        osc.stop(ac.currentTime + 0.14)
      } catch {
        // ignore
      }
    }
    onDone()
  }, [open, remaining, vibration, sound, onDone])
  if (!open) return null
  const dash = total <= 0 ? c : c * (1 - remaining / total)
  return (
    <div className="repos-sheet-root" role="dialog" aria-modal="true" aria-label="Repos">
      <button type="button" className="repos-sheet-backdrop" onClick={onSkip} aria-label="Passer" />
      <div className="repos-sheet-panel">
        <div className="repos-sheet-handle" aria-hidden />
        <p className="eyebrow">Repos</p>
        <div className="repos-sheet-ring">
          <svg className="ring-svg" width={200} height={200} viewBox="0 0 200 200" aria-hidden>
            <circle className="ring-bg" cx={100} cy={100} r={88} />
            <circle className={`ring-fg${remaining <= 5 && remaining > 0 ? ' ring-fg-danger' : ''}`} cx={100} cy={100} r={88} style={{ strokeDasharray: c, strokeDashoffset: dash }} />
          </svg>
          <div className="repos-sheet-center">
            <p className={`repos-sheet-disp mono${remaining <= 5 && remaining > 0 ? ' danger' : ''}`}>{formatRest(remaining)}</p>
          </div>
        </div>
        {canOverride ? (
          <div className="t-presets-grid" style={{ marginTop: 8 }}>
            {REPOS_PRESETS_LAFAY.map((p) => (
              <button
                key={p.seconds}
                type="button"
                className={`tp mono${p.seconds === total ? ' on' : ''}`}
                onClick={() => {
                  setTotal(p.seconds)
                  setRemaining(p.seconds)
                  setTimerEpoch((e) => e + 1)
                  onOverride?.(p.seconds)
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        ) : null}
        <button type="button" className="btn btn-secondary" style={{ marginTop: 10 }} onClick={onSkip}>
          Passer le repos
        </button>
      </div>
    </div>
  )
}
