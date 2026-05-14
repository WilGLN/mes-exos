import { useCallback, useEffect, useMemo, useState } from 'react'
import { JournalSwipeRow } from '../components/journal/JournalSwipeRow'
import { useAuth } from '../context/AuthContext'
import { deleteWorkoutById, fetchWorkoutJournalList, type WorkoutJournalListRow } from '../lib/catalog'

type Filter = '7j' | '30j' | 'all'

function formatDuration(sec: number | null | undefined): string {
  if (sec == null || sec <= 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m} min${s > 0 ? ` ${s}s` : ''}` : `${s}s`
}

function dayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
}

export function HistoryPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<WorkoutJournalListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('7j')
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setErr(null)
    const { data, error } = await fetchWorkoutJournalList(200)
    setLoading(false)
    if (error) {
      setErr(error.message)
      setRows([])
      return
    }
    setRows(data)
  }, [user?.id])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const now = Date.now()
    const limitMs =
      filter === '7j' ? 7 * 24 * 60 * 60 * 1000 : filter === '30j' ? 30 * 24 * 60 * 60 * 1000 : Infinity
    return rows.filter((r) => {
      const t = new Date(r.started_at).getTime()
      return now - t <= limitMs
    })
  }, [rows, filter])

  const byDay = useMemo(() => {
    const map = new Map<string, WorkoutJournalListRow[]>()
    for (const r of filtered) {
      const key = r.day_utc
      const cur = map.get(key) ?? []
      cur.push(r)
      map.set(key, cur)
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [filtered])

  return (
    <div className="page-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="h1">Historique</h1>
        <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '10px 14px' }} onClick={() => void load()}>
          Actualiser
        </button>
      </div>
      <p className="body muted" style={{ marginTop: 8 }}>
        Séances terminées : volume, durée et RPE enregistré sur la séance (pas le formulaire ressenti détaillé — voir
        l’onglet Journal).
      </p>
      <p className="body muted" style={{ marginTop: 6, fontSize: 12 }}>
        Glisse une ligne vers la gauche pour afficher la corbeille et supprimer la séance (y compris le ressenti du
        journal associé).
      </p>

      <div className="hf-row" style={{ marginTop: 14 }}>
        <button type="button" className={`hf${filter === '7j' ? ' on' : ''}`} onClick={() => setFilter('7j')}>
          7 jours
        </button>
        <button type="button" className={`hf${filter === '30j' ? ' on' : ''}`} onClick={() => setFilter('30j')}>
          30 jours
        </button>
        <button type="button" className={`hf${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>
          Tout
        </button>
      </div>

      {err ? (
        <p className="msg msg-err" role="alert" style={{ marginTop: 16 }}>
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="body muted" style={{ marginTop: 20 }}>
          Chargement…
        </p>
      ) : filtered.length === 0 ? (
        <p className="body muted" style={{ marginTop: 20 }}>
          Aucune séance terminée pour cette période. Termine une séance depuis l’accueil pour la voir ici.
        </p>
      ) : (
        byDay.map(([day, sessions]) => (
          <section key={day} className="hg">
            <h2 className="hg-lbl">{dayLabel(day)}</h2>
            {sessions.map((s) => (
              <JournalSwipeRow
                key={s.id}
                rowId={s.id}
                openRowId={openSwipeId}
                setOpenRowId={setOpenSwipeId}
                deleteConfirmMessage="Supprimer cette séance de l’historique ? Les données de volume et le journal post-séance associés seront supprimés."
                deleteAriaLabel="Supprimer la séance"
                onDelete={async () => {
                  const { error } = await deleteWorkoutById(s.id)
                  if (!error) await load()
                  return { error }
                }}
              >
                <article className="he">
                  <span className="hdot" aria-hidden />
                  <div className="hi">
                    <h3 className="hn">{s.title ?? 'Séance'}</h3>
                    <p className="hm">
                      {formatDuration(s.duration_seconds)}
                      {s.exercise_count != null ? ` · ${s.exercise_count} ex.` : ''}
                      {s.set_count != null ? ` · ${s.set_count} séries` : ''}
                      {s.total_reps != null ? ` · ${s.total_reps} reps` : ''}
                    </p>
                  </div>
                  <div className="hrpe">
                    {s.rpe != null ? (
                      <>
                        <span className="hrpe-v">{s.rpe}</span>
                        <span className="hrpe-l">RPE</span>
                      </>
                    ) : (
                      <span className="hrpe-l">—</span>
                    )}
                  </div>
                </article>
              </JournalSwipeRow>
            ))}
          </section>
        ))
      )}
    </div>
  )
}
