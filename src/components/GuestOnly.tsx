import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Redirige les utilisateurs connectés vers l’accueil. */
export function GuestOnly() {
  const { user, loading, configured } = useAuth()

  if (loading) {
    return (
      <div className="app-boot">
        <div className="app-boot-inner">
          <div className="spinner" aria-hidden />
          <p>Chargement…</p>
        </div>
      </div>
    )
  }

  if (!configured) {
    return <Navigate to="/setup" replace />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
