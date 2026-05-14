import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CITATION_REPOS_LAFAY,
  DEFAULT_REPOS_SECONDS,
  NOTE_MICRO_PAUSE,
  REPOS_PRESETS_LAFAY,
} from '../../lib/lafayTimer'
import { fetchProfileWithPreferences, type TimerPreferences } from '../../lib/catalog'
import { supabase } from '../../lib/supabase'
import { formatMmSs, parseMmSsLoose } from '../../utils/formatMmSs'

const FLASH_LS = 'lafay_timer_ring_flash'
const PAUSE_OPTS = [0, 5, 10, 15] as const

function readFlashPref(): boolean {
  try {
    const v = localStorage.getItem(FLASH_LS)
    if (v === null) return true
    return v === '1'
  } catch {
    return true
  }
}

function playTone(ac: AudioContext | null, hz: number, ms: number) {
  if (!ac) return
  try {
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

export type SimpleTimerProps = {
  /** Préférences déjà chargées (optionnel) — sinon chargement interne. */
  prefsProp?: TimerPreferences | null
}

export function SimpleTimer({ prefsProp }: SimpleTimerProps) {
  const [prefs, setPrefs] = useState<TimerPreferences | null>(prefsProp ?? null)
  const [totalWorkSec, setTotalWorkSec] = useState(DEFAULT_REPOS_SECONDS)
  const [segmentTotalSec, setSegmentTotalSec] = useState(DEFAULT_REPOS_SECONDS)
  const [remainingSec, setRemainingSec] = useState(DEFAULT_REPOS_SECONDS)
  const [segment, setSegment] = useState<'work' | 'between'>('work')
  const [running, setRunning] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(1)
  const [pauseBetweenSec, setPauseBetweenSec] = useState<number>(0)
  const [customMmSs, setCustomMmSs] = useState('02:30')
  const [ringFlash, setRingFlash] = useState(readFlashPref)
  const [epoch, setEpoch] = useState(0)

  const audioRef = useRef<AudioContext | null>(null)
  const deadlineMsRef = useRef(0)
  const pausedRemainMsRef = useRef(0)
  const lastBeepSecRef = useRef<number | null>(null)
  const lastVibeSecRef = useRef<number | null>(null)
  const endedRoundRef = useRef(false)
  const wakeRef = useRef<WakeLockSentinel | null>(null)

  const vibrationOn = prefs?.vibration !== false
  const sonOn = prefs?.son_fin !== false

  const circumference = useMemo(() => 2 * Math.PI * 100, [])

  useEffect(() => {
    if (prefsProp !== undefined) {
      setPrefs(prefsProp ?? null)
    }
    if (prefsProp !== undefined) return

    let cancelled = false
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return
      void fetchProfileWithPreferences(user.id).then(({ data }) => {
        if (cancelled || !data) return
        const p = data.preferences ?? {}
        setPrefs(p)
        const def = typeof p.repos_defaut_secondes === 'number' ? p.repos_defaut_secondes : DEFAULT_REPOS_SECONDS
        const valid = REPOS_PRESETS_LAFAY.some((x) => x.seconds === def) ? def : DEFAULT_REPOS_SECONDS
        setTotalWorkSec(valid)
        setSegmentTotalSec(valid)
        setRemainingSec(valid)
      })
    })
    return () => {
      cancelled = true
    }
  }, [prefsProp])

  useEffect(() => {
    try {
      localStorage.setItem(FLASH_LS, ringFlash ? '1' : '0')
    } catch {
      /* */
    }
  }, [ringFlash])

  const ensureAudio = useCallback(() => {
    if (typeof window === 'undefined' || !window.AudioContext) return null
    if (!audioRef.current) audioRef.current = new AudioContext()
    return audioRef.current
  }, [])

  useEffect(() => {
    if (!running) {
      void wakeRef.current?.release().catch(() => {})
      wakeRef.current = null
      return
    }
    const nav = typeof navigator !== 'undefined' ? navigator : null
    if (!nav || !('wakeLock' in nav)) return
    const wl = nav as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinel> } }
    void wl.wakeLock
      ?.request('screen')
      .then((l) => {
        wakeRef.current = l
      })
      .catch(() => {})
    return () => {
      void wakeRef.current?.release().catch(() => {})
      wakeRef.current = null
    }
  }, [running])

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      const now = Date.now()
      const leftMs = Math.max(0, deadlineMsRef.current - now)
      const left = Math.ceil(leftMs / 1000)
      setRemainingSec(left)

      if (sonOn && segment === 'work' && left > 0 && left <= 5) {
        if (lastBeepSecRef.current !== left) {
          lastBeepSecRef.current = left
          const ac = ensureAudio()
          playTone(ac, left === 1 ? 660 : 440, left === 1 ? 300 : 80)
        }
      }

      if (vibrationOn && segment === 'work' && left > 0 && left <= 3 && typeof navigator !== 'undefined' && navigator.vibrate) {
        if (lastVibeSecRef.current !== left) {
          lastVibeSecRef.current = left
          navigator.vibrate(left === 1 ? [80, 50, 80] : 60)
        }
      }

      if (left > 0) return

      lastBeepSecRef.current = null
      lastVibeSecRef.current = null

      if (segment === 'between') {
        const nextR = currentRound + 1
        setCurrentRound(nextR)
        setSegment('work')
        setSegmentTotalSec(totalWorkSec)
        deadlineMsRef.current = Date.now() + totalWorkSec * 1000
        setRemainingSec(totalWorkSec)
        endedRoundRef.current = false
        setEpoch((e) => e + 1)
        return
      }

      if (endedRoundRef.current) return
      endedRoundRef.current = true

      if (sonOn) {
        const ac = ensureAudio()
        playTone(ac, 660, 200)
      }
      if (vibrationOn && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([280, 100, 280])
      }

      if (currentRound < totalRounds) {
        if (pauseBetweenSec > 0) {
          setSegment('between')
          setSegmentTotalSec(pauseBetweenSec)
          deadlineMsRef.current = Date.now() + pauseBetweenSec * 1000
          setRemainingSec(pauseBetweenSec)
          endedRoundRef.current = false
        } else {
          const nextR = currentRound + 1
          setCurrentRound(nextR)
          setSegmentTotalSec(totalWorkSec)
          deadlineMsRef.current = Date.now() + totalWorkSec * 1000
          setRemainingSec(totalWorkSec)
          endedRoundRef.current = false
        }
        setEpoch((e) => e + 1)
      } else {
        setRunning(false)
      }
    }, 110)
    return () => window.clearInterval(id)
  }, [
    running,
    epoch,
    segment,
    currentRound,
    totalRounds,
    pauseBetweenSec,
    totalWorkSec,
    sonOn,
    vibrationOn,
    ensureAudio,
  ])

  const dashOffset = useMemo(() => {
    if (segmentTotalSec <= 0) return circumference
    return circumference * (1 - remainingSec / segmentTotalSec)
  }, [circumference, remainingSec, segmentTotalSec])

  function startDeadline(sec: number) {
    deadlineMsRef.current = Date.now() + sec * 1000
    lastBeepSecRef.current = null
    lastVibeSecRef.current = null
    endedRoundRef.current = false
    setEpoch((e) => e + 1)
  }

  function applyPreset(sec: number) {
    setTotalWorkSec(sec)
    setSegment('work')
    setSegmentTotalSec(sec)
    setRemainingSec(sec)
    setCurrentRound(1)
    setRunning(true)
    startDeadline(sec)
    ensureAudio()
  }

  function applyCustomFromField() {
    const sec = parseMmSsLoose(customMmSs)
    if (sec === null || sec < 1) return
    setCustomMmSs(formatMmSs(sec))
    applyPreset(Math.min(sec, 3600))
  }

  function toggle() {
    setRunning((prev) => {
      if (prev) {
        const leftMs = Math.max(0, deadlineMsRef.current - Date.now())
        pausedRemainMsRef.current = leftMs
        deadlineMsRef.current = Number.MAX_SAFE_INTEGER
        return false
      }
      if (remainingSec <= 0) return false
      const leftMs = pausedRemainMsRef.current > 0 ? pausedRemainMsRef.current : remainingSec * 1000
      deadlineMsRef.current = Date.now() + leftMs
      pausedRemainMsRef.current = 0
      lastBeepSecRef.current = null
      lastVibeSecRef.current = null
      setEpoch((e) => e + 1)
      ensureAudio()
      return true
    })
  }

  function reset() {
    setSegment('work')
    setSegmentTotalSec(totalWorkSec)
    setRemainingSec(totalWorkSec)
    setCurrentRound(1)
    setRunning(true)
    startDeadline(totalWorkSec)
    ensureAudio()
  }

  function addSeconds(n: number) {
    if (!running) {
      const cap = 3600
      const next = Math.min(remainingSec + n, cap)
      setRemainingSec(next)
      if (segment === 'work') setSegmentTotalSec(Math.max(segmentTotalSec, next))
      return
    }
    const cap = 3600
    const addMs = n * 1000
    deadlineMsRef.current = Math.min(Date.now() + cap * 1000, deadlineMsRef.current + addMs)
    if (segment === 'work') setSegmentTotalSec(Math.min(cap, segmentTotalSec + n))
    setEpoch((e) => e + 1)
  }

  const dangerFlash =
    ringFlash && segment === 'work' && remainingSec <= 3 && remainingSec > 0 && running
  const dangerText = remainingSec <= 5 && remainingSec > 0 && running && segment === 'work'

  const phaseLabel = segment === 'between' ? 'Pause entre tours' : 'Temps de repos'

  return (
    <div className="simple-timer">
      <Link className="t-back" to="/session">
        <span aria-hidden>←</span>
        <span>Retour à la séance</span>
      </Link>

      <div className="t-big">
        <p className="t-phase">{phaseLabel}</p>
        {totalRounds > 1 ? (
          <p className="simple-timer-round mono">
            {segment === 'between'
              ? `Pause — tour ${currentRound + 1} / ${totalRounds}`
              : `Tour ${currentRound} / ${totalRounds}`}
          </p>
        ) : null}
        <div className={`t-ring${dangerFlash ? ' t-ring-flash' : ''}`}>
          <svg className="ring-svg" width={220} height={220} viewBox="0 0 220 220" aria-hidden>
            <circle className="ring-bg" cx={110} cy={110} r={100} />
            <circle
              className={`ring-fg${dangerText ? ' ring-fg-danger' : ''}`}
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
            <p className={`t-disp t-disp-massive mono${dangerText ? ' t-disp-danger' : ''}`}>{formatMmSs(remainingSec)}</p>
            <p className="t-sub mono">/ {formatMmSs(segmentTotalSec)}</p>
          </div>
        </div>
      </div>

      <div className="timer-presets-row" aria-label="Durées Lafay">
        {REPOS_PRESETS_LAFAY.map((p) => (
          <button
            key={p.seconds}
            type="button"
            className={`tp mono${totalWorkSec === p.seconds && segment === 'work' ? ' on' : ''}`}
            title={p.description}
            onClick={() => applyPreset(p.seconds)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="simple-timer-perso">
        <span className="simple-timer-perso-lbl">Perso</span>
        <input
          className="simple-timer-perso-input mono"
          type="text"
          inputMode="numeric"
          placeholder="mm:ss"
          value={customMmSs}
          onChange={(e) => setCustomMmSs(e.target.value)}
          onBlur={applyCustomFromField}
          aria-label="Durée personnalisée mm:ss"
        />
        <button type="button" className="simple-timer-perso-go" onClick={applyCustomFromField}>
          OK
        </button>
      </div>

      <div className="simple-timer-multi">
        <label className="simple-timer-multi-lbl">
          <span>× N tours</span>
          <input
            className="simple-timer-multi-input mono"
            type="number"
            min={1}
            max={20}
            value={totalRounds}
            onChange={(e) => setTotalRounds(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
          />
        </label>
        <label className="simple-timer-multi-lbl">
          <span>Pause entre tours</span>
          <select
            className="simple-timer-multi-select"
            value={pauseBetweenSec}
            onChange={(e) => setPauseBetweenSec(Number(e.target.value))}
          >
            {PAUSE_OPTS.map((s) => (
              <option key={s} value={s}>
                {s === 0 ? '0 s' : `${s} s`}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="simple-timer-flash">
        <input type="checkbox" checked={ringFlash} onChange={(e) => setRingFlash(e.target.checked)} />
        <span>Pulse rouge sur les 3 dernières secondes</span>
      </label>

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
        <button type="button" className="tc tc-side mono" onClick={() => addSeconds(30)}>
          +30 s
        </button>
        <button type="button" className="tc tc-p" onClick={toggle}>
          {running ? 'Pause' : 'Reprendre'}
        </button>
      </div>
      <div className="t-ctrls-row simple-timer-reset-row">
        <button type="button" className="tc tc-side tc-wide" onClick={reset}>
          Réinitialiser
        </button>
      </div>

      <div className="card t-next">
        <p className="t-next-lbl">Réglages</p>
        <p className="t-next-nm">Son, vibration : page Paramètres</p>
        <p className="t-next-sub mono">Repos par défaut profil : {prefs?.repos_defaut_secondes ?? DEFAULT_REPOS_SECONDS} s</p>
      </div>
    </div>
  )
}
