import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  estOuvert: boolean
  seconds: number
  prochaineSérieLabel: string
  /** Préférences minuterie (son / vibration fin de repos) */
  sonFin?: boolean
  vibration?: boolean
  surTerminaison: () => void
  surIgnorer: () => void
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function MinuterieReposSheet({
  estOuvert,
  seconds,
  prochaineSérieLabel,
  sonFin = true,
  vibration = true,
  surTerminaison,
  surIgnorer,
}: Props) {
  const [total, setTotal] = useState(seconds)
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(true)
  const warnedRef = useRef(false)
  const endedRef = useRef(false)

  const circumference = useMemo(() => 2 * Math.PI * 88, [])

  useEffect(() => {
    if (!estOuvert) return
    setTotal(seconds)
    setRemaining(seconds)
    setRunning(true)
    warnedRef.current = false
    endedRef.current = false
  }, [estOuvert, seconds])

  useEffect(() => {
    if (!estOuvert || !running) return
    const id = window.setInterval(() => {
      setRemaining((r) => (r <= 0 ? 0 : r - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [estOuvert, running])

  useEffect(() => {
    if (!estOuvert || remaining > 5 || remaining <= 0) {
      if (remaining > 5) warnedRef.current = false
      return
    }
    if (!warnedRef.current && vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
      warnedRef.current = true
      navigator.vibrate(200)
    }
  }, [estOuvert, remaining, vibration])

  useEffect(() => {
    if (!estOuvert || remaining !== 0 || endedRef.current) return
    endedRef.current = true
    setRunning(false)
    if (vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 100, 300])
    }
    if (sonFin && typeof window !== 'undefined' && window.AudioContext) {
      try {
        const ctx = new AudioContext()
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.connect(g)
        g.connect(ctx.destination)
        o.frequency.value = 880
        g.gain.value = 0.06
        o.start()
        o.stop(ctx.currentTime + 0.12)
        void ctx.resume().catch(() => {})
      } catch {
        /* ignore */
      }
    }
    window.setTimeout(() => surTerminaison(), 0)
  }, [estOuvert, remaining, sonFin, vibration, surTerminaison])

  const dashOffset = useMemo(() => {
    if (total <= 0) return circumference
    return circumference * (1 - remaining / total)
  }, [circumference, remaining, total])

  if (!estOuvert) return null

  const danger = remaining <= 5 && remaining > 0

  return (
    <div className="repos-sheet-root" role="dialog" aria-modal="true" aria-label="Repos">
      <button type="button" className="repos-sheet-backdrop" onClick={surIgnorer} aria-label="Fermer" />
      <div className="repos-sheet-panel">
        <div className="repos-sheet-handle" aria-hidden />
        <p className="repos-sheet-eyebrow">Repos</p>
        <div className="repos-sheet-ring">
          <svg className="ring-svg" width={200} height={200} viewBox="0 0 200 200" aria-hidden>
            <circle className="ring-bg" cx={100} cy={100} r={88} />
            <circle
              className={`ring-fg${danger ? ' ring-fg-danger' : ''}`}
              cx={100}
              cy={100}
              r={88}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: dashOffset,
              }}
            />
          </svg>
          <div className="repos-sheet-center">
            <p className={`repos-sheet-disp mono${danger ? ' danger' : ''}`}>{fmtTime(remaining)}</p>
            <p className="repos-sheet-sub mono">/ {fmtTime(total)}</p>
          </div>
        </div>
        <p className="repos-sheet-next-lbl">Prochaine série</p>
        <p className="repos-sheet-next">{prochaineSérieLabel}</p>
        <p className="repos-sheet-hint mono">« +10 s » pour prolonger ; micro-pause en série : 3–5 s max bras tendus.</p>
        <div className="repos-sheet-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setRemaining((r) => r + 10)}>
            +10 s
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setRunning((x) => !x)}>
            {running ? 'Pause' : 'Reprendre'}
          </button>
          <button type="button" className="btn btn-accent-outline" onClick={surIgnorer}>
            Ignorer
          </button>
        </div>
      </div>
    </div>
  )
}
