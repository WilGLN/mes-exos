import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProfileCollapsible } from '../components/profile/ProfileCollapsible'
import { ProfileIconActions } from '../components/profile/ProfileIconActions'
import { useAuth } from '../context/AuthContext'
import {
  fetchProfileWithPreferences,
  mergeProfilePreferences,
  updateProfileDisplayName,
  type TimerPreferences,
} from '../lib/catalog'
import { firstNameFromUser } from '../lib/greeting'
import {
  useProfile,
  type BodyMeasurementInput,
  type BodyMeasurementRow,
  type EntryTestInput,
  type EntryTestRow,
} from '../hooks/useProfile'

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

function emptyTestForm() {
  return {
    tested_at: new Date().toISOString().slice(0, 10),
    reps_a: '',
    reps_b: '',
    reps_c: '',
    reps_a1: '',
    notes: '',
  }
}

function testRowToForm(row: EntryTestRow) {
  return {
    tested_at: row.tested_at,
    reps_a: row.reps_a != null ? String(row.reps_a) : '',
    reps_b: row.reps_b != null ? String(row.reps_b) : '',
    reps_c: row.reps_c != null ? String(row.reps_c) : '',
    reps_a1: row.reps_a1 != null ? String(row.reps_a1) : '',
    notes: row.notes ?? '',
  }
}

function emptyMeasForm() {
  return {
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
  }
}

function measRowToForm(row: BodyMeasurementRow) {
  return {
    measured_at: row.measured_at,
    weight_kg: row.weight_kg != null ? String(row.weight_kg) : '',
    chest_cm: row.chest_cm != null ? String(row.chest_cm) : '',
    waist_cm: row.waist_cm != null ? String(row.waist_cm) : '',
    hips_cm: row.hips_cm != null ? String(row.hips_cm) : '',
    thigh_cm: row.thigh_cm != null ? String(row.thigh_cm) : '',
    calf_cm: row.calf_cm != null ? String(row.calf_cm) : '',
    shoulders_cm: row.shoulders_cm != null ? String(row.shoulders_cm) : '',
    arm_cm: row.arm_cm != null ? String(row.arm_cm) : '',
    photos_taken: row.photos_taken,
    photo_date: row.photo_date ?? '',
    notes: row.notes ?? '',
  }
}

function formatReps(v: number | null | undefined): string {
  return v != null ? String(v) : '—'
}

function testFormToInput(form: ReturnType<typeof emptyTestForm>): EntryTestInput {
  return {
    tested_at: form.tested_at,
    reps_a: num(form.reps_a),
    reps_b: num(form.reps_b),
    reps_c: num(form.reps_c),
    reps_a1: num(form.reps_a1),
    notes: form.notes.trim() || null,
  }
}

function measFormToInput(form: ReturnType<typeof emptyMeasForm>): BodyMeasurementInput {
  return {
    measured_at: form.measured_at,
    weight_kg: num(form.weight_kg),
    chest_cm: num(form.chest_cm),
    waist_cm: num(form.waist_cm),
    hips_cm: num(form.hips_cm),
    thigh_cm: num(form.thigh_cm),
    calf_cm: num(form.calf_cm),
    shoulders_cm: num(form.shoulders_cm),
    arm_cm: num(form.arm_cm),
    photos_taken: form.photos_taken,
    photo_date: form.photo_date.trim() || null,
    notes: form.notes.trim() || null,
  }
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
  const {
    getLatestEntryTest,
    getMeasurementsHistory,
    addEntryTest,
    updateEntryTest,
    deleteEntryTest,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
  } = useProfile()

  const [prefs, setPrefs] = useState<TimerPreferences>({})
  const [displayName, setDisplayName] = useState('')
  const [latestTest, setLatestTest] = useState<EntryTestRow | null>(null)
  const [latestMeas, setLatestMeas] = useState<BodyMeasurementRow | null>(null)
  const [prevMeas, setPrevMeas] = useState<BodyMeasurementRow | null>(null)
  const [hist, setHist] = useState<BodyMeasurementRow[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [testEditingId, setTestEditingId] = useState<string | null>(null)
  const [measEditingId, setMeasEditingId] = useState<string | null>(null)
  const [testFormOpen, setTestFormOpen] = useState(false)
  const [measFormOpen, setMeasFormOpen] = useState(false)

  const [testForm, setTestForm] = useState(emptyTestForm)
  const [measForm, setMeasForm] = useState(emptyMeasForm)

  const reload = useCallback(async () => {
    if (!user?.id) return
    setMsg(null)
    try {
      const [{ data: prof }, test, measList] = await Promise.all([
        fetchProfileWithPreferences(user.id),
        getLatestEntryTest(user.id),
        getMeasurementsHistory(user.id, 6),
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
  }, [user?.id, getLatestEntryTest, getMeasurementsHistory])

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

  function cancelTestEdit() {
    setTestEditingId(null)
    setTestForm(emptyTestForm())
    setTestFormOpen(false)
    setMsg(null)
  }

  function startEditTest(row: EntryTestRow) {
    setTestEditingId(row.id)
    setTestForm(testRowToForm(row))
    setTestFormOpen(true)
    setMsg(null)
    setOkMsg(null)
  }

  async function submitTest() {
    const input = testFormToInput(testForm)
    if (input.reps_b == null) {
      setMsg('Indique au minimum les reps sur B (dips) pour enregistrer le test.')
      setOkMsg(null)
      return
    }
    setBusy(true)
    setMsg(null)
    setOkMsg(null)
    try {
      const saved = testEditingId
        ? await updateEntryTest(testEditingId, input)
        : await addEntryTest(input)
      setLatestTest(saved)
      setOkMsg(
        testEditingId
          ? `Test mis à jour : A ${formatReps(saved.reps_a)} · B ${formatReps(saved.reps_b)} · C ${formatReps(saved.reps_c)} · A1 ${formatReps(saved.reps_a1)}`
          : `Test enregistré : A ${formatReps(saved.reps_a)} · B ${formatReps(saved.reps_b)} · C ${formatReps(saved.reps_c)} · A1 ${formatReps(saved.reps_a1)}`,
      )
      setTestEditingId(null)
      setTestForm(emptyTestForm())
      setTestFormOpen(false)
      await reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur')
    }
    setBusy(false)
  }

  async function deleteTest(id: string) {
    if (!window.confirm('Supprimer ce test de départ ?')) return
    setBusy(true)
    setMsg(null)
    setOkMsg(null)
    try {
      await deleteEntryTest(id)
      if (testEditingId === id) cancelTestEdit()
      setOkMsg('Test supprimé.')
      await reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur')
    }
    setBusy(false)
  }

  function cancelMeasEdit() {
    setMeasEditingId(null)
    setMeasForm(emptyMeasForm())
    setMeasFormOpen(false)
    setMsg(null)
  }

  function startEditMeas(row: BodyMeasurementRow) {
    setMeasEditingId(row.id)
    setMeasForm(measRowToForm(row))
    setMeasFormOpen(true)
    setMsg(null)
    setOkMsg(null)
  }

  async function submitMeas() {
    const input = measFormToInput(measForm)
    const hasValue =
      input.weight_kg != null ||
      input.chest_cm != null ||
      input.waist_cm != null ||
      input.hips_cm != null ||
      input.thigh_cm != null ||
      input.calf_cm != null ||
      input.shoulders_cm != null ||
      input.arm_cm != null
    if (!hasValue) {
      setMsg('Renseigne au moins une mensuration avant d’enregistrer.')
      setOkMsg(null)
      return
    }
    setBusy(true)
    setMsg(null)
    setOkMsg(null)
    try {
      if (measEditingId) {
        await updateMeasurement(measEditingId, input)
        setOkMsg('Mensuration mise à jour.')
      } else {
        await addMeasurement(input)
        setOkMsg('Mensuration enregistrée.')
      }
      setMeasEditingId(null)
      setMeasForm(emptyMeasForm())
      setMeasFormOpen(false)
      await reload()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur')
    }
    setBusy(false)
  }

  async function deleteMeas(id: string) {
    if (!window.confirm('Supprimer cette mensuration ?')) return
    setBusy(true)
    setMsg(null)
    setOkMsg(null)
    try {
      await deleteMeasurement(id)
      if (measEditingId === id) cancelMeasEdit()
      setOkMsg('Mensuration supprimée.')
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

      {okMsg ? (
        <p className="msg msg-ok" style={{ marginTop: 12 }} role="status">
          {okMsg}
        </p>
      ) : null}
      {msg ? (
        <p className="msg msg-err" style={{ marginTop: 12 }} role="alert">
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
            <div className="profile-last-header">
              <p className="mono muted" style={{ fontSize: 12, margin: 0 }}>
                Dernier test · {latestTest.tested_at}
              </p>
              <ProfileIconActions
                busy={busy}
                onEdit={() => startEditTest(latestTest)}
                onDelete={() => void deleteTest(latestTest.id)}
              />
            </div>
            <p className="mono" style={{ marginTop: 6 }}>
              A {formatReps(latestTest.reps_a)} · B {formatReps(latestTest.reps_b)} · C {formatReps(latestTest.reps_c)} · A1{' '}
              {formatReps(latestTest.reps_a1)}
            </p>
            {recoText ? <div className="profile-reco">{recoText}</div> : null}
          </div>
        ) : (
          <p className="body muted">Aucun test enregistré.</p>
        )}

        <ProfileCollapsible
          id="profile-new-test"
          title={testEditingId ? 'Modifier le test' : 'Nouveau test'}
          open={testFormOpen}
          onToggle={() => setTestFormOpen((o) => !o)}
        >
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
        <ProfileIconActions
          busy={busy}
          saveLabel={testEditingId ? 'Mettre à jour le test' : 'Enregistrer le test'}
          onSave={() => void submitTest()}
          onCancel={testEditingId ? cancelTestEdit : undefined}
        />
        </ProfileCollapsible>
      </section>

      <section className="profile-card stack" style={{ marginTop: 16 }}>
        <p className="eyebrow">Mensurations</p>
        <p className="body muted" style={{ fontSize: 13 }}>
          À reprendre chaque mois ; compare avec la mensuration précédente.
        </p>
        {latestMeas ? (
          <div className="profile-last-block">
            <div className="profile-last-header">
              <p className="mono muted" style={{ fontSize: 12, margin: 0 }}>
                Dernière mensuration · {latestMeas.measured_at}
              </p>
              <ProfileIconActions
                busy={busy}
                onEdit={() => startEditMeas(latestMeas)}
                onDelete={() => void deleteMeas(latestMeas.id)}
              />
            </div>
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

        <ProfileCollapsible
          id="profile-new-meas"
          title={measEditingId ? 'Modifier la mensuration' : 'Nouvelle mensuration'}
          open={measFormOpen}
          onToggle={() => setMeasFormOpen((o) => !o)}
        >
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
        <ProfileIconActions
          busy={busy}
          saveLabel={measEditingId ? 'Mettre à jour la mensuration' : 'Enregistrer la mensuration'}
          onSave={() => void submitMeas()}
          onCancel={measEditingId ? cancelMeasEdit : undefined}
        />
        </ProfileCollapsible>

        {hist.length ? (
          <>
            <p className="profile-label" style={{ marginTop: 16 }}>
              Historique (6 derniers)
            </p>
            <ul className="profile-hist-compact">
              {hist.map((h) => (
                <li key={h.id} className={measEditingId === h.id ? 'profile-hist-editing' : undefined}>
                  <div className="profile-hist-main">
                    <span className="mono">{h.measured_at}</span>
                    <span className="mono muted">{h.weight_kg != null ? `${h.weight_kg} kg` : '—'}</span>
                  </div>
                  <ProfileIconActions
                    busy={busy}
                    onEdit={() => startEditMeas(h)}
                    onDelete={() => void deleteMeas(h.id)}
                  />
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
