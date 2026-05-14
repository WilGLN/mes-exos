import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchWorkoutById, fetchWorkoutRecap, type WorkoutExerciseRecap } from '../lib/catalog'
import { completeWorkout, insertSessionJournal, updateProgressOnComplete } from '../lib/workoutSession'

export function SessionCompletePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const workoutId = params.workoutId ?? (location.state as { workoutId?: string } | null)?.workoutId

  const [title, setTitle] = useState('')
  const [rows, setRows] = useState<WorkoutExerciseRecap[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [rpe, setRpe] = useState<number>(7)
  const [energy, setEnergy] = useState<number>(3)
  const [sleepQuality, setSleepQuality] = useState<number>(3)
  const [painNotes, setPainNotes] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  useEffect(() => {
    if (!workoutId) {
      setLoadErr('Aucune séance à clôturer.')
      return
    }
    let cancelled = false
    void Promise.all([fetchWorkoutById(workoutId), fetchWorkoutRecap(workoutId)]).then(([w, r]) => {
      if (cancelled) return
      if (w.error) {
        setLoadErr(w.error.message)
        return
      }
      if (r.error) {
        setLoadErr(r.error.message)
        return
      }
      setTitle(w.data?.title ?? 'Séance')
      setRows(r.data)
    })
    return () => {
      cancelled = true
    }
  }, [workoutId])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!workoutId) return
    setSubmitErr(null)
    setSubmitting(true)
    try {
      await completeWorkout(workoutId, rpe)
      await insertSessionJournal({
        workout_id: workoutId,
        rpe,
        energy,
        sleep_quality: sleepQuality,
        pain_notes: painNotes.trim() || undefined,
        free_notes: note.trim() || undefined,
      })
      await updateProgressOnComplete(workoutId)
      setSubmitting(false)
      navigate('/', { replace: true })
    } catch (e) {
      setSubmitting(false)
      setSubmitErr(e instanceof Error ? e.message : 'Erreur enregistrement')
      return
    }
  }

  async function onSkip() {
    if (!workoutId) return
    setSubmitting(true)
    setSubmitErr(null)
    try {
      await completeWorkout(workoutId, rpe)
      await insertSessionJournal({ workout_id: workoutId })
      await updateProgressOnComplete(workoutId)
      setSubmitting(false)
      navigate('/', { replace: true })
    } catch (e) {
      setSubmitting(false)
      setSubmitErr(e instanceof Error ? e.message : 'Erreur enregistrement')
    }
  }

  if (!workoutId) {
    return (
      <div className="page-pad page-complete">
        <p className="msg msg-err">{loadErr ?? 'Identifiant de séance manquant.'}</p>
        <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
          Retour à l’accueil
        </button>
      </div>
    )
  }

  const totalSets = rows.reduce((acc, ex) => acc + (ex.workout_sets?.length ?? 0), 0)
  const totalReps = rows.reduce(
    (acc, ex) => acc + (ex.workout_sets?.reduce((s, z) => s + (z.completed !== false ? z.reps : 0), 0) ?? 0),
    0,
  )

  return (
    <div className="page-pad page-complete">
      <p className="eyebrow">Fin de séance</p>
      <h1 className="h1" style={{ marginTop: 6 }}>
        {title}
      </h1>

      {loadErr ? (
        <p className="msg msg-err" role="alert" style={{ marginTop: 12 }}>
          {loadErr}
        </p>
      ) : null}

      <div className="complete-kpis" style={{ marginTop: 20 }}>
        <div className="complete-kpi">
          <span className="complete-kpi-val mono">{rows.length}</span>
          <span className="complete-kpi-lbl">Exercices</span>
        </div>
        <div className="complete-kpi">
          <span className="complete-kpi-val mono">{totalSets}</span>
          <span className="complete-kpi-lbl">Séries</span>
        </div>
        <div className="complete-kpi">
          <span className="complete-kpi-val mono">{totalReps}</span>
          <span className="complete-kpi-lbl">Reps</span>
        </div>
      </div>

      <div className="stack" style={{ marginTop: 20 }}>
        {rows.map((ex) => (
          <div key={ex.id} className="card-flat" style={{ padding: 14 }}>
            <p className="prog-title" style={{ fontSize: 15 }}>
              {ex.name}
            </p>
            <p className="mono" style={{ marginTop: 8, fontSize: 18, color: 'var(--ac)', letterSpacing: '-0.02em' }}>
              {(ex.workout_sets?.length
                ? ex.workout_sets.map((s) => s.reps).join(' · ')
                : '—') + (ex.workout_sets?.length ? ' reps' : '')}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="complete-form">
        <label className="field" style={{ marginTop: 24 }}>
          <span className="field-lbl">Effort global (RPE 1–10)</span>
          <div className="complete-rpe-row">
            <input
              className="complete-rpe-input mono"
              type="number"
              min={1}
              max={10}
              step={1}
              value={rpe}
              onChange={(e) => setRpe(Number(e.target.value))}
              required
              aria-label="RPE de 1 à 10"
            />
            <span className="body muted" style={{ alignSelf: 'center' }}>
              / 10
            </span>
          </div>
        </label>

        <label className="field" style={{ marginTop: 16 }}>
          <span className="field-lbl">Énergie (1–5)</span>
          <input className="input mono" type="range" min={1} max={5} step={1} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} />
          <span className="mono muted">{energy} / 5</span>
        </label>

        <label className="field" style={{ marginTop: 16 }}>
          <span className="field-lbl">Sommeil (1–5)</span>
          <input
            className="input mono"
            type="range"
            min={1}
            max={5}
            step={1}
            value={sleepQuality}
            onChange={(e) => setSleepQuality(Number(e.target.value))}
          />
          <span className="mono muted">{sleepQuality} / 5</span>
        </label>

        <label className="field" style={{ marginTop: 16 }}>
          <span className="field-lbl">Douleurs / gênes (optionnel)</span>
          <input className="input" value={painNotes} onChange={(e) => setPainNotes(e.target.value)} maxLength={240} />
        </label>

        <label className="field" style={{ marginTop: 16 }}>
          <span className="field-lbl">Note libre (optionnel)</span>
          <textarea
            className="input complete-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Comment s’est passée la séance…"
            maxLength={2000}
          />
        </label>

        {submitErr ? (
          <p className="msg msg-err" role="alert" style={{ marginTop: 12 }}>
            {submitErr}
          </p>
        ) : null}

        <div className="complete-footer">
          <button type="submit" className="btn btn-primary" style={{ minHeight: 56 }} disabled={submitting || !!loadErr}>
            {submitting ? 'Enregistrement…' : 'Enregistrer et terminer'}
          </button>
          <button type="button" className="btn btn-secondary" style={{ minHeight: 48, marginTop: 8 }} onClick={() => void onSkip()} disabled={submitting || !!loadErr}>
            Passer
          </button>
        </div>
      </form>
    </div>
  )
}
