import { Link } from 'react-router-dom'
import { supabaseBuildEnvFlags } from '../lib/supabase'

export function SetupPage() {
  const { hasUrl, hasAnonKey } = supabaseBuildEnvFlags

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
        <div className="card-flat" style={{ marginTop: 16, padding: 14 }}>
          <p className="eyebrow">Diagnostic (dernier build)</p>
          {hasUrl && hasAnonKey ? (
            <p className="body muted" style={{ marginTop: 10 }}>
              Les deux variables <code className="code">VITE_*</code> sont présentes dans ce déploiement. Clique sur
              Réessayer : si tu restes ici, vide le cache du navigateur ou ouvre un onglet privé.
            </p>
          ) : (
            <>
              <ul className="body muted" style={{ marginTop: 10, paddingLeft: 18, lineHeight: 1.55 }}>
                <li>
                  <code className="code">VITE_SUPABASE_URL</code> :{' '}
                  {hasUrl ? 'présente dans le bundle' : 'absente — le build ne l’a pas vue'}
                </li>
                <li>
                  <code className="code">VITE_SUPABASE_ANON_KEY</code> :{' '}
                  {hasAnonKey ? 'présente dans le bundle' : 'absente — le build ne l’a pas vue'}
                </li>
              </ul>
              <p className="body muted" style={{ marginTop: 12 }}>
                Sur Netlify : <strong>Site configuration</strong> → <strong>Environment variables</strong> → pour chaque
                variable, le périmètre doit inclure <strong>Builds</strong> (ou « All scopes »). Si elles ne concernent que
                les <em>Functions</em>, Vite ne les voit pas pendant <code className="code">npm run build</code>.
              </p>
              <p className="body muted" style={{ marginTop: 8 }}>
                Noms exacts (sensible à la casse) : <code className="code">VITE_SUPABASE_URL</code> et{' '}
                <code className="code">VITE_SUPABASE_ANON_KEY</code> — pas <code className="code">SUPABASE_URL</code> sans
                préfixe <code className="code">VITE_</code>.
              </p>
            </>
          )}
        </div>
        <p className="body muted" style={{ marginTop: 14 }}>
          Après modification des variables : déclenche un <strong>nouveau déploiement</strong> (idéalement « Clear cache
          and deploy »). Les valeurs sont figées au moment du build, pas au chargement de la page dans le navigateur.
        </p>
        <p className="body muted" style={{ marginTop: 10 }}>
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
