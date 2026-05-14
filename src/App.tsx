import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { GuestOnly } from './components/GuestOnly'
import { RequireAuth } from './components/RequireAuth'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { HistoryPage } from './pages/HistoryPage'
import { HomePage } from './pages/HomePage'
import { JournalPage } from './pages/JournalPage'
import { LoginPage } from './pages/LoginPage'
import { ProgramDetailPage } from './pages/ProgramDetailPage'
import { Programs } from './pages/Programs'
import { RegisterPage } from './pages/RegisterPage'
import { SessionCompletePage } from './pages/SessionCompletePage'
import { SessionPage } from './pages/SessionPage'
import { SetupPage } from './pages/SetupPage'
import { StatsPage } from './pages/StatsPage'
import { TimerPage } from './pages/TimerPage'

export function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="programs" element={<Programs />} />
          <Route path="programs/:slug" element={<ProgramDetailPage />} />
          <Route path="session" element={<SessionPage />} />
          <Route path="session/:workoutId/complete" element={<SessionCompletePage />} />
          <Route path="session/complete" element={<SessionCompletePage />} />
          <Route path="timer" element={<TimerPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="account" element={<Navigate to="/profile" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
