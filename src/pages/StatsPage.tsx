import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchWorkoutJournalList, type WorkoutJournalListRow } from '../lib/catalog'

export function StatsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<WorkoutJournalListRow[]>([])
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
    const { data, error } = await fetchWorkoutJournalList(120)
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

  const summary = useMemo(() => {
    const now = Date.now()
    const in7 = (t: string) => now - new Date(t).getTime() <= 7 * 24 * 60 * 60 * 1000
    const in30 = (t: string) => now - new Date(t).getTime() <= 30 * 24 * 60 * 60 * 1000
    const last7 = rows.filter((r) => in7(r.started_at))
    const last30 = rows.filter((r) => in30(r.started_at))
    const reps30 = last30.reduce((a, r) => a + Number(r.total_reps ?? 0), 0)
    const dur = last30.map((r) => r.duration_seconds).filter((x): x is number => typeof x === 'number' && x > 0)
    const avgDur = dur.length ? Math.round(dur.reduce((a, b) => a + b, 0) / dur.length) : null
    return { total: rows.length, last7: last7.length, last30: last30.length, reps30, avgDur }
  }, [rows])

  return (
    <div className="page-pad">
      <h1 className="h1">Progression</h1>
      <p className="body muted" style={{ marginTop: 8 }}>
        Indicateurs calculés à partir de tes séances <strong>terminées</strong> (pas de données fictives).
      </p>

      {err ? (
        <p className="msg msg-err" role="alert" style={{ marginTop: 14 }}>
          {err}
        </p>
      ) : null}

      {loading ? (
        <p className="body muted" style={{ marginTop: 20 }}>
          Chargement…
        </p>
      ) : (
        <div className="sg" style={{ marginTop: 18 }}>
          <div className="scard scard-ac card-flat">
            <p className="scard-lbl">7 derniers jours</p>
            <p className="scard-val">{summary.last7}</p>
            <p className="scard-sub">séances terminées</p>
          </div>
          <div className="scard card-flat">
            <p className="scard-lbl">30 jours</p>
            <p className="scard-val">{summary.reps30}</p>
            <p className="scard-sub">reps cumulées</p>
          </div>
          <div className="scard card-flat">
            <p className="scard-lbl">Durée moy.</p>
            <p className="scard-val mono">{summary.avgDur != null ? `${Math.round(summary.avgDur / 60)}m` : '—'}</p>
            <p className="scard-sub">sur 30 j ({summary.last30} séances)</p>
          </div>
          <div className="scard card-flat">
            <p className="scard-lbl">Total</p>
            <p className="scard-val">{summary.total}</p>
            <p className="scard-sub">séances en base</p>
          </div>
        </div>
      )}

      <p className="body muted" style={{ marginTop: 22 }}>
        Graphiques détaillés et records personnels arriveront dans une prochaine version.
      </p>
    </div>
  )
}
