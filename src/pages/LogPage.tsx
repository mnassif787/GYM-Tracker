// src/pages/LogPage.tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, CheckCircle2, Play, Clock, AlertTriangle, Shuffle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { WorkoutForm } from '@/components/WorkoutForm'
import { RestTimer } from '@/components/RestTimer'
import { useWorkout } from '@/context/WorkoutContext'

// ─── Session countdown timer ─────────────────────────────────────────────────
function SessionTimer({ startTime, limitMin }: { startTime: Date; limitMin: number }) {
  const [elapsed, setElapsed] = useState(0)
  const warned5Ref = useRef(false)
  const warned2Ref = useRef(false)
  const warnedOverRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - startTime.getTime()) / 1000)
      setElapsed(secs)
      const remaining = limitMin * 60 - secs
      if (remaining <= 300 && remaining > 0 && !warned5Ref.current) {
        warned5Ref.current = true
        toast.warning('5 minutes left in your session!', { duration: 6000 })
      }
      if (remaining <= 120 && remaining > 0 && !warned2Ref.current) {
        warned2Ref.current = true
        toast.warning('2 minutes left — wrap it up!', { duration: 6000 })
      }
      if (remaining <= 0 && !warnedOverRef.current) {
        warnedOverRef.current = true
        toast.error('Time limit reached! Finish your current set.', { duration: 0, id: 'time-up' })
      }
    }, 1000)
    return () => clearInterval(id)
  }, [startTime, limitMin])

  const limitSecs = limitMin * 60
  const remaining = Math.max(0, limitSecs - elapsed)
  const pct = Math.min(1, elapsed / limitSecs)
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const isOver = elapsed >= limitSecs
  const isWarning = remaining <= 120 && !isOver

  return (
    <div className="mb-4 rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {isOver ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
          <span className={isOver ? 'text-destructive' : isWarning ? 'text-amber-500' : ''}>
            {isOver ? 'Time up!' : `${mm}:${ss} remaining`}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{limitMin} min limit</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOver ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  )
}

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
    pendingTemplateExercise,
    startWorkout,
    clearPendingTemplate,
    getSmartRec,
    profile,
    sessionStartTime,
    runningTemplateId,
    templates,
    exercises,
    startTemplate,
  } = useWorkout()

  const [showRestTimer, setShowRestTimer] = useState(false)
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)

  const smartRec = currentExercise ? getSmartRec(currentExercise.id) : null
  const runningTemplate = templates.find((t) => t.id === runningTemplateId)

  // Show "next exercise" prompt when template queue advances
  if (!currentExercise && pendingTemplateExercise) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center page-transition">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <Play className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h2 className="text-xl font-semibold">Up Next</h2>
        <p className="mt-2 text-lg font-medium">{pendingTemplateExercise.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingTemplateExercise.targetMuscles.join(', ')}
        </p>
        {sessionStartTime && profile?.workoutTimeLimitMin && (
          <div className="mt-4">
            <SessionTimer startTime={sessionStartTime} limitMin={profile.workoutTimeLimitMin} />
          </div>
        )}
        <div className="mt-6 space-y-2">
          <Button className="w-full" onClick={() => startWorkout(pendingTemplateExercise)}>
            <Play className="h-4 w-4 mr-2" /> Start Exercise
          </Button>
          {runningTemplate && (
            <Button variant="outline" className="w-full" onClick={() => setShowSwitchDialog(true)}>
              <Shuffle className="h-4 w-4 mr-2" /> Switch Exercise (machine busy)
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={() => { clearPendingTemplate(); navigate('/history') }}>
            End Template Session
          </Button>
        </div>

        {runningTemplate && (
          <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Pick an Exercise</DialogTitle>
              </DialogHeader>
              <p className="text-xs text-muted-foreground mb-3">Jump to any exercise in this template. You can do them in any order.</p>
              <div className="space-y-2">
                {runningTemplate.exercises.map((te, idx) => {
                  const ex = exercises.find((e) => e.id === te.exerciseId)
                  if (!ex) return null
                  const isCurrent = ex.id === pendingTemplateExercise.id
                  return (
                    <button
                      key={te.exerciseId}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition-colors hover:bg-accent ${
                        isCurrent ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => {
                        setShowSwitchDialog(false)
                        startTemplate(runningTemplate, idx)
                        startWorkout(ex)
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{ex.name}</p>
                        {isCurrent && <Badge className="text-xs">Current</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ex.targetMuscles.join(', ')}</p>
                      <p className="text-xs text-muted-foreground">{te.sets} sets x {te.reps} reps</p>
                    </button>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

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

  async function handleComplete() {
    await completeWorkout()
    if (!pendingTemplateExercise) navigate('/history')
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6 page-transition">
      {/* Session timer */}
      {sessionStartTime && profile?.workoutTimeLimitMin && (
        <SessionTimer startTime={sessionStartTime} limitMin={profile.workoutTimeLimitMin} />
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{currentExercise.name}</h1>
            {(currentExercise.machineName || currentExercise.machineLocation) && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {[currentExercise.machineName, currentExercise.machineLocation]
                  .filter(Boolean)
                  .join(' - ')}
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
            smartRec={smartRec}
            currentSetIndex={currentWorkout.sets.length}
          />
        </CardContent>
      </Card>

      {/* Rest timer */}
      {showRestTimer && (
        <div className="mb-4">
          <RestTimer onComplete={() => setShowRestTimer(false)} />
        </div>
      )}

      {/* Complete workout */}
      {currentWorkout.sets.length > 0 && (
        <Button className="w-full" size="lg" onClick={handleComplete}>
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Complete Workout ({currentWorkout.sets.length} sets)
        </Button>
      )}
    </div>
  )
}
