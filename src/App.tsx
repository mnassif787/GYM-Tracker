// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { HomePage } from '@/pages/HomePage'
import { ScanPage } from '@/pages/ScanPage'
import { LogPage } from '@/pages/LogPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { ExerciseHistoryPage } from '@/pages/ExerciseHistoryPage'
import { ExercisesPage } from '@/pages/ExercisesPage'
import { MachinePage } from '@/pages/admin/MachinePage'
import { ProfilePage } from '@/pages/ProfilePage'
import { TemplatesPage } from '@/pages/TemplatesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { useWorkout } from '@/context/WorkoutContext'

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdminMode } = useWorkout()
  if (!isAdminMode) return <Navigate to="/scan" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* aria-live region for screen readers — sonner toasts write here */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="sr-announcer" />
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/exercise-history/:id" element={<ExerciseHistoryPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/admin/machines"
            element={
              <AdminGuard>
                <MachinePage />
              </AdminGuard>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Navbar />
    </div>
  )
}