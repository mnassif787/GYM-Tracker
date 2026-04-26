// src/pages/ProgressPage.tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import { Dumbbell, BarChart2, Layers, Calendar, QrCode } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProgressChart } from '@/components/ProgressChart'
import { MuscleHeatmap } from '@/components/MuscleHeatmap'
import { useWorkout } from '@/context/WorkoutContext'

export function ProgressPage() {
  const navigate = useNavigate()
  const { workoutHistory, exercises } = useWorkout()
  const [heatmapView, setHeatmapView] = useState<'front' | 'back'>('front')

  const last7Days = useMemo(() => {
    const cutoff = subDays(new Date(), 7).getTime()
    return workoutHistory.filter((w) => new Date(w.date).getTime() >= cutoff)
  }, [workoutHistory])

  const weeklyVolumeByMuscle = useMemo(() => {
    const vol: Record<string, number> = {}
    for (const w of last7Days) {
      const totalVol = w.sets.reduce((s, set) => s + set.weight * set.reps, 0)
      for (const m of w.targetMuscles) {
        vol[m] = (vol[m] ?? 0) + totalVol
      }
    }
    const sorted = Object.entries(vol).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const max = sorted[0]?.[1] ?? 1
    return sorted.map(([muscle, volume]) => ({ muscle, volume, pct: volume / max }))
  }, [last7Days])

  const stats = useMemo(() => {
    const totalSets = workoutHistory.reduce((sum, w) => sum + w.sets.length, 0)
    const uniqueExercises = new Set(workoutHistory.map((w) => w.exerciseId)).size
    const lastDate = workoutHistory.length > 0
      ? format(new Date(workoutHistory[0].date), 'MMM d')
      : null

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

  const loggedExercises = useMemo(() => {
    const ids = new Set(workoutHistory.map((w) => w.exerciseId))
    return exercises.filter((e) => ids.has(e.id))
  }, [workoutHistory, exercises])

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-28 space-y-6 page-transition">
      <h1 className="text-2xl font-bold">Progress</h1>

      {workoutHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
            <BarChart2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">No workout data yet</p>
          <p className="mt-2 max-w-[240px] text-sm text-muted-foreground">
            Log your first exercise to start tracking progress, volume, and muscle coverage.
          </p>
          <Button className="mt-6" onClick={() => navigate('/scan')}>
            <QrCode className="h-4 w-4 mr-2" /> Scan Your First Machine
          </Button>
        </div>
      ) : (
        <>

      {/* Stats 2Ã—2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Dumbbell className="h-5 w-5" />} label="Workouts" value={workoutHistory.length} />
        <StatCard icon={<BarChart2 className="h-5 w-5" />} label="Exercises" value={stats.uniqueExercises} />
        <StatCard icon={<Layers className="h-5 w-5" />} label="Total Sets" value={stats.totalSets} />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Last Session"
          value={stats.lastDate ?? '–'}
          small
        />
      </div>

      {/* Most used muscles */}
      {stats.muscleRanking.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
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

      {/* Weekly volume by muscle */}
      {weeklyVolumeByMuscle.length > 0 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly Volume by Muscle</CardTitle>
            <p className="text-xs text-muted-foreground">Last 7 days · total weight × reps</p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {weeklyVolumeByMuscle.map(({ muscle, volume, pct }) => (
              <div key={muscle} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{muscle}</span>
                  <span className="text-muted-foreground tabular-nums">{volume.toLocaleString()} kg</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Progress chart */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Max Weight Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressChart workouts={workoutHistory} exercises={loggedExercises} />
        </CardContent>
      </Card>

      {/* Muscle Heatmap */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Weekly Muscle Coverage</CardTitle>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant={heatmapView === 'front' ? 'default' : 'outline'}
                className="h-7 px-3 text-xs"
                onClick={() => setHeatmapView('front')}
              >
                Front
              </Button>
              <Button
                size="sm"
                variant={heatmapView === 'back' ? 'default' : 'outline'}
                className="h-7 px-3 text-xs"
                onClick={() => setHeatmapView('back')}
              >
                Back
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Last 7 days · {last7Days.length} workouts</p>
        </CardHeader>
        <CardContent>
          <MuscleHeatmap workouts={last7Days} view={heatmapView} />
        </CardContent>
      </Card>
        </>
      )}
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
    <Card className="rounded-2xl">
      <CardContent className="flex flex-col items-start gap-2 p-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className={`font-bold leading-none ${small ? 'text-xl' : 'text-3xl'}`}>{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

