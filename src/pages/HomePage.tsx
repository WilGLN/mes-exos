import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchProfileWithPreferences,
} from '../lib/catalog'
import { firstNameFromUser } from '../lib/greeting'
import {
  fetchTrainingLevels,
  fetchTrainingSessionsForLevel,
  fetchUserActiveLevel,
  fetchUserLevelProgress,
  setActiveTrainingLevel,
  startWorkoutFromTrainingSession,
} from '../lib/trainingCatalog'
import type { TrainingLevel, TrainingLevelSession } from '../types/trainingCatalog'

export function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const name = firstNameFromUser(user)

  const [levels, setLevels] = useState<TrainingLevel[]>([])
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<TrainingLevel | null>(null)
  const [sessions, setSessions] = useState<TrainingLevelSession[]>([])
  const [nextSession, setNextSession] = useState<TrainingLevelSession | null>(null)
  const [lastProgressText, setLastProgressText] = useState<string>('—')
  const [loading, setLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    const [levelsRes, activeRes, profileRes] = await Promise.all([
      fetchTrainingLevels(),
      fetchUserActiveLevel(user.id),
      fetchProfileWithPreferences(user.id),
    ])
    if (levelsRes.error) setError(levelsRes.error.message)
    setLevels(levelsRes.data)
    if (activeRes.error) setError(activeRes.error.message)
    setActiveLevelId(activeRes.levelId)
    if (profileRes.error) setError(profileRes.error.message)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    const level = levels.find((l) => l.id === activeLevelId) ?? null
    setActiveLevel(level)
  }, [levels, activeLevelId])

  useEffect(() => {
    if (!activeLevelId || !user?.id) {
      setSessions([])
      setNextSession(null)
      setLastProgressText('—')
      return
    }
    let cancelled = false
    setSessionsLoading(true)
    void fetchTrainingSessionsForLevel(activeLevelId).then(async ({ data, error: e }) => {
      if (cancelled) return
      if (e) setError(e.message)
      setSessions(data)
      const { data: prog } = await fetchUserLevelProgress(user.id, activeLevelId)
      const next = data.find((s) => s.id === prog?.next_recommended_session_id) ?? data[0] ?? null
      setNextSession(next)
      if (prog?.last_activity_date) {
        setLastProgressText(`Dernière activité ${prog.last_activity_date}`)
      } else {
        setLastProgressText('Aucune progression enregistrée')
      }
      setSessionsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [activeLevelId, user?.id])

  async function onSetActive(levelId: string) {
    setAction('Mise à jour…')
    setError(null)
    const { error: e } = await setActiveTrainingLevel(levelId)
    setAction(null)
    if (e) {
      setError(e.message)
      return
    }
    setActiveLevelId(levelId)
  }

  async function onStartSession(sessionId: string) {
    setAction('Démarrage…')
    setError(null)
    const { workoutId, error: e } = await startWorkoutFromTrainingSession(sessionId)
    setAction(null)
    if (e || !workoutId) {
      setError(e?.message ?? 'Impossible de démarrer la séance.')
      return
    }
    navigate(`/session?workoutId=${encodeURIComponent(workoutId)}`)
  }

  return (
    <div className="page-pad">
      <div className="home-head">
        <div>
          <p className="greet">
            Bonjour, <span>{name}</span>
          </p>
          <h1 className="h1">Entraînement</h1>
        </div>
      </div>

      {error ? (
        <p className="msg msg-err" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </p>
      ) : null}
      {action ? (
        <p className="body muted" style={{ marginBottom: 12 }}>
          {action}
        </p>
      ) : null}

      <section className="hero card-hero">
        <p className="eyebrow">Aperçu</p>
        <h2 className="hero-title">Niveau actif &amp; prochaine séance</h2>
        <p className="hero-meta">
          {activeLevel
            ? `${activeLevel.titre} · ${activeLevel.frequence_recommandee ?? 'Fréquence libre'}`
            : 'Choisis un niveau pour démarrer le suivi.'}
        </p>
        <div className="hero-stats">
          <div>
            <div className="hs-val">{loading ? '—' : levels.length}</div>
            <div className="hs-lbl">Niveaux</div>
          </div>
          <div>
            <div className="hs-val">{sessionsLoading ? '…' : sessions.length}</div>
            <div className="hs-lbl">Séances niveau</div>
          </div>
          <div>
            <div className="hs-val">{activeLevelId ? '✓' : '—'}</div>
            <div className="hs-lbl">Niveau choisi</div>
          </div>
        </div>
        <p className="body muted" style={{ marginTop: 8 }}>
          {lastProgressText}
        </p>
        {nextSession ? (
          <button className="btn btn-primary" type="button" onClick={() => void onStartSession(nextSession.id)}>
            Démarrer la séance · {nextSession.nom}
          </button>
        ) : (
          <Link className="btn btn-primary" to="/programs">
            Choisir un niveau
          </Link>
        )}
      </section>

      <p className="eyebrow" style={{ margin: '20px 0 8px' }}>
        Programmes
      </p>
      {loading ? (
        <p className="body muted">Chargement des programmes…</p>
      ) : (
        <div className="stack">
          {levels.map((p) => {
            const isActive = activeLevelId === p.id
            const sub = [p.description_courte, p.frequence_recommandee].filter(Boolean).join(' · ')
            return (
              <div key={p.id} className="prog-item card-flat">
                <div className="prog-ic" aria-hidden>
                  {p.sort_order > 6 ? '🔥' : '💪'}
                </div>
                <div className="prog-body">
                  <p className="prog-title">{p.titre}</p>
                  <p className="prog-sub">{sub || '—'}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  {isActive ? (
                    <span className="pill pill-g">Actif</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px 12px', width: 'auto' }}
                      onClick={() => void onSetActive(p.id)}
                    >
                      Choisir
                    </button>
                  )}
                  <Link className="btn btn-accent-outline" style={{ padding: '8px 12px', width: 'auto' }} to={`/programs/${p.slug}`}>
                    Détail
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeLevelId && !sessionsLoading && sessions.length > 0 ? (
        <>
          <p className="eyebrow" style={{ margin: '22px 0 8px' }}>
            Démarrer une séance
          </p>
          <div className="stack">
            {sessions.map((s) => (
              <div key={s.id} className="prog-item card-flat">
                <div className="prog-body">
                  <p className="prog-title">
                    {s.nom}
                  </p>
                </div>
                <button type="button" className="btn btn-primary" style={{ padding: '10px 14px', width: 'auto' }} onClick={() => void onStartSession(s.id)}>
                  Commencer
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
