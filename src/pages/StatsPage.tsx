import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchPersonalRecordsCount, fetchWorkoutJournalList, type WorkoutJournalListRow } from '../lib/catalog'
import { countWorkoutsInUtcWeek, currentWorkoutStreak, lastCompletedStartedAt, mondayUtcWeekStart } from '../utils/trainingStats'

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  const d = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (d <= 0) return "aujourd'hui"
  if (d === 1) return 'hier'
  if (d < 7) return `il y a ${d} jours`
  if (d < 30) return `il y a ${Math.floor(d / 7)} sem.`
  return new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'medium' })
}

export function StatsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<WorkoutJournalListRow[]>([])
  const [prCount, setPrCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([])
      setPrCount(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setErr(null)
    const [journal, pr] = await Promise.all([fetchWorkoutJournalList(200), fetchPersonalRecordsCount()])
    setLoading(false)
    if (journal.error) {
      setErr(journal.error.message)
      setRows([])
    } else {
      setRows(journal.data)
    }
    if (pr.error) setPrCount(null)
    else setPrCount(pr.count)
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
    const repsAll = rows.reduce((a, r) => a + Number(r.total_reps ?? 0), 0)
    const dur = last30.map((r) => r.duration_seconds).filter((x): x is number => typeof x === 'number' && x > 0)
    const avgDur = dur.length ? Math.round(dur.reduce((a, b) => a + b, 0) / dur.length) : null
    const streak = currentWorkoutStreak(rows)
    const lastIso = lastCompletedStartedAt(rows)
    const weekStart = mondayUtcWeekStart()
    const weekN = countWorkoutsInUtcWeek(rows, weekStart)
    return {
      total: rows.length,
      last7: last7.length,
      last30: last30.length,
      reps30,
      repsAll,
      avgDur,
      streak,
      lastIso,
      weekN,
    }
  }, [rows])

  return (
    <div className="page-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <h1 className="h1">Progression</h1>
          <p className="body muted" style={{ marginTop: 8 }}>
            Indicateurs calculés à partir de tes séances <strong>terminées</strong> (pas de données fictives).
          </p>
        </div>
        <button type="button" className="btn btn-secondary" style={{ width: 'auto', padding: '10px 14px' }} onClick={() => void load()}>
          Actualiser
        </button>
      </div>

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
        <>
          <div className="sg" style={{ marginTop: 18 }}>
            <div className="scard scard-ac card-flat">
              <p className="scard-lbl">Série (jours)</p>
              <p className="scard-val mono">{summary.streak}</p>
              <p className="scard-sub">jours consécutifs avec séance</p>
            </div>
            <div className="scard card-flat">
              <p className="scard-lbl">Semaine UTC</p>
              <p className="scard-val mono">{summary.weekN}</p>
              <p className="scard-sub">séances cette semaine</p>
            </div>
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
              <p className="scard-lbl">Total reps</p>
              <p className="scard-val mono">{summary.repsAll}</p>
              <p className="scard-sub">sur {summary.total} séances chargées</p>
            </div>
            <div className="scard card-flat">
              <p className="scard-lbl">Records (PR)</p>
              <p className="scard-val mono">{prCount ?? '—'}</p>
              <p className="scard-sub">lignes en base</p>
            </div>
            <div className="scard card-flat">
              <p className="scard-lbl">Dernière séance</p>
              <p className="scard-val" style={{ fontSize: 'clamp(1rem, 4vw, 1.35rem)' }}>
                {formatRelative(summary.lastIso)}
              </p>
              <p className="scard-sub">référence temps local</p>
            </div>
          </div>

          <p className="body muted" style={{ marginTop: 22 }}>
            Objectif hebdomadaire et reprise de séance : <Link to="/">Accueil</Link> et{' '}
            <Link to="/settings">Paramètres</Link>. Graphiques détaillés : phase ultérieure.
          </p>
        </>
      )}
    </div>
  )
}
