import { Link } from 'react-router-dom'

export function SetupPage() {
  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="h1">Configuration requise</h1>
        <p className="body" style={{ marginTop: 12 }}>
          Crée un fichier <code className="code">.env.local</code> à la racine du projet (il est ignoré par Git)
          avec&nbsp;:
        </p>
        <pre className="pre-block">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=ta_cle_anon`}
        </pre>
        <p className="body muted">
          Utilise uniquement la clé <strong>anon</strong> publique. Ne mets jamais la clé <strong>service_role</strong> dans
          le front.
        </p>
        <Link className="btn btn-secondary" to="/login" style={{ marginTop: 16 }}>
          Réessayer
        </Link>
      </div>
    </div>
  )
}
