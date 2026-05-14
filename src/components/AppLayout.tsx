import { useCallback, useEffect, useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, closeMenu])

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          type="button"
          className="btn-icon"
          aria-label="Ouvrir le menu de navigation"
          aria-expanded={menuOpen}
          aria-controls="app-nav-drawer"
          onClick={() => setMenuOpen(true)}
        >
          <span className="hamburger-icon" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
        <div className="app-brand app-brand--header">
          <span className="app-brand-mark" aria-hidden />
          <span className="app-brand-text">Lafay Tracker</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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

      {menuOpen ? (
        <div className="app-nav-drawer-root">
          <button type="button" className="app-nav-drawer-backdrop" onClick={closeMenu} aria-label="Fermer le menu" />
          <nav id="app-nav-drawer" className="app-nav-drawer-panel" aria-label="Navigation principale">
            <div className="app-nav-drawer-head">
              <span className="eyebrow">Navigation</span>
              <button type="button" className="btn-icon sm" aria-label="Fermer le menu" onClick={closeMenu}>
                ✕
              </button>
            </div>
            {nav.map(({ to, label, icon, end: isEnd }) => (
              <NavLink
                key={to}
                to={to}
                end={isEnd === true}
                className={({ isActive }) => `app-nav-drawer-link${isActive ? ' on' : ''}`}
                onClick={closeMenu}
              >
                <span className="app-nav-drawer-ic" aria-hidden>
                  {icon}
                </span>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  )
}
