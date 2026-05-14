import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth() {
  const { user, loading, configured } = useAuth()
  const location = useLocation()

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
    return <Navigate to="/setup" replace state={{ from: location }} />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
