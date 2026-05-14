import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchSessionJournalWithTitles, type SessionJournalListRow } from '../lib/catalog'

function fmtShort(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

export function JournalPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<SessionJournalListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setErr(null)
    const { data, error } = await fetchSessionJournalWithTitles(80)
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

  return (
    <div className="page-pad">
      <h1 className="h1">Journal</h1>
      <p className="body muted" style={{ marginTop: 8 }}>
        Ressenti après l’effort (RPE, énergie, sommeil, notes) enregistré à la fin de séance. L’
        <strong>Historique</strong> liste les séances terminées (volume, durée) ; le <strong>Journal</strong> regroupe
        ces saisies « post-séance ».
      </p>

      {err ? (
        <p className="msg msg-err" role="alert" style={{ marginTop: 16 }}>
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="body muted" style={{ marginTop: 20 }}>
          Chargement…
        </p>
      ) : rows.length === 0 ? (
        <div className="card" style={{ marginTop: 24, padding: 22 }}>
          <p className="body" style={{ color: 'var(--t1)' }}>
            Aucune entrée pour l’instant. À la fin d’une séance, valide le formulaire (ou « Plus tard ») : une ligne
            apparaîtra ici.
          </p>
        </div>
      ) : (
        <div className="stack" style={{ marginTop: 18 }}>
          {rows.map((r) => (
            <article key={r.id} className="prog-item card-flat">
              <div className="prog-body">
                <p className="prog-title">{r.workout_title ?? 'Séance'}</p>
                <p className="prog-sub">
                  {fmtShort(r.workout_started_at)} · saisie {fmtShort(r.created_at)}
                </p>
                <p className="body muted" style={{ marginTop: 8 }}>
                  RPE {r.rpe ?? '—'} · Énergie {r.energy ?? '—'}/5 · Sommeil {r.sleep_quality ?? '—'}/5
                </p>
                {r.pain_notes ? (
                  <p className="body" style={{ marginTop: 6 }}>
                    Douleur / inconfort : {r.pain_notes}
                  </p>
                ) : null}
                {r.free_notes ? (
                  <p className="body" style={{ marginTop: 6 }}>
                    {r.free_notes}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
