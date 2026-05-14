import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchProfileWithPreferences, mergeProfilePreferences, type TimerPreferences } from '../lib/catalog'
import { DEFAULT_REPOS_SECONDS, REPOS_PRESETS_LAFAY } from '../lib/lafayTimer'

export function SettingsPage() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<TimerPreferences>({})
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await fetchProfileWithPreferences(user.id)
    if (error) setMsg(error.message)
    else setPrefs((data?.preferences as TimerPreferences) ?? {})
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    void load()
  }, [load])

  async function patch(p: Partial<TimerPreferences>) {
    setMsg(null)
    const next = { ...prefs, ...p }
    setPrefs(next)
    const { error } = await mergeProfilePreferences(p)
    if (error) setMsg(error.message)
  }

  const reposDefaut = typeof prefs.repos_defaut_secondes === 'number' ? prefs.repos_defaut_secondes : DEFAULT_REPOS_SECONDS

  return (
    <div className="page-pad">
      <Link className="t-back" to="/profile" style={{ marginBottom: 12 }}>
        <span aria-hidden>←</span>
        <span>Profil</span>
      </Link>
      <h1 className="h1">Paramètres</h1>
      <p className="body muted" style={{ marginTop: 6 }}>
        Minuterie et préférences d’entraînement
      </p>

      {msg ? (
        <p className="msg msg-err" style={{ marginTop: 12 }}>
          {msg}
        </p>
      ) : null}

      <section className="profile-card stack" style={{ marginTop: 20 }}>
        <p className="eyebrow">Minuterie</p>
        {loading ? (
          <p className="body muted">Chargement…</p>
        ) : (
          <>
            <label className="profile-label" htmlFor="repos-def">
              Repos par défaut (si non défini sur l’exercice)
            </label>
            <select
              id="repos-def"
              className="input"
              value={reposDefaut}
              onChange={(e) => void patch({ repos_defaut_secondes: Number(e.target.value) })}
            >
              {REPOS_PRESETS_LAFAY.map((p) => (
                <option key={p.seconds} value={p.seconds}>
                  {p.label} — {p.description}
                </option>
              ))}
            </select>

            <div className="profile-toggle-row">
              <span>Son de fin</span>
              <button
                type="button"
                className={`profile-switch${prefs.son_fin !== false ? ' on' : ''}`}
                onClick={() => void patch({ son_fin: !(prefs.son_fin !== false) })}
                aria-pressed={prefs.son_fin !== false}
              >
                {prefs.son_fin !== false ? 'Activé' : 'Désactivé'}
              </button>
            </div>
            <div className="profile-toggle-row">
              <span>Vibration</span>
              <button
                type="button"
                className={`profile-switch${prefs.vibration !== false ? ' on' : ''}`}
                onClick={() => void patch({ vibration: !(prefs.vibration !== false) })}
                aria-pressed={prefs.vibration !== false}
              >
                {prefs.vibration !== false ? 'Activé' : 'Désactivé'}
              </button>
            </div>
            <div className="profile-toggle-row">
              <span>Démarrage auto après validation d’une série</span>
              <button
                type="button"
                className={`profile-switch${prefs.demarrage_auto !== false ? ' on' : ''}`}
                onClick={() => void patch({ demarrage_auto: !(prefs.demarrage_auto !== false) })}
                aria-pressed={prefs.demarrage_auto !== false}
              >
                {prefs.demarrage_auto !== false ? 'Activé' : 'Désactivé'}
              </button>
            </div>
            <div className="profile-toggle-row">
              <span>Appliquer automatiquement le repos recommandé du programme</span>
              <button
                type="button"
                className={`profile-switch${prefs.appliquer_repos_programme_auto !== false ? ' on' : ''}`}
                onClick={() => void patch({ appliquer_repos_programme_auto: !(prefs.appliquer_repos_programme_auto !== false) })}
                aria-pressed={prefs.appliquer_repos_programme_auto !== false}
              >
                {prefs.appliquer_repos_programme_auto !== false ? 'Activé' : 'Désactivé'}
              </button>
            </div>
            <div className="profile-toggle-row">
              <span>Autoriser override manuel du repos</span>
              <button
                type="button"
                className={`profile-switch${prefs.autoriser_override_manuel_repos !== false ? ' on' : ''}`}
                onClick={() => void patch({ autoriser_override_manuel_repos: !(prefs.autoriser_override_manuel_repos !== false) })}
                aria-pressed={prefs.autoriser_override_manuel_repos !== false}
              >
                {prefs.autoriser_override_manuel_repos !== false ? 'Activé' : 'Désactivé'}
              </button>
            </div>
            <div className="profile-toggle-row">
              <span>Afficher les critères de passage en séance</span>
              <button
                type="button"
                className={`profile-switch${prefs.afficher_criteres_passage_en_seance !== false ? ' on' : ''}`}
                onClick={() =>
                  void patch({
                    afficher_criteres_passage_en_seance: !(prefs.afficher_criteres_passage_en_seance !== false),
                  })
                }
                aria-pressed={prefs.afficher_criteres_passage_en_seance !== false}
              >
                {prefs.afficher_criteres_passage_en_seance !== false ? 'Activé' : 'Désactivé'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
