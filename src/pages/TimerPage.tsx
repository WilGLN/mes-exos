import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CITATION_REPOS_LAFAY,
  DEFAULT_REPOS_SECONDS,
  NOTE_MICRO_PAUSE,
  REPOS_PRESETS_LAFAY,
} from '../lib/lafayTimer'
import { fetchProfileWithPreferences, type TimerPreferences } from '../lib/catalog'
import { supabase } from '../lib/supabase'

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function TimerPage() {
  const [prefs, setPrefs] = useState<TimerPreferences | null>(null)
  const [total, setTotal] = useState(DEFAULT_REPOS_SECONDS)
  const [remaining, setRemaining] = useState(DEFAULT_REPOS_SECONDS)
  const [running, setRunning] = useState(false)
  const warnedRef = useRef(false)
  const endedBeepRef = useRef(false)

  const circumference = useMemo(() => 2 * Math.PI * 100, [])

  const vibrationOn = prefs?.vibration !== false
  const sonOn = prefs?.son_fin !== false

  useEffect(() => {
    let cancelled = false
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return
      void fetchProfileWithPreferences(user.id).then(({ data }) => {
        if (cancelled || !data) return
        const p = data.preferences ?? {}
        setPrefs(p)
        const def = typeof p.repos_defaut_secondes === 'number' ? p.repos_defaut_secondes : DEFAULT_REPOS_SECONDS
        const valid = REPOS_PRESETS_LAFAY.some((x) => x.seconds === def) ? def : DEFAULT_REPOS_SECONDS
        setTotal(valid)
        setRemaining(valid)
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const dashOffset = useMemo(() => {
    if (total <= 0) return circumference
    return circumference * (1 - remaining / total)
  }, [circumference, remaining, total])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setRemaining((r) => (r <= 0 ? 0 : r - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, total])

  useEffect(() => {
    if (remaining <= 0) setRunning(false)
  }, [remaining])

  useEffect(() => {
    if (remaining > 5 || remaining <= 0 || !running) {
      if (remaining > 5) warnedRef.current = false
      return
    }
    if (!warnedRef.current && vibrationOn && typeof navigator !== 'undefined' && navigator.vibrate) {
      warnedRef.current = true
      navigator.vibrate(200)
    }
  }, [remaining, running, vibrationOn])

  const playEndBeep = useCallback(() => {
    if (!sonOn || typeof window === 'undefined' || !window.AudioContext) return
    try {
      const ctx = new AudioContext()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.frequency.value = 660
      g.gain.value = 0.07
      o.start()
      o.stop(ctx.currentTime + 0.15)
      void ctx.resume().catch(() => {})
    } catch {
      /* ignore */
    }
  }, [sonOn])

  useEffect(() => {
    if (remaining !== 0 || endedBeepRef.current) return
    endedBeepRef.current = true
    if (vibrationOn && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([300, 100, 300])
    }
    playEndBeep()
  }, [remaining, vibrationOn, playEndBeep])

  useEffect(() => {
    if (remaining > 0) endedBeepRef.current = false
  }, [remaining])

  function setPreset(sec: number) {
    setTotal(sec)
    setRemaining(sec)
    setRunning(true)
    warnedRef.current = false
    endedBeepRef.current = false
  }

  function toggle() {
    setRunning((prev) => {
      if (!prev && remaining <= 0) return false
      return !prev
    })
  }

  function reset() {
    setRemaining(total)
    setRunning(true)
    warnedRef.current = false
    endedBeepRef.current = false
  }

  function addSeconds(n: number) {
    setRemaining((r) => Math.min(r + n, 600))
  }

  const danger = remaining <= 5 && remaining > 0

  return (
    <div className="page-pad page-timer">
      <Link className="t-back" to="/session">
        <span aria-hidden>←</span>
        <span>Retour à la séance</span>
      </Link>

      <div className="t-big">
        <p className="t-phase">Temps de repos</p>
        <div className="t-ring">
          <svg className="ring-svg" width={220} height={220} viewBox="0 0 220 220" aria-hidden>
            <circle className="ring-bg" cx={110} cy={110} r={100} />
            <circle
              className={`ring-fg${danger ? ' ring-fg-danger' : ''}`}
              cx={110}
              cy={110}
              r={100}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: dashOffset,
              }}
            />
          </svg>
          <div className="t-center">
            <p className={`t-disp t-disp-massive mono${danger ? ' t-disp-danger' : ''}`}>{fmtTime(remaining)}</p>
            <p className="t-sub mono">/ {fmtTime(total)}</p>
          </div>
        </div>
      </div>

      <div className="t-presets-grid">
        {REPOS_PRESETS_LAFAY.map((p) => (
          <button
            key={p.seconds}
            type="button"
            className={`tp mono${total === p.seconds ? ' on' : ''}`}
            title={p.description}
            onClick={() => setPreset(p.seconds)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="t-citation">{CITATION_REPOS_LAFAY}</p>
      <p className="t-micro-hint">
        {NOTE_MICRO_PAUSE}{' '}
        <button type="button" className="t-micro-plus mono" onClick={() => addSeconds(5)}>
          +5 s
        </button>
      </p>

      <div className="t-ctrls-row">
        <button type="button" className="tc tc-side mono" onClick={() => addSeconds(10)}>
          +10 s
        </button>
        <button type="button" className="tc tc-p" onClick={toggle}>
          {running ? 'Pause' : 'Reprendre'}
        </button>
        <button type="button" className="tc tc-side" onClick={reset}>
          Réinitialiser
        </button>
      </div>

      <div className="card t-next">
        <p className="t-next-lbl">Réglages</p>
        <p className="t-next-nm">Son, vibration et démarrage auto : page Paramètres</p>
        <p className="t-next-sub mono">Repos par défaut : {prefs?.repos_defaut_secondes ?? DEFAULT_REPOS_SECONDS} s</p>
      </div>
    </div>
  )
}
