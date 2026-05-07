// src/components/QuickExerciseGrid.tsx
import { useNavigate } from 'react-router-dom'
import { Dumbbell, ChevronRight, TrendingUp, History } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Exercise, Workout } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface QuickExerciseGridProps {
  exercises: Exercise[]
  workoutHistory: Workout[]
  onStartExercise: (exercise: Exercise) => void
  maxItems?: number
  showViewAll?: boolean
}

export function QuickExerciseGrid({ 
  exercises, 
  workoutHistory, 
  onStartExercise,
  maxItems = 6,
  showViewAll = true,
}: QuickExerciseGridProps) {
  const navigate = useNavigate()
  
  // Get recent unique exercises from workout history
  const recentExerciseIds = Array.from(
    new Set(
      workoutHistory
        .slice(0, 20)
        .map((w) => w.exerciseId)
    )
  ).slice(0, maxItems)

  const recentExercises = recentExerciseIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e): e is Exercise => e !== undefined)

  // Get last workout for each exercise to show stats
  const getLastWorkoutForExercise = (exerciseId: string) => {
    return workoutHistory.find((w) => w.exerciseId === exerciseId)
  }

  if (recentExercises.length === 0) {
    return (
      <Card className="p-6 text-center space-y-3">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <div>
          <p className="font-semibold">No exercises logged yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start your first workout to see quick access here</p>
        </div>
        <Button 
          onClick={() => navigate('/scan')}
          className="w-full"
        >
          Browse Exercises
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {recentExercises.map((exercise) => {
          const lastWorkout = getLastWorkoutForExercise(exercise.id)
          const lastSet = lastWorkout?.sets[lastWorkout.sets.length - 1]
          
          return (
            <button
              key={exercise.id}
              onClick={() => onStartExercise(exercise)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card p-4 text-left transition-all",
                "hover:border-primary/50 hover:shadow-md active:scale-[0.97]",
                "flex flex-col gap-2"
              )}
            >
              {/* Exercise name */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-2 leading-tight">
                    {exercise.name}
                  </p>
                </div>
                <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              {/* Primary muscle badge */}
              {exercise.targetMuscles[0] && (
                <Badge variant="secondary" className="text-xs w-fit">
                  {exercise.targetMuscles[0]}
                </Badge>
              )}

              {/* Last workout stats */}
              {lastSet && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{lastSet.weight}kg × {lastSet.reps}</span>
                  {lastWorkout && (
                    <span className="ml-auto">
                      {formatDistanceToNow(new Date(lastWorkout.date), { addSuffix: true })}
                    </span>
                  )}
                </div>
              )}

              {/* Hover indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </button>
          )
        })}
      </div>

      {showViewAll && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/scan')}
        >
          <History className="h-4 w-4 mr-2" />
          Browse All Exercises
          <ChevronRight className="h-4 w-4 ml-auto" />
        </Button>
      )}
    </div>
  )
}
