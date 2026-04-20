// src/pages/HistoryPage.tsx
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Download, Trophy, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useWorkout } from '@/context/WorkoutContext'

export function HistoryPage() {
  const navigate = useNavigate()
  const { workoutHistory, deleteWorkout } = useWorkout()

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify(workoutHistory, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gym-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 page-transition">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        {workoutHistory.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        )}
      </div>

      {workoutHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No workouts logged yet.</p>
          <Button className="mt-4" onClick={() => navigate('/scan')}>
            Scan & Start Workout
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workoutHistory.map((workout) => {
            const totalVol = workout.totalVolume
              ?? workout.sets.reduce((s, set) => s + set.weight * set.reps, 0)

            return (
              <Card
                key={workout.id}
                className="cursor-pointer transition-colors hover:bg-accent/30"
                onClick={() => navigate(`/exercise-history/${workout.exerciseId}`)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{workout.exerciseName}</p>
                      {workout.isPR && (
                        <Badge className="shrink-0 bg-yellow-500 text-black hover:bg-yellow-400">
                          <Trophy className="mr-1 h-3 w-3" />PR
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(workout.date), 'MMM d, yyyy · h:mm a')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {workout.sets.length} sets
                      {totalVol > 0 && ` · ${totalVol.toLocaleString()}${workout.weightUnit ?? 'kg'} volume`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteWorkout(workout.id)
                      }}
                      aria-label="Delete workout"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
