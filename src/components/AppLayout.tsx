import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: '/', label: 'Accueil', icon: '⌂', end: true },
  { to: '/programs', label: 'Programmes', icon: '▤' },
  { to: '/session', label: 'Séance', icon: '▶', end: true },
  { to: '/timer', label: 'Chrono', icon: '◷' },
  { to: '/history', label: 'Historique', icon: '☰' },
  { to: '/journal', label: 'Journal', icon: '✎' },
  { to: '/stats', label: 'Stats', icon: '↗' },
]

export function AppLayout() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="app-brand">
          <span className="app-brand-mark" aria-hidden />
          <span className="app-brand-text">Lafay Tracker</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn-icon"
            onClick={() => navigate('/settings')}
            aria-label="Paramètres"
            title="Paramètres"
          >
            <span aria-hidden style={{ fontSize: 18 }}>
              ⚙
            </span>
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={() => navigate('/profile')}
            aria-label="Profil"
            title="Profil"
          >
            <span className="app-avatar" aria-hidden>
              {(user?.email?.[0] ?? '?').toUpperCase()}
            </span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-bnav" aria-label="Navigation principale">
        {nav.map(({ to, label, icon, end: isEnd }) => (
          <NavLink
            key={to}
            to={to}
            end={isEnd === true}
            className={({ isActive }) => `bnav-item${isActive ? ' on' : ''}`}
          >
            <span className="bnav-ic" aria-hidden>
              {icon}
            </span>
            <span className="bnav-lb">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
