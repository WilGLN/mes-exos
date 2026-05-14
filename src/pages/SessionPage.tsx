import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ExerciseCard } from '../components/session/ExerciseCard'
import { ExerciseTransition } from '../components/session/ExerciseTransition'
import { RepsInputSheet } from '../components/session/RepsInputSheet'
import { SetProgressList } from '../components/session/SetProgressList'
import { WorkoutHeader } from '../components/session/WorkoutHeader'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_REPOS_SECONDS, fetchProfileWithPreferences } from '../lib/catalog'
import { abandonWorkout } from '../lib/workoutSession'
import { useWorkoutSession } from '../hooks/useWorkoutSession'
import { formatRest } from '../utils/formatRest'

export function SessionPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const workoutId = (location.state as { workoutId?: string } | null)?.workoutId ?? searchParams.get('workoutId')
  const [prefs, setPrefs] = useState<{
    repos_defaut_secondes?: number
    son_fin?: boolean
    vibration?: boolean
    demarrage_auto?: boolean
    appliquer_repos_programme_auto?: boolean
    autoriser_override_manuel_repos?: boolean
    afficher_criteres_passage_en_seance?: boolean
  }>({})
  const [noteOpen, setNoteOpen] = useState(false)
  const [repsOpen, setRepsOpen] = useState(false)
  const [prepRemaining, setPrepRemaining] = useState(0)
  /** Durée initiale du compte à rebours courant (barre de progression). */
  const [prepTotalSeconds, setPrepTotalSeconds] = useState(0)
  /** Incrémenté à chaque nouveau repos : évite de recréer setInterval à chaque seconde (décompte fiable toutes les séries). */
  const [timerEpoch, setTimerEpoch] = useState(0)
  const lastBeepSecondRef = useRef<number | null>(null)
  const lastVibrateSecondRef = useRef<number | null>(null)
  /** Fin du repos courant (ms depuis epoch) — évite le décalage setInterval surtout sur les 5 dernières secondes. */
  const prepDeadlineMsRef = useRef(0)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const session = useWorkoutSession(workoutId, prefs.repos_defaut_secondes ?? DEFAULT_REPOS_SECONDS)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const prevSessionStateRef = useRef(session.state)

  useEffect(() => {
    prevSessionStateRef.current = 'loading'
  }, [workoutId])

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    void fetchProfileWithPreferences(user.id).then(({ data }) => {
      if (cancelled || !data) return
      setPrefs((data.preferences ?? {}) as typeof prefs)
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (session.state === 'complete' && workoutId) {
      navigate(`/session/${workoutId}/complete`, { replace: true })
    }
  }, [session.state, workoutId, navigate])

  useEffect(() => {
    if (timerEpoch <= 0) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((prepDeadlineMsRef.current - Date.now()) / 1000))
      setPrepRemaining(left)
    }
    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [timerEpoch])

  useEffect(() => {
    if (prepRemaining !== 0) return
    if (repsOpen) return
    const s = sessionRef.current
    if (s.state === 'resting') {
      s.skipRest()
    }
  }, [prepRemaining, repsOpen])

  useEffect(() => {
    if (prepRemaining !== 0) return
    if (repsOpen) return
    const s = sessionRef.current
    if (s.state === 'exercise_transition') {
      s.nextExercise()
    }
  }, [prepRemaining, repsOpen])

  function playCountdownBeep(hz: number) {
    try {
      let ac = audioCtxRef.current
      if (!ac) {
        ac = new AudioContext()
        audioCtxRef.current = ac
      }
      void ac.resume()
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.frequency.value = hz
      gain.gain.value = 0.06
      osc.start()
      osc.stop(ac.currentTime + 0.09)
    } catch {
      /* navigateur peut bloquer l’audio hors geste utilisateur */
    }
  }

  useEffect(() => {
    if (prepRemaining > 5 || prepRemaining <= 0 || prefs.son_fin === false) {
      if (prepRemaining > 5) lastBeepSecondRef.current = null
      return
    }
    if (lastBeepSecondRef.current === prepRemaining) return
    lastBeepSecondRef.current = prepRemaining

    playCountdownBeep(prepRemaining === 1 ? 980 : 820)
  }, [prepRemaining, prefs.son_fin])

  useEffect(() => {
    if (prepRemaining > 5 || prepRemaining <= 0 || prefs.vibration === false) {
      if (prepRemaining > 5) lastVibrateSecondRef.current = null
      return
    }
    if (lastVibrateSecondRef.current === prepRemaining) return
    lastVibrateSecondRef.current = prepRemaining

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(prepRemaining === 1 ? [70, 50, 70] : 60)
    }
  }, [prepRemaining, prefs.vibration])

  function stopPrepCountdown() {
    setPrepRemaining(0)
    setPrepTotalSeconds(0)
    prepDeadlineMsRef.current = 0
    setTimerEpoch(0)
  }

  function getRestSeconds() {
    if (!session.currentExercise) return prefs.repos_defaut_secondes ?? DEFAULT_REPOS_SECONDS
    if (session.state === 'exercise_transition') return session.currentExercise.rest_after_exercise_seconds || 120
    if (prefs.appliquer_repos_programme_auto === false) return prefs.repos_defaut_secondes ?? DEFAULT_REPOS_SECONDS
    return session.currentExercise.rest_seconds
  }

  function startPrepCountdown(seconds: number) {
    if (seconds <= 0) {
      setPrepRemaining(0)
      setPrepTotalSeconds(0)
      prepDeadlineMsRef.current = 0
      return
    }
    lastBeepSecondRef.current = null
    lastVibrateSecondRef.current = null
    setPrepTotalSeconds(seconds)
    prepDeadlineMsRef.current = Date.now() + seconds * 1000
    setPrepRemaining(seconds)
    setTimerEpoch((e) => e + 1)
  }

  useEffect(() => {
    const enteredTransition =
      session.state === 'exercise_transition' && prevSessionStateRef.current !== 'exercise_transition'
    prevSessionStateRef.current = session.state
    if (!enteredTransition || repsOpen) return
    const sec = getRestSeconds()
    startPrepCountdown(sec)
  }, [session.state, repsOpen])

  function onValidatePress() {
    const plannedRest = getRestSeconds()
    startPrepCountdown(plannedRest)
    setRepsOpen(true)
    session.setState('reps_input')
  }

  const restingBlocked = prepRemaining > 0 && !repsOpen

  function onSkipRestPress() {
    stopPrepCountdown()
    if (session.state === 'resting') session.skipRest()
    if (session.state === 'exercise_transition') session.nextExercise()
  }

  async function onConfirmReps(reps: number) {
    const rest = Math.max(0, prepRemaining)
    await session.validateSet(reps, rest, reps > 0)
    setRepsOpen(false)
    if (rest === 0) {
      session.skipRest()
    }
  }

  async function onSkipSet() {
    const rest = Math.max(0, prepRemaining || getRestSeconds())
    await session.skipSet(rest)
    setRepsOpen(false)
    if (rest === 0) {
      session.skipRest()
    }
  }

  async function onAbandon() {
    if (!workoutId) return
    await abandonWorkout(workoutId)
    navigate('/', { replace: true })
  }

  const repsTarget = useMemo(() => {
    const ex = session.currentExercise
    if (!ex) return '—'
    if (ex.reps_mode === 'max') return 'Max'
    if (ex.reps_mode === 'temps') return `${ex.reps_cible_min ?? 0}-${ex.reps_cible_max ?? 0}s`
    return `${ex.reps_cible_min ?? '—'}-${ex.reps_cible_max ?? '—'} reps`
  }, [session.currentExercise])

  const lastPerfText = useMemo(() => {
    if (!session.lastPerformance.length) return '—'
    return session.lastPerformance.map((x) => x.reps).join('-')
  }, [session.lastPerformance])

  const doneText = useMemo(() => {
    if (!session.completedSets.length) return 'Aucune série'
    return session.completedSets.map((x) => `${x.set_number}:${x.reps}`).join(' · ')
  }, [session.completedSets])

  const sideLabel =
    session.currentExercise?.unilateral && session.currentSide
      ? `Côté ${session.currentSide === 'droite' ? 'droit' : 'gauche'}`
      : undefined

  if (!workoutId) {
    return (
      <div className="page-pad">
        <p className="msg msg-err">Workout manquant. Démarre depuis l’accueil.</p>
      </div>
    )
  }

  return (
    <div className="page-pad page-tight-top">
      <WorkoutHeader
        niveau={workoutId ? 'Séance en cours' : '—'}
        seance={session.currentExercise?.nom_court ?? 'Chargement'}
        progression={`Exercice ${Math.min(session.exerciseIndex + 1, session.exercises.length || 1)} / ${Math.max(
          session.exercises.length,
          1,
        )}`}
        onAbandon={() => void onAbandon()}
        onPreviousExercise={session.previousExercise}
      />

      <ExerciseCard
        exercise={session.currentExercise ?? null}
        setLabel={`Série ${session.currentSet} / ${session.totalSets}`}
        repsTarget={repsTarget}
        restBetweenLabel={
          session.currentExercise
            ? formatRest(
                session.state === 'exercise_transition'
                  ? session.currentExercise.rest_after_exercise_seconds ?? 0
                  : session.currentExercise.rest_seconds,
              )
            : undefined
        }
        lastPerf={lastPerfText}
        note={session.currentExercise?.caution_note ?? '—'}
        showBookHint={session.currentExercise?.tempo_mode === 'lent' || session.currentExercise?.tempo_mode === 'special'}
        sideLabel={sideLabel}
      />

      <div className="card lp-bar">
        <span className="lp-lbl">{session.state === 'exercise_transition' ? 'Repos entre exercices' : 'Repos après cette série'}</span>
        <span className="lp-val mono">{formatRest(getRestSeconds())}</span>
      </div>
      {prepRemaining > 0 ? (
        <div className="card session-live-timer" style={{ marginTop: 8, marginBottom: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span className="lp-lbl">{session.state === 'exercise_transition' ? 'Transition — exercice suivant' : 'Timer en cours'}</span>
            <span className="mono" style={{ color: prepRemaining <= 5 ? 'var(--red)' : 'var(--ac)', fontSize: 18 }}>
              {formatRest(prepRemaining)}
            </span>
          </div>
          {prepRemaining > 0 && prepRemaining <= 5 ? (
            <div
              className="mono"
              style={{
                textAlign: 'center',
                fontSize: 'clamp(2.75rem, 12vw, 4rem)',
                fontWeight: 700,
                color: 'var(--red)',
                marginTop: 6,
                lineHeight: 1,
              }}
              aria-live="polite"
            >
              {prepRemaining}
            </div>
          ) : null}
          <div style={{ marginTop: 8, height: 6, borderRadius: 999, background: 'var(--bg3)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, (prepRemaining / Math.max(prepTotalSeconds || getRestSeconds(), 1)) * 100))}%`,
                background: prepRemaining <= 5 ? 'var(--red)' : 'var(--ac)',
                transition: 'width 0.2s linear',
              }}
            />
          </div>
        </div>
      ) : null}

      <SetProgressList total={session.maxProgress} current={session.visualSetNumber} entries={session.completedSets} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-accent-outline" style={{ width: 'auto', padding: '8px 10px' }} onClick={() => setNoteOpen(true)}>
          Voir note
        </button>
      </div>
      <ExerciseTransition open={session.state === 'exercise_transition'} completedExerciseName={session.currentExercise?.nom_court ?? 'Exercice'} />

      <div className="sess-btns">
        <button
          type="button"
          className="btn btn-secondary"
          style={{ flex: 1 }}
          onClick={restingBlocked ? onSkipRestPress : () => void onSkipSet()}
        >
          {restingBlocked ? 'Ignorer repos' : 'Passer'}
        </button>
        <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={onValidatePress} disabled={restingBlocked}>
          {restingBlocked ? `Repos… ${formatRest(prepRemaining)}` : 'Série validée ✓'}
        </button>
      </div>
      <RepsInputSheet
        open={repsOpen}
        title={`Série ${session.visualSetNumber} — ${session.currentExercise?.exercise_code ?? 'EX'}`}
        defaultValue={session.currentExercise?.reps_cible_min ?? 0}
        doneText={doneText}
        countdownSeconds={prepRemaining}
        onConfirm={(reps) => void onConfirmReps(reps)}
        onSkip={() => void onSkipSet()}
        onClose={() => {
          setRepsOpen(false)
          stopPrepCountdown()
          session.setState('set_in_progress')
        }}
      />
      {noteOpen ? (
        <div className="repos-sheet-root" role="dialog" aria-modal="true" aria-label="Note exercice">
          <button type="button" className="repos-sheet-backdrop" onClick={() => setNoteOpen(false)} aria-label="Fermer" />
          <div className="repos-sheet-panel">
            <div className="repos-sheet-handle" aria-hidden />
            <p className="eyebrow">Note courte</p>
            <p className="body">{session.currentExercise?.caution_note ?? '—'}</p>
            <p className="msg muted" style={{ marginTop: 8 }}>
              {session.currentExercise?.book_reference_note ?? 'Voir le livre pour le détail d’exécution.'}
            </p>
            {prefs.afficher_criteres_passage_en_seance !== false ? (
              <p className="body muted" style={{ marginTop: 8 }}>
                Critère de passage: stabilité technique + objectif reps atteint.
              </p>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={() => setNoteOpen(false)} style={{ marginTop: 10 }}>
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
