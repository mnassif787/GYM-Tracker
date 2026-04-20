// src/pages/ProgressPage.tsx
import { useMemo } from 'react'
import { format } from 'date-fns'
import { Dumbbell, BarChart2, Layers, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressChart } from '@/components/ProgressChart'
import { useWorkout } from '@/context/WorkoutContext'

export function ProgressPage() {
  const { workoutHistory, exercises } = useWorkout()

  const stats = useMemo(() => {
    const totalSets = workoutHistory.reduce((sum, w) => sum + w.sets.length, 0)
    const uniqueExercises = new Set(workoutHistory.map((w) => w.exerciseId)).size
    const lastDate =
      workoutHistory.length > 0
        ? format(new Date(workoutHistory[0].date), 'MMM d, yyyy')
        : null

    // Muscle frequency
    const muscleCount: Record<string, number> = {}
    for (const w of workoutHistory) {
      for (const m of w.targetMuscles) {
        muscleCount[m] = (muscleCount[m] ?? 0) + 1
      }
    }
    const muscleRanking = Object.entries(muscleCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    return { totalSets, uniqueExercises, lastDate, muscleRanking }
  }, [workoutHistory])

  // Exercises that have at least one workout logged
  const loggedExercises = useMemo(() => {
    const ids = new Set(workoutHistory.map((w) => w.exerciseId))
    return exercises.filter((e) => ids.has(e.id))
  }, [workoutHistory, exercises])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 page-transition">
      <h1 className="mb-6 text-2xl font-bold">Progress</h1>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Dumbbell className="h-5 w-5" />} label="Workouts" value={workoutHistory.length} />
        <StatCard icon={<BarChart2 className="h-5 w-5" />} label="Exercises" value={stats.uniqueExercises} />
        <StatCard icon={<Layers className="h-5 w-5" />} label="Total Sets" value={stats.totalSets} />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Last Session"
          value={stats.lastDate ?? '—'}
          small
        />
      </div>

      {/* Most used muscles */}
      {stats.muscleRanking.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Most Trained Muscles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.muscleRanking.map(([muscle, count]) => (
                <div key={muscle} className="flex items-center gap-1.5">
                  <Badge variant="secondary">{muscle}</Badge>
                  <span className="text-xs text-muted-foreground">×{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Max Weight Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressChart workouts={workoutHistory} exercises={loggedExercises} />
        </CardContent>
      </Card>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  small?: boolean
}

function StatCard({ icon, label, value, small }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
        <div className="text-primary">{icon}</div>
        <p className={small ? 'text-lg font-bold' : 'text-2xl font-bold'}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
