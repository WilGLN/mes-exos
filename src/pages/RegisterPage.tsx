import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setPending(true)
    const { error: err } = await signUp(email.trim(), password)
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }
    setInfo('Compte créé. Vérifie ta boîte mail si la confirmation est activée sur Supabase, puis connecte-toi.')
    setPassword('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <p className="eyebrow">Entrainos Wil</p>
        <h1 className="h1">Inscription</h1>
        <p className="body muted" style={{ marginTop: 8 }}>
          Crée un compte pour synchroniser tes données (à brancher sur tes tables Supabase).
        </p>

        <form className="auth-form" onSubmit={onSubmit}>
          <label className="field">
            <span className="field-lbl">E-mail</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.com"
            />
          </label>
          <label className="field">
            <span className="field-lbl">Mot de passe</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Au moins 6 caractères"
            />
          </label>
          {error ? (
            <p className="msg msg-err" role="alert">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="msg msg-ok" role="status">
              {info}
            </p>
          ) : null}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-switch">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
        {info ? (
          <button type="button" className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => navigate('/login')}>
            Aller à la connexion
          </button>
        ) : null}
      </div>
    </div>
  )
}
