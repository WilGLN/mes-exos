import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchUserActiveLevel, setActiveTrainingLevel } from '../lib/trainingCatalog'
import { useTrainingCatalog } from '../hooks/useTrainingCatalog'
import type { TrainingLevelType } from '../types/trainingCatalog'

export function Programs() {
  const { user } = useAuth()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'debutant' | TrainingLevelType>('all')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const { levels, loading, error } = useTrainingCatalog(
    useMemo(() => {
      if (filter === 'debutant') return { debutant: true }
      if (filter === 'all') return {}
      return { type: filter }
    }, [filter]),
  )

  useEffect(() => {
    if (!user?.id) return
    void fetchUserActiveLevel(user.id).then(({ levelId, error: e }) => {
      if (e) setLocalError(e.message)
      else setActiveId(levelId)
    })
  }, [user?.id])

  async function onChoose(levelId: string) {
    setSavingId(levelId)
    setLocalError(null)
    setInfo(null)
    const { error: e } = await setActiveTrainingLevel(levelId)
    setSavingId(null)
    if (e) {
      setLocalError(e.message)
      return
    }
    setActiveId(levelId)
    setInfo('Niveau actif mis à jour.')
  }

  return (
    <div className="page-pad">
      <h1 className="h1">Programmes</h1>
      <p className="body muted" style={{ marginTop: 8 }}>
        Référentiel résumé des niveaux Lafay pour piloter ton suivi.
      </p>
      <p className="msg muted" style={{ marginTop: 8, fontSize: 12 }}>
        Résumé intégré pour le suivi. Pour les détails d’exécution, variantes complètes et explications approfondies, se
        référer au livre.
      </p>

      <div className="presets" style={{ marginTop: 12 }}>
        {[
          ['all', 'Tous'],
          ['debutant', 'Débutant'],
          ['progression', 'Progression'],
          ['entretien', 'Entretien'],
          ['avance', 'Avancé'],
        ].map(([k, lb]) => (
          <button key={k} type="button" className={`preset mono${filter === k ? ' on' : ''}`} onClick={() => setFilter(k as typeof filter)}>
            {lb}
          </button>
        ))}
      </div>

      {error || localError ? (
        <p className="msg msg-err" role="alert" style={{ marginTop: 12 }}>
          {error ?? localError}
        </p>
      ) : null}
      {info ? (
        <p className="msg msg-ok" role="status" style={{ marginTop: 12 }}>
          {info}
        </p>
      ) : null}

      {loading ? (
        <p className="body muted" style={{ marginTop: 20 }}>
          Chargement…
        </p>
      ) : (
        <div className="stack" style={{ marginTop: 20 }}>
          {levels.map((p) => {
            const isActive = activeId === p.id
            const busy = savingId === p.id
            return (
              <div key={p.id} className="prog-item card-flat">
                <div className="prog-ic" aria-hidden>
                  {p.sort_order <= 3 ? '💪' : p.type === 'avance' ? '⚡' : p.type === 'entretien' ? '🛡' : '🔥'}
                </div>
                <div className="prog-body">
                  <p className="prog-title">{p.titre}</p>
                  <p className="prog-sub">{[p.description_courte, p.frequence_recommandee].filter(Boolean).join(' · ') || '—'}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {p.frequence_recommandee ? <span className="pill">{p.frequence_recommandee}</span> : null}
                    {p.difficulty_badge ? <span className="pill">{p.difficulty_badge}</span> : null}
                  </div>
                </div>
                <div className="prog-actions">
                  {isActive ? <span className="pill pill-g">Actif</span> : null}
                  <Link className="btn btn-secondary prog-btn" to={`/programs/${p.slug}`}>
                    Détails
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary prog-btn"
                    disabled={busy || isActive}
                    onClick={() => void onChoose(p.id)}
                  >
                    {busy ? '…' : isActive ? 'Déjà actif' : 'Définir comme programme actif'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
