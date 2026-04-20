// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { ScanPage } from '@/pages/ScanPage'
import { LogPage } from '@/pages/LogPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { ExerciseHistoryPage } from '@/pages/ExerciseHistoryPage'
import { ExercisesPage } from '@/pages/ExercisesPage'
import { MachinePage } from '@/pages/admin/MachinePage'
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
      <main className="pb-20">
        <Routes>
          <Route path="/" element={<Navigate to="/scan" replace />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/exercise-history/:id" element={<ExerciseHistoryPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
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
