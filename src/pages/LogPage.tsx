// src/pages/LogPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkoutForm } from '@/components/WorkoutForm'
import { RestTimer } from '@/components/RestTimer'
import { useWorkout } from '@/context/WorkoutContext'
import { getRecommendedWeight } from '@/lib/exercises'

export function LogPage() {
  const navigate = useNavigate()
  const {
    currentExercise,
    currentWorkout,
    workoutHistory,
    addSet,
    updateSet,
    removeSet,
    completeWorkout,
  } = useWorkout()

  const [showRestTimer, setShowRestTimer] = useState(false)

  if (!currentExercise || !currentWorkout) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center page-transition">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <QrCode className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">No Active Workout</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Scan a QR code on a gym machine to start logging.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate('/scan')}>
          Go to Scanner
        </Button>
      </div>
    )
  }

  const recommendedWeight = getRecommendedWeight(currentExercise.id, workoutHistory)

  async function handleComplete() {
    await completeWorkout()
    navigate('/history')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 page-transition">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{currentExercise.name}</h1>
            {(currentExercise.machineName || currentExercise.machineLocation) && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {[currentExercise.machineName, currentExercise.machineLocation]
                  .filter(Boolean)
                  .join(' — ')}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {currentExercise.targetMuscles.map((m) => (
            <Badge key={m} variant="secondary">{m}</Badge>
          ))}
        </div>
      </div>

      {/* Workout form */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">
            Set {currentWorkout.sets.length + 1}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutForm
            sets={currentWorkout.sets}
            weightUnit={currentWorkout.weightUnit ?? 'kg'}
            onAddSet={addSet}
            onUpdateSet={updateSet}
            onRemoveSet={removeSet}
            onSetAdded={() => setShowRestTimer(true)}
            recommendedWeight={recommendedWeight}
            recommendedSets={currentExercise.recommendedSets}
            recommendedReps={currentExercise.recommendedReps}
          />
        </CardContent>
      </Card>

      {/* Rest timer — appears after first set is logged */}
      {showRestTimer && (
        <div className="mb-4">
          <RestTimer onComplete={() => setShowRestTimer(false)} />
        </div>
      )}

      {/* Complete workout */}
      {currentWorkout.sets.length > 0 && (
        <Button
          className="w-full"
          size="lg"
          onClick={handleComplete}
        >
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Complete Workout ({currentWorkout.sets.length} sets)
        </Button>
      )}
    </div>
  )
}
