import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const { error: err } = await signIn(email.trim(), password)
    setPending(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <p className="eyebrow">Lafay Tracker</p>
        <h1 className="h1">Connexion</h1>
        <p className="body muted" style={{ marginTop: 8 }}>
          Accès sécurisé à ton espace d’entraînement.
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>
          {error ? (
            <p className="msg msg-err" role="alert">
              {error}
            </p>
          ) : null}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-switch">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
