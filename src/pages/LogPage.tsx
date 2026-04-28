// src/pages/LogPage.tsx
import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { QrCode, CheckCircle2, Play, Clock, AlertTriangle, Shuffle, LayoutTemplate, Calculator, ListOrdered, Trophy, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WorkoutForm } from '@/components/WorkoutForm'
import { RestTimer } from '@/components/RestTimer'
import { useWorkout } from '@/context/WorkoutContext'
import { getAlternativeExercises } from '@/lib/exercises'

// â”€â”€â”€ Session countdown timer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SessionTimer({
  startTime,
  limitMin,
  onTimeLimitReached,
}: {
  startTime: Date
  limitMin: number
  onTimeLimitReached?: () => void
}) {
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
        navigator.vibrate?.([200, 100, 200])
      }
      if (remaining <= 120 && remaining > 0 && !warned2Ref.current) {
        warned2Ref.current = true
        toast.warning('2 minutes left – wrap it up!', { duration: 6000 })
        navigator.vibrate?.([300, 100, 300])
      }
      if (remaining <= 0 && !warnedOverRef.current) {
        warnedOverRef.current = true
        toast.error('Time limit reached! Complete your current exercise.', { duration: 0, id: 'time-up' })
        navigator.vibrate?.([500, 200, 500, 200, 500])
        onTimeLimitReached?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [startTime, limitMin, onTimeLimitReached])

  const limitSecs = limitMin * 60
  const remaining = Math.max(0, limitSecs - elapsed)
  const pct = Math.min(1, elapsed / limitSecs)
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const isOver = elapsed >= limitSecs
  const isWarning = remaining <= 120 && !isOver

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          {isOver
            ? <AlertTriangle className="h-4 w-4 text-destructive" />
            : <Clock className="h-4 w-4 text-muted-foreground" />}
          <span className={isOver ? 'text-destructive' : isWarning ? 'text-amber-500' : ''}>
            {isOver ? 'Time up!' : `${mm}:${ss} remaining`}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{limitMin} min limit</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isOver ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-primary'
          }`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  )
}

export function LogPage() {
  const navigate = useNavigate()
  const {
    currentExercise, currentWorkout, workoutHistory,
    addSet, updateSet, removeSet, completeWorkout,
    pendingTemplateExercise, startWorkout, clearPendingTemplate,
    getSmartRec, profile, sessionStartTime,
    runningTemplateId, templates, exercises, startTemplate,
    swapCurrentExercise, jumpToTemplateExercise, templateQueue, templateQueueIndex,
  } = useWorkout()

  const [showRestTimer, setShowRestTimer] = useState(false)
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)
  const [showPlateCalc, setShowPlateCalc] = useState(false)
  const [isTimeLimitReached, setIsTimeLimitReached] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [completionSummary, setCompletionSummary] = useState<{
    templateName: string; exercisesCompleted: number; durationMin: number
  } | null>(null)

  const smartRec = currentExercise ? getSmartRec(currentExercise.id) : null
  const runningTemplate = templates.find((t) => t.id === runningTemplateId)

  // Workout completion summary screen
  if (completionSummary) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center page-transition space-y-6">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
          <Trophy className="h-12 w-12 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Workout Complete!</p>
          <h2 className="text-2xl font-bold mt-1">{completionSummary.templateName}</h2>
          <p className="text-sm text-muted-foreground mt-1">Amazing work — session finished 💪</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Exercises</p>
            <p className="text-2xl font-bold text-primary">{completionSummary.exercisesCompleted}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-2xl font-bold text-primary">
              {completionSummary.durationMin > 0 ? `${completionSummary.durationMin}m` : '—'}
            </p>
          </div>
        </div>
        <div className="space-y-2.5 pt-2">
          <Button
            className="w-full"
            size="lg"
            onClick={() => { setCompletionSummary(null); navigate('/history') }}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" /> View in History
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => { setCompletionSummary(null); navigate('/') }}
          >
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  if (!currentExercise && pendingTemplateExercise) {
    const plannedEntry = runningTemplate?.exercises.find(
      (te) => te.exerciseId === pendingTemplateExercise.id,
    )
    const exercisesDone = templateQueueIndex
    const totalExercises = templateQueue.length

    return (
      <div className="mx-auto max-w-md px-4 py-12 page-transition">
        {sessionStartTime && profile?.workoutTimeLimitMin && (
          <div className="mb-6">
            <SessionTimer
              startTime={sessionStartTime}
              limitMin={profile.workoutTimeLimitMin}
              onTimeLimitReached={() => setIsTimeLimitReached(true)}
            />
          </div>
        )}

        {/* Progress indicator */}
        {totalExercises > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Template progress</span>
              <span className="font-semibold text-foreground">
                {exercisesDone} / {totalExercises} done
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(exercisesDone / totalExercises) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <Play className="h-10 w-10 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {totalExercises > 0 ? `Exercise ${exercisesDone + 1} of ${totalExercises}` : 'Up Next'}
            </p>
            <h2 className="text-2xl font-bold mt-1">{pendingTemplateExercise.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {pendingTemplateExercise.targetMuscles.join(', ')}
            </p>
            {plannedEntry && (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {plannedEntry.sets} sets × {plannedEntry.reps} reps
              </p>
            )}
            {totalExercises > 1 && (
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ListOrdered className="h-3 w-3" /> Sorted: compound exercises first
              </p>
            )}
          </div>
        </div>

        {/* Upcoming exercises */}
        {templateQueue.slice(templateQueueIndex + 1, templateQueueIndex + 3).length > 0 && (
          <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Coming Up</p>
            {templateQueue.slice(templateQueueIndex + 1, templateQueueIndex + 3).map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-2.5">
                <span className="h-5 w-5 rounded-full bg-muted text-[11px] font-bold text-muted-foreground flex items-center justify-center shrink-0">
                  {exercisesDone + i + 2}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">{ex.targetMuscles[0]}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 space-y-2.5">
          <Button className="w-full" size="lg" onClick={() => startWorkout(pendingTemplateExercise)}>
            <Play className="h-4 w-4 mr-2" /> Start Exercise
          </Button>
          {runningTemplate && (
            <Button variant="outline" className="w-full" onClick={() => setShowSwitchDialog(true)}>
              <Shuffle className="h-4 w-4 mr-2" /> Switch Exercise (machine busy)
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => setShowEndConfirm(true)}
          >
            End Template Session
          </Button>
        </div>

        {/* End session confirmation */}
        <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End Template Session?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              You've completed {exercisesDone} of {totalExercises} exercises.
              Your logged sets are already saved. Are you sure you want to end this session?
            </p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowEndConfirm(false)}>
                Continue Session
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => { clearPendingTemplate(); setShowEndConfirm(false); navigate('/history') }}
              >
                End Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {runningTemplate && (
          <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Switch Exercise</DialogTitle>
              </DialogHeader>

              {/* Alternatives — same primary muscle from full library */}
              {getAlternativeExercises(pendingTemplateExercise.id, exercises).length > 0 && (
                <>
                  <p className="text-xs font-semibold text-primary mb-2">Machine busy? Same muscle — try instead</p>
                  <div className="space-y-2 mb-4">
                    {getAlternativeExercises(pendingTemplateExercise.id, exercises).map((alt) => (
                      <button
                        key={alt.id}
                        className="w-full text-left rounded-xl border border-border px-4 py-3 transition-colors hover:bg-accent hover:border-primary/40"
                        onClick={() => {
                          swapCurrentExercise(alt.id)
                          setShowSwitchDialog(false)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{alt.name}</p>
                          <Badge variant="outline" className="text-xs border-primary/40 text-primary shrink-0">Swap</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{alt.targetMuscles.join(', ')}</p>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border mb-3" />
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Jump to template exercise</p>
                </>
              )}

              <div className="space-y-2">
                {runningTemplate.exercises.map((te) => {
                  const ex = exercises.find((e) => e.id === te.exerciseId)
                  if (!ex) return null
                  const isCurrent = ex.id === pendingTemplateExercise.id
                  const isInQueue = templateQueue.some((q) => q.id === ex.id)
                  return (
                    <button
                      key={te.exerciseId}
                      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors hover:bg-accent ${
                        isCurrent ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => {
                        setShowSwitchDialog(false)
                        if (isInQueue && !isCurrent) jumpToTemplateExercise(ex.id)
                      }}
                      disabled={!isInQueue || isCurrent}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{ex.name}</p>
                        {isCurrent
                          ? <Badge className="text-xs">Current</Badge>
                          : !isInQueue
                          ? <Badge variant="outline" className="text-xs text-muted-foreground">Done</Badge>
                          : null}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ex.targetMuscles.join(', ')}</p>
                      <p className="text-xs text-muted-foreground">{te.sets} sets × {te.reps} reps</p>
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

  // â”€â”€â”€ No active workout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!currentExercise || !currentWorkout) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center page-transition">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted">
          <QrCode className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">No Active Workout</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-[240px] mx-auto">
          Scan a QR code on a gym machine to start logging sets.
        </p>
        <Button className="mt-7 w-full" size="lg" onClick={() => navigate('/scan')}>
          Go to Scanner
        </Button>
        <Button variant="outline" className="mt-3 w-full" size="lg" onClick={() => navigate('/templates')}>
          <LayoutTemplate className="h-4 w-4 mr-2" /> Start from a Template
        </Button>
      </div>
    )
  }

  async function handleComplete() {
    const setsCount = currentWorkout!.sets.length
    const totalVol = currentWorkout!.sets.reduce((s, set) => s + set.weight * set.reps, 0)

    // Capture before completeWorkout clears state
    const isInTemplate = templateQueue.length > 0
    const isLastInTemplate = isInTemplate && templateQueueIndex >= templateQueue.length - 1
    const capturedSessionStart = sessionStartTime
    const capturedTemplateName = runningTemplate?.name
    const capturedQueueLength = templateQueue.length

    await completeWorkout()
    toast.success(
      `${currentExercise!.name} done! ${setsCount} set${setsCount !== 1 ? 's' : ''} · ${totalVol.toLocaleString()} ${currentWorkout!.weightUnit ?? 'kg'} volume 💪`,
      { duration: 4000 },
    )

    if (isLastInTemplate) {
      const durationMin = capturedSessionStart
        ? Math.floor((Date.now() - capturedSessionStart.getTime()) / 60000)
        : 0
      setCompletionSummary({
        templateName: capturedTemplateName ?? 'Workout',
        exercisesCompleted: capturedQueueLength,
        durationMin,
      })
    } else if (!isInTemplate) {
      navigate('/history')
    }
    // Mid-template: don't navigate — React will show the pending exercise screen
  }

  // â”€â”€â”€ Active workout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-32 space-y-4 page-transition">
      {/* Session timer */}
      {sessionStartTime && profile?.workoutTimeLimitMin && (
        <SessionTimer
          startTime={sessionStartTime}
          limitMin={profile.workoutTimeLimitMin}
          onTimeLimitReached={() => setIsTimeLimitReached(true)}
        />
      )}

      {/* Exercise header */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{currentExercise.name}</h1>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 text-muted-foreground hover:text-foreground -mt-0.5"
            onClick={() => setShowPlateCalc(true)}
            title="Plate calculator"
          >
            <Calculator className="h-4 w-4 mr-1" />
            <span className="text-xs">Plates</span>
          </Button>
        </div>
        {(currentExercise.machineName || currentExercise.machineLocation) && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {[currentExercise.machineName, currentExercise.machineLocation].filter(Boolean).join(' – ')}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {currentExercise.targetMuscles.map((m) => (
            <Badge key={m} variant="secondary">{m}</Badge>
          ))}
        </div>
      </div>

      {/* Workout form */}
      <Card className="rounded-2xl">
        <CardContent className="pt-5">
          {/* Completed sets summary */}
          {currentWorkout.sets.length > 0 && (
            <div className="mb-4 space-y-1">
              {currentWorkout.sets.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-10 shrink-0 font-medium">Set {idx + 1}</span>
                  <span className="font-semibold text-foreground">{s.weight} {currentWorkout.weightUnit ?? 'kg'} × {s.reps} reps</span>
                </div>
              ))}
              <div className="mt-2 border-t border-border pt-2" />
            </div>
          )}
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Set {currentWorkout.sets.length + 1}
          </p>
          <WorkoutForm
            sets={currentWorkout.sets}
            weightUnit={currentWorkout.weightUnit ?? 'kg'}
            onAddSet={addSet}
            onUpdateSet={updateSet}
            onRemoveSet={removeSet}
            onSetAdded={() => setShowRestTimer(true)}
            smartRec={smartRec}
            currentSetIndex={currentWorkout.sets.length}
            disabled={isTimeLimitReached}
          />
        </CardContent>
      </Card>

      {/* Rest timer — sticky above the Complete button */}
      {showRestTimer && (
        <div className="sticky bottom-24 z-20 rounded-2xl overflow-hidden shadow-lg">
          <RestTimer
            onComplete={() => setShowRestTimer(false)}
            autoStart={localStorage.getItem('rest-timer-auto-start') === 'true'}
          />
        </div>
      )}

      {/* Complete workout – sticky bottom */}
      {currentWorkout.sets.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 z-30">
          <div className="mx-auto max-w-md">
            <Button
              className="w-full shadow-2xl shadow-primary/30"
              size="lg"
              onClick={handleComplete}
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Complete · {currentWorkout.sets.length} {currentWorkout.sets.length === 1 ? 'set' : 'sets'}
            </Button>
          </div>
        </div>
      )}

      {/* Plate calculator dialog */}
      <PlateCalcDialog
        open={showPlateCalc}
        onClose={() => setShowPlateCalc(false)}
        weightUnit={currentWorkout.weightUnit ?? 'kg'}
        lastSetWeight={currentWorkout.sets.length > 0 ? currentWorkout.sets[currentWorkout.sets.length - 1].weight : undefined}
      />
    </div>
  )
}

// ─── Plate Calculator ─────────────────────────────────────────────────────────

const KG_PLATES = [20, 15, 10, 5, 2.5, 1.25]
const LBS_PLATES = [45, 35, 25, 10, 5, 2.5]

function calcPlates(targetWeight: number, barWeight: number, unit: 'kg' | 'lbs') {
  const plates = unit === 'kg' ? KG_PLATES : LBS_PLATES
  const perSide = (targetWeight - barWeight) / 2
  if (perSide < 0) return null
  const result: { plate: number; count: number }[] = []
  let remaining = perSide
  for (const p of plates) {
    if (remaining >= p) {
      const count = Math.floor(remaining / p)
      result.push({ plate: p, count })
      remaining = Math.round((remaining - count * p) * 100) / 100
    }
  }
  return { perSide, result, leftover: remaining }
}

interface PlateCalcProps {
  open: boolean
  onClose: () => void
  weightUnit: string
  lastSetWeight?: number
}

function PlateCalcDialog({ open, onClose, weightUnit, lastSetWeight }: PlateCalcProps) {
  const unit = (weightUnit === 'lbs' ? 'lbs' : 'kg') as 'kg' | 'lbs'
  const defaultBar = unit === 'lbs' ? 45 : 20
  const [target, setTarget] = useState(lastSetWeight?.toString() ?? '')
  const [barWeight, setBarWeight] = useState(defaultBar.toString())

  const calcResult = useMemo(() => {
    const t = parseFloat(target)
    const b = parseFloat(barWeight)
    if (!t || !b || t <= b) return null
    return calcPlates(t, b, unit)
  }, [target, barWeight, unit])

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" /> Plate Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pc-target">Target ({unit})</Label>
              <Input
                id="pc-target"
                type="number"
                inputMode="decimal"
                step="0.5"
                placeholder="100"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label htmlFor="pc-bar">Bar weight ({unit})</Label>
              <Input
                id="pc-bar"
                type="number"
                inputMode="decimal"
                step="0.5"
                value={barWeight}
                onChange={(e) => setBarWeight(e.target.value)}
                className="mt-1 h-12 text-base"
              />
            </div>
          </div>

          {calcResult ? (
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Per side — {calcResult.perSide}{unit}
              </p>
              {calcResult.result.length === 0 ? (
                <p className="text-sm text-muted-foreground">Bar only</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {calcResult.result.map(({ plate, count }) => (
                    <div
                      key={plate}
                      className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2"
                    >
                      <span className="text-sm font-bold text-primary">{plate}</span>
                      <span className="text-xs text-muted-foreground">{unit}</span>
                      <span className="text-sm font-semibold text-primary">×{count}</span>
                    </div>
                  ))}
                </div>
              )}
              {calcResult.leftover > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10">
                    {calcResult.leftover}{unit} unloadable per side
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Enter a target weight greater than the bar weight
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
