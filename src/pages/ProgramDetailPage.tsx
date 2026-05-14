import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { setActiveTrainingLevel, fetchTrainingLevelBySlug, startWorkoutFromTrainingSession } from '../lib/trainingCatalog'
import type { TrainingLevelDetail } from '../types/trainingCatalog'
import { formatRest } from '../utils/formatRest'

function fmtReps(min: number | null, max: number | null, mode: string, note: string | null) {
  const base = mode === 'temps' ? `${min ?? 0}-${max ?? 0}s` : `${min ?? '—'}-${max ?? '—'} reps`
  return note ? `${base} · ${note}` : base
}

export function ProgramDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [level, setLevel] = useState<TrainingLevelDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    void fetchTrainingLevelBySlug(slug).then(({ data, error }) => {
      if (error) setMsg(error.message)
      setLevel(data)
      setLoading(false)
    })
  }, [slug])

  const firstSession = useMemo(() => level?.training_level_sessions?.[0] ?? null, [level])

  async function setActive() {
    if (!level?.id) return
    setBusy(true)
    setMsg(null)
    const { error } = await setActiveTrainingLevel(level.id)
    if (error) setMsg(error.message)
    else setMsg('Niveau actif enregistré.')
    setBusy(false)
  }

  async function startNow() {
    if (!firstSession?.id) return
    setBusy(true)
    setMsg(null)
    const { workoutId, error } = await startWorkoutFromTrainingSession(firstSession.id)
    setBusy(false)
    if (error || !workoutId) {
      setMsg(error?.message ?? 'Impossible de démarrer la séance.')
      return
    }
    navigate('/session', { state: { workoutId } })
  }

  if (loading) {
    return (
      <div className="page-pad">
        <p className="body muted">Chargement du niveau…</p>
      </div>
    )
  }

  if (!level) {
    return (
      <div className="page-pad">
        <p className="msg msg-err">Niveau introuvable.</p>
      </div>
    )
  }

  return (
    <div className="page-pad">
      <Link className="t-back" to="/programs" style={{ marginBottom: 8 }}>
        <span aria-hidden>←</span>
        <span>Programmes</span>
      </Link>
      <h1 className="h1">{level.titre}</h1>
      <p className="body muted" style={{ marginTop: 6 }}>
        {[level.frequence_recommandee, level.duree_phase, level.description_courte].filter(Boolean).join(' · ')}
      </p>
      <div className="profile-reco" style={{ marginTop: 12 }}>
        Ce contenu est un résumé de suivi. Pour les détails complets d’exécution, se référer au livre.
      </div>

      {msg ? (
        <p className="msg msg-ok" style={{ marginTop: 10 }}>
          {msg}
        </p>
      ) : null}

      <div className="stack" style={{ marginTop: 14 }}>
        <section className="profile-card">
          <p className="eyebrow">Structure</p>
          <p className="body muted">{level.objectifs?.join(' · ') || 'Objectif non renseigné'}</p>
        </section>
        <section className="profile-card">
          <p className="eyebrow">Repos</p>
          <p className="body muted">
            Deux durées dans le catalogue : <strong>entre séries</strong> (même exercice) et <strong>après l’exercice</strong> (avant le suivant). Valeurs issues du livre (résumé) — affinage possible dans les paramètres de séance.
          </p>
        </section>
        <section className="profile-card">
          <p className="eyebrow">Progression</p>
          <p className="body muted">{level.conditions_entree || 'Entrée : bloc précédent validé.'}</p>
        </section>
        <section className="profile-card">
          <p className="eyebrow">Critères de passage</p>
          <p className="body muted">{level.conditions_passage || 'Atteindre les cibles avec forme stable.'}</p>
        </section>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button type="button" className="btn btn-primary" onClick={() => void setActive()} disabled={busy}>
          Définir comme programme actif
        </button>
        <button type="button" className="btn btn-accent-outline" onClick={() => void startNow()} disabled={busy || !firstSession}>
          Démarrer la séance
        </button>
      </div>

      <p className="eyebrow" style={{ margin: '20px 0 8px' }}>
        Séances du niveau
      </p>
      <div className="stack">
        {level.training_level_sessions?.map((s) => (
          <section key={s.id} className="profile-card">
            <p className="prog-title">
              {s.nom} · {s.nb_seances_par_semaine ?? '—'} / sem
            </p>
            {s.notes_courtes ? <p className="prog-sub">{s.notes_courtes}</p> : null}
            <div className="stack" style={{ marginTop: 8 }}>
              {s.training_level_session_exercises?.map((e) => (
                <div key={e.id} className="card-flat" style={{ padding: 10 }}>
                  <p className="mono" style={{ fontSize: 12 }}>
                    {e.exercise_code} · {e.exercise_library?.nom_court ?? 'Exercice'}
                  </p>
                  <p className="prog-sub" style={{ marginTop: 4 }}>
                    {e.series ?? '—'} séries · {fmtReps(e.reps_cible_min, e.reps_cible_max, e.reps_mode, e.reps_note)} · repos entre séries{' '}
                    {formatRest(e.rest_seconds ?? 0)}
                    {e.rest_after_exercise_seconds != null && e.rest_after_exercise_seconds > 60 ? (
                      <>
                        {' '}
                        · après exercice {formatRest(e.rest_after_exercise_seconds)}
                      </>
                    ) : null}{' '}
                    · tempo {e.tempo_mode}
                  </p>
                  <p className="prog-sub" style={{ marginTop: 4 }}>
                    {e.exercise_library?.groupe_principal ?? '—'} · {e.exercise_library?.materiel_resume ?? 'Matériel selon variante'} · {e.book_reference_note}
                  </p>
                  {e.caution_note ? <p className="msg muted">{e.caution_note}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
