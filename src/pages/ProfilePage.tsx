import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchProfileWithPreferences,
  mergeProfilePreferences,
  updateProfileDisplayName,
  type TimerPreferences,
} from '../lib/catalog'
import { firstNameFromUser } from '../lib/greeting'
import { useProfile, type BodyMeasurementRow, type EntryTestRow } from '../hooks/useProfile'

const RECO_MSG: Record<string, string> = {
  programme_1: 'Commence par le Programme 1 (p.40 du livre)',
  programme_2: 'Commence par le Programme 2 (p.42 du livre)',
  niveau_2: 'Tu peux commencer directement au Niveau 2 (p.45 du livre)',
}

function num(v: string): number | null {
  const t = v.trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function Delta({ cur, prev }: { cur: number | null | undefined; prev: number | null | undefined }) {
  if (cur == null || prev == null) return <span className="mono muted">—</span>
  const d = cur - prev
  if (d === 0) return <span className="mono muted">0</span>
  const arrow = d > 0 ? '↑' : '↓'
  const cls = d > 0 ? 'delta-up' : 'delta-down'
  return (
    <span className={`mono ${cls}`}>
      {arrow} {Math.abs(d).toFixed(1)}
    </span>
  )
}

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const profileApi = useProfile()

  const [prefs, setPrefs] = useState<TimerPreferences>({})
  const [displayName, setDisplayName] = useState('')
  const [latestTest, setLatestTest] = useState<EntryTestRow | null>(null)
  const [latestMeas, setLatestMeas] = useState<BodyMeasurementRow | null>(null)
  const [prevMeas, setPrevMeas] = useState<BodyMeasurementRow | null>(null)
  const [hist, setHist] = useState<BodyMeasurementRow[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [testForm, setTestForm] = useState({
    tested_at: new Date().toISOString().slice(0, 10),
    reps_a: '',
    reps_b: '',
    reps_c: '',
    reps_a1: '',
    notes: '',
  })
  const [measForm, setMeasForm] = useState({
    measured_at: new Date().toISOString().slice(0, 10),
    weight_kg: '',
    chest_cm: '',
    waist_cm: '',
    hips_cm: '',
    thigh_cm: '',
    calf_cm: '',
    shoulders_cm: '',
    arm_cm: '',
    photos_taken: false,
    photo_date: '',
    notes: '',
  })

  const reload = useCallback(async () => {
    if (!user?.id) return
    setMsg(null)
    try {
      const [{ data: prof }, test, measList] = await Promise.all([
        fetchProfileWithPreferences(user.id),
        profileApi.getLatestEntryTest(user.id),
        profileApi.getMeasurementsHistory(user.id, 6),
      ])
      setPrefs((prof?.preferences as TimerPreferences) ?? {})
      setDisplayName(prof?.display_name ?? firstNameFromUser(user) ?? '')
      setLatestTest(test)
      const latest = measList[0] ?? null
      const prev = measList[1] ?? null
      setLatestMeas(latest)
      setPrevMeas(prev)
      setHist(measList)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur de chargement')
    }
  }, [user, profileApi])

  useEffect(() => {
    void reload()
  }, [reload])

  async function saveIdentity() {
    if (!user) return
    setBusy(true)
    setMsg(null)
    const { error } = await updateProfileDisplayName(displayName.trim() || null)
    if (error) setMsg(error.message)
    setBusy(false)
  }

  async function saveObjectif(next: TimerPreferences['objectif']) {
    setPrefs((p) => ({ ...p, objectif: next ?? undefined }))
    const { error } = await mergeProfilePreferences({ objectif: next })
    if (error) setMsg(error.message)
  }

  async function saveNiveau() {
    const v = prefs.niveau_actuel_libelle?.trim() ?? ''
    const { error } = await mergeProfilePreferences({ niveau_actuel_libelle: v || undefined })
    if (error) setMsg(error.message)
  }

  async function submitTest() {
    setBusy(true)
    setMsg(null)
    try {
      await profileApi.addEntryTest({
        tested_at: testForm.tested_at,
        reps_a: num(testForm.reps_a),
        reps_b: num(testForm.reps_b),
        reps_c: num(testForm.reps_c),
        reps_a1: num(testForm.reps_a1),
        notes: testForm.notes.trim() || null,
      })
      setTestForm({
        tested_at: new Date().toISOString().slice(0, 10),
        reps_a: '',
        reps_b: '',
        reps_c: '',
        reps_a1: '',
        notes: '',
      })
      await reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur')
    }
    setBusy(false)
  }

  async function submitMeas() {
    setBusy(true)
    setMsg(null)
    try {
      await profileApi.addMeasurement({
        measured_at: measForm.measured_at,
        weight_kg: num(measForm.weight_kg),
        chest_cm: num(measForm.chest_cm),
        waist_cm: num(measForm.waist_cm),
        hips_cm: num(measForm.hips_cm),
        thigh_cm: num(measForm.thigh_cm),
        calf_cm: num(measForm.calf_cm),
        shoulders_cm: num(measForm.shoulders_cm),
        arm_cm: num(measForm.arm_cm),
        photos_taken: measForm.photos_taken,
        photo_date: measForm.photo_date.trim() || null,
        notes: measForm.notes.trim() || null,
      })
      setMeasForm({
        measured_at: new Date().toISOString().slice(0, 10),
        weight_kg: '',
        chest_cm: '',
        waist_cm: '',
        hips_cm: '',
        thigh_cm: '',
        calf_cm: '',
        shoulders_cm: '',
        arm_cm: '',
        photos_taken: false,
        photo_date: '',
        notes: '',
      })
      await reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur')
    }
    setBusy(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const reco = latestTest?.recommended_program
  const recoText = reco ? RECO_MSG[reco] ?? reco : null

  return (
    <div className="page-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 className="h1" style={{ margin: 0 }}>
          Profil
        </h1>
        <Link className="btn btn-accent-outline" style={{ width: 'auto', padding: '10px 14px' }} to="/settings">
          Paramètres
        </Link>
      </div>
      <p className="body muted" style={{ marginTop: 6 }}>
        Tests de départ, mensurations et identité
      </p>

      {msg ? (
        <p className="msg msg-err" style={{ marginTop: 12 }}>
          {msg}
        </p>
      ) : null}

      <section className="profile-card stack" style={{ marginTop: 20 }}>
        <p className="eyebrow">Informations personnelles</p>
        <label className="profile-label" htmlFor="prenom">
          Prénom / pseudo affiché
        </label>
        <input
          id="prenom"
          className="input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="given-name"
        />
        <p className="mono muted" style={{ fontSize: 13 }}>
          {user?.email ?? '—'}
        </p>
        <label className="profile-label" htmlFor="obj">
          Objectif
        </label>
        <select
          id="obj"
          className="input"
          value={prefs.objectif ?? ''}
          onChange={(e) =>
            void saveObjectif(
              e.target.value === '' ? null : (e.target.value as NonNullable<TimerPreferences['objectif']>),
            )
          }
        >
          <option value="">— Choisir —</option>
          <option value="perte_gras">Perdre du gras</option>
          <option value="prise_muscle">Prendre du muscle</option>
          <option value="entretien">Entretien</option>
        </select>
        <label className="profile-label" htmlFor="niv">
          Niveau actuel (libre)
        </label>
        <input
          id="niv"
          className="input"
          value={prefs.niveau_actuel_libelle ?? ''}
          placeholder="ex. Niveau 4 · séance B"
          onChange={(e) => setPrefs((p) => ({ ...p, niveau_actuel_libelle: e.target.value }))}
          onBlur={() => void saveNiveau()}
        />
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void saveIdentity()}>
          Enregistrer le nom
        </button>
      </section>

      <section className="profile-card stack" style={{ marginTop: 16 }}>
        <p className="eyebrow">Tests de départ</p>
        <p className="body muted" style={{ fontSize: 13 }}>
          Série pleine amplitude après 3 min de repos entre chaque test (livre). Le nombre de reps sur <strong>B</strong>{' '}
          (dips) détermine le programme.
        </p>
        {latestTest ? (
          <div className="profile-last-block">
            <p className="mono muted" style={{ fontSize: 12 }}>
              Dernier test · {latestTest.tested_at}
            </p>
            <p className="mono" style={{ marginTop: 6 }}>
              A {latestTest.reps_a ?? '—'} · B {latestTest.reps_b ?? '—'} · C {latestTest.reps_c ?? '—'} · A1{' '}
              {latestTest.reps_a1 ?? '—'}
            </p>
            {recoText ? <div className="profile-reco">{recoText}</div> : null}
          </div>
        ) : (
          <p className="body muted">Aucun test enregistré.</p>
        )}

        <p className="profile-label">Nouveau test</p>
        <div className="profile-field-row">
          <label className="profile-sublabel" htmlFor="tdate">
            Date
          </label>
          <input
            id="tdate"
            className="input"
            type="date"
            value={testForm.tested_at}
            onChange={(e) => setTestForm((f) => ({ ...f, tested_at: e.target.value }))}
          />
        </div>
        {(['reps_a', 'reps_b', 'reps_c', 'reps_a1'] as const).map((k, i) => {
          const labels = ['A — Pompes pleine amplitude', 'B — Dips', 'C — Traction prise large', 'A1 — Pompes serrées']
          return (
            <div key={k} className="profile-num-wrap">
              <label className="profile-sublabel" htmlFor={k}>
                {labels[i]}
              </label>
              <div className="profile-num-inner">
                <input
                  id={k}
                  className="input"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={testForm[k]}
                  onChange={(e) => setTestForm((f) => ({ ...f, [k]: e.target.value }))}
                />
                <span className="profile-unit">reps</span>
              </div>
            </div>
          )
        })}
        <label className="profile-sublabel" htmlFor="tnotes">
          Notes
        </label>
        <textarea id="tnotes" className="input" rows={2} value={testForm.notes} onChange={(e) => setTestForm((f) => ({ ...f, notes: e.target.value }))} />
        <button type="button" className="btn btn-accent-outline" disabled={busy} onClick={() => void submitTest()}>
          Refaire les tests
        </button>
      </section>

      <section className="profile-card stack" style={{ marginTop: 16 }}>
        <p className="eyebrow">Mensurations</p>
        <p className="body muted" style={{ fontSize: 13 }}>
          À reprendre chaque mois ; compare avec la mensuration précédente.
        </p>
        {latestMeas ? (
          <div className="profile-last-block">
            <p className="mono muted" style={{ fontSize: 12 }}>
              Dernière mensuration · {latestMeas.measured_at}
            </p>
            <ul className="profile-meas-list">
              <li>
                Poids <span className="mono">{latestMeas.weight_kg ?? '—'}</span> kg{' '}
                <Delta cur={latestMeas.weight_kg ?? null} prev={prevMeas?.weight_kg ?? null} />
              </li>
              <li>
                Poitrine <span className="mono">{latestMeas.chest_cm ?? '—'}</span> cm <Delta cur={latestMeas.chest_cm ?? null} prev={prevMeas?.chest_cm ?? null} />
              </li>
              <li>
                Taille <span className="mono">{latestMeas.waist_cm ?? '—'}</span> cm <Delta cur={latestMeas.waist_cm ?? null} prev={prevMeas?.waist_cm ?? null} />
              </li>
              <li>
                Hanches <span className="mono">{latestMeas.hips_cm ?? '—'}</span> cm <Delta cur={latestMeas.hips_cm ?? null} prev={prevMeas?.hips_cm ?? null} />
              </li>
              <li>
                Cuisse <span className="mono">{latestMeas.thigh_cm ?? '—'}</span> cm <Delta cur={latestMeas.thigh_cm ?? null} prev={prevMeas?.thigh_cm ?? null} />
              </li>
              <li>
                Mollet <span className="mono">{latestMeas.calf_cm ?? '—'}</span> cm <Delta cur={latestMeas.calf_cm ?? null} prev={prevMeas?.calf_cm ?? null} />
              </li>
              <li>
                Épaules <span className="mono">{latestMeas.shoulders_cm ?? '—'}</span> cm{' '}
                <Delta cur={latestMeas.shoulders_cm ?? null} prev={prevMeas?.shoulders_cm ?? null} />
              </li>
              <li>
                Bras contracté <span className="mono">{latestMeas.arm_cm ?? '—'}</span> cm{' '}
                <Delta cur={latestMeas.arm_cm ?? null} prev={prevMeas?.arm_cm ?? null} />
              </li>
              <li>
                Photos (face, dos, profil, biceps) : {latestMeas.photos_taken ? 'oui' : 'non'}
                {latestMeas.photo_date ? <span className="mono muted"> · {latestMeas.photo_date}</span> : null}
              </li>
            </ul>
          </div>
        ) : (
          <p className="body muted">Aucune mensuration.</p>
        )}

        <p className="profile-label">Nouvelle mensuration</p>
        <div className="profile-field-row">
          <label className="profile-sublabel" htmlFor="mdate">
            Date
          </label>
          <input
            id="mdate"
            className="input"
            type="date"
            value={measForm.measured_at}
            onChange={(e) => setMeasForm((f) => ({ ...f, measured_at: e.target.value }))}
          />
        </div>
        {(
          [
            ['weight_kg', 'Poids', 'kg'],
            ['chest_cm', 'Tour de poitrine', 'cm'],
            ['waist_cm', 'Tour de taille', 'cm'],
            ['hips_cm', 'Tour de hanches', 'cm'],
            ['thigh_cm', 'Tour de cuisse', 'cm'],
            ['calf_cm', 'Tour de mollet', 'cm'],
            ['shoulders_cm', "Tour d'épaules", 'cm'],
            ['arm_cm', 'Tour de bras contracté', 'cm'],
          ] as const
        ).map(([key, label, unit]) => (
          <div key={key} className="profile-num-wrap">
            <label className="profile-sublabel" htmlFor={key}>
              {label}
            </label>
            <div className="profile-num-inner">
              <input
                id={key}
                className="input"
                type="number"
                step={unit === 'kg' ? '0.1' : '0.1'}
                inputMode="decimal"
                value={measForm[key]}
                onChange={(e) => setMeasForm((f) => ({ ...f, [key]: e.target.value }))}
              />
              <span className="profile-unit">{unit}</span>
            </div>
          </div>
        ))}
        <div className="profile-toggle-row">
          <span>Photos prises ce mois</span>
          <button
            type="button"
            className={`profile-switch${measForm.photos_taken ? ' on' : ''}`}
            onClick={() => setMeasForm((f) => ({ ...f, photos_taken: !f.photos_taken }))}
          >
            {measForm.photos_taken ? 'Oui' : 'Non'}
          </button>
        </div>
        {measForm.photos_taken ? (
          <>
            <label className="profile-sublabel" htmlFor="pdate">
              Date des photos
            </label>
            <input
              id="pdate"
              className="input"
              type="date"
              value={measForm.photo_date}
              onChange={(e) => setMeasForm((f) => ({ ...f, photo_date: e.target.value }))}
            />
          </>
        ) : null}
        <label className="profile-sublabel" htmlFor="mnotes">
          Notes
        </label>
        <textarea id="mnotes" className="input" rows={2} value={measForm.notes} onChange={(e) => setMeasForm((f) => ({ ...f, notes: e.target.value }))} />
        <button type="button" className="btn btn-accent-outline" disabled={busy} onClick={() => void submitMeas()}>
          Nouvelle mensuration
        </button>

        {hist.length ? (
          <>
            <p className="profile-label" style={{ marginTop: 16 }}>
              Historique (6 derniers)
            </p>
            <ul className="profile-hist-compact">
              {hist.map((h) => (
                <li key={h.id}>
                  <span className="mono">{h.measured_at}</span>
                  <span className="mono muted">{h.weight_kg != null ? `${h.weight_kg} kg` : '—'}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <button type="button" className="btn btn-secondary" style={{ marginTop: 24 }} onClick={() => void handleSignOut()}>
        Se déconnecter
      </button>
    </div>
  )
}
