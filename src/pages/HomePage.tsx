// src/pages/HomePage.tsx
import { useNavigate } from 'react-router-dom'
import { format, startOfDay, subDays, startOfWeek } from 'date-fns'
import { useMemo, useState } from 'react'
import { Play, QrCode, LayoutTemplate, History, TrendingUp, ChevronRight, Dumbbell, Moon, CheckCircle2, Circle, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkout } from '@/context/WorkoutContext'
import { cn } from '@/lib/utils'
import { QuickExerciseGrid } from '@/components/QuickExerciseGrid'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const QUICK_ACTIONS = [
  { label: 'Scan Machine', icon: QrCode, to: '/scan', description: 'Start via QR' },
  { label: 'My Plans', icon: LayoutTemplate, to: '/templates', description: 'Manage templates' },
  { label: 'History', icon: History, to: '/history', description: 'Past workouts' },
  { label: 'Progress', icon: TrendingUp, to: '/progress', description: 'Charts & stats' },
]

export function HomePage() {
  const navigate = useNavigate()
  const {
    profile, templates, exercises, workoutHistory,
    startTemplate, resumeActiveTemplate, startWorkout,
  } = useWorkout()

  const todayIdx = new Date().getDay()
  const todayTemplateId = profile?.weekSchedule?.[todayIdx]
  const todayTemplate = templates.find((t) => t.id === todayTemplateId)
  // Resume only when actually mid-session (exerciseIndex > 0)
  const isActive = profile?.activeTemplateId === todayTemplateId &&
    !!todayTemplateId &&
    (profile?.activeTemplateExerciseIndex ?? 0) > 0

  const recentWorkouts = workoutHistory.slice(0, 5)

  const thisWeekWorkoutCount = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const uniqueDays = new Set(
      workoutHistory
        .filter((w) => new Date(w.date) >= weekStart)
        .map((w) => startOfDay(new Date(w.date)).getTime()),
    )
    return uniqueDays.size
  }, [workoutHistory])

  const weeklyScheduledDays = useMemo(() => {
    return Object.keys(profile?.weekSchedule ?? {}).length
  }, [profile?.weekSchedule])

  const streak = useMemo(() => {
    if (workoutHistory.length === 0) return 0
    const daySet = new Set(
      workoutHistory.map((w) => startOfDay(new Date(w.date)).getTime()),
    )
    let count = 0
    let day = startOfDay(new Date())
    while (daySet.has(day.getTime())) {
      count++
      day = subDays(day, 1)
    }
    if (count === 0) {
      day = startOfDay(subDays(new Date(), 1))
      while (daySet.has(day.getTime())) {
        count++
        day = subDays(day, 1)
      }
    }
    return count
  }, [workoutHistory])

  // Onboarding state
  const profileComplete = profile !== null
  const templateReady = templates.length > 0
  const hasWorkouts = workoutHistory.length > 0
  const allOnboardingDone = profileComplete && templateReady && hasWorkouts
  const [onboardingDismissed, setOnboardingDismissed] = useState(
    () => localStorage.getItem('onboarding-dismissed') === 'true',
  )
  const showOnboarding = !onboardingDismissed && !allOnboardingDone

  function dismissOnboarding() {
    localStorage.setItem('onboarding-dismissed', 'true')
    setOnboardingDismissed(true)
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-28 space-y-6 page-transition">

      {/* â”€â”€ Greeting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <h1 className="text-2xl font-bold">
            {greeting()}{profile?.name ? `, ${profile.name}` : ''} {'👋'}
          </h1>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-500">
              {'🔥'} {streak}-day streak
            </span>
          )}
        </div>
      </div>

      {/* Onboarding checklist (new users) */}
      {showOnboarding && (
        <div className="rounded-3xl border border-primary/30 bg-primary/5 p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Get Started</p>
              <p className="text-base font-bold mt-0.5">3 steps to your first workout</p>
            </div>
            <button
              onClick={dismissOnboarding}
              className="text-muted-foreground hover:text-foreground transition-colors mt-0.5"
              aria-label="Dismiss onboarding"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {[
              {
                done: profileComplete,
                label: 'Set up your profile',
                description: 'Add your stats & fitness goal',
                to: '/profile',
              },
              {
                done: templateReady,
                label: 'Create a workout template',
                description: 'Plan your weekly routine',
                to: '/templates',
              },
              {
                done: hasWorkouts,
                label: 'Log your first workout',
                description: 'Scan a machine or start from a template',
                to: '/scan',
              },
            ].map((step) => (
              <button
                key={step.to}
                onClick={() => !step.done && navigate(step.to)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                  step.done
                    ? 'border-border bg-muted/40 opacity-60 cursor-default'
                    : 'border-primary/20 bg-card hover:border-primary/50 active:scale-[0.98]',
                )}
              >
                {step.done
                  ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', step.done && 'line-through text-muted-foreground')}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {!step.done && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Log Section - Recent Exercises for Fast Access */}
      {workoutHistory.length > 0 && !showOnboarding && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Quick Log
              </p>
            </div>
            <button
              onClick={() => navigate('/scan')}
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <QuickExerciseGrid
            exercises={exercises}
            workoutHistory={workoutHistory}
            onStartExercise={(exercise) => {
              startWorkout(exercise)
              navigate('/log')
            }}
            maxItems={4}
            showViewAll={false}
          />
        </div>
      )}

      <div
        className={cn(
          'rounded-3xl border p-5 space-y-4',
          todayTemplate
            ? 'border-primary/30 bg-primary/5'
            : 'border-border bg-card',
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {DAY_NAMES[todayIdx]}&apos;s Workout
          </p>
          {todayTemplate && (
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => navigate('/templates')}>
              Edit
            </Button>
          )}
        </div>

        {todayTemplate ? (
          <>
            <div>
              <p className="text-xl font-bold">{todayTemplate.name}</p>
              {todayTemplate.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{todayTemplate.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {Array.from(new Set(
                  todayTemplate.exercises.flatMap((te) =>
                    exercises.find((e) => e.id === te.exerciseId)?.targetMuscles ?? []
                  )
                )).slice(0, 5).map((m) => (
                  <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                ))}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {todayTemplate.exercises.length} exercises
              {isActive && profile?.activeTemplateExerciseIndex !== undefined && (
                <span className="ml-2 text-primary font-semibold">
                  · Exercise {profile.activeTemplateExerciseIndex + 1}/{todayTemplate.exercises.length} in progress
                </span>
              )}
            </div>
            {isActive ? (
              <Button
                className="w-full"
                size="lg"
                onClick={() => { resumeActiveTemplate(); navigate('/log') }}
              >
                <Play className="h-4 w-4 mr-2" /> Resume Where You Left Off
              </Button>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={() => { startTemplate(todayTemplate); navigate('/log') }}
              >
                <Play className="h-4 w-4 mr-2" /> Start Today&apos;s Workout
              </Button>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted">
                <Moon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Rest Day</p>
                <p className="text-xs text-muted-foreground">No workout scheduled. Recover well.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/templates')}>
                Schedule
              </Button>
            </div>
            {weeklyScheduledDays > 0 && (
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">This week</p>
                <p className="text-xs font-semibold">
                  {thisWeekWorkoutCount} / {weeklyScheduledDays} days done
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* â”€â”€ Quick Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick Access</p>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ label, icon: Icon, to, description }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all active:scale-95 hover:border-primary/30 hover:bg-accent/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* â”€â”€ Recent Activity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {recentWorkouts.length > 0 ? (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recent Activity
          </p>
          <div className="space-y-2">
            {recentWorkouts.map((w) => {
              const vol = w.totalVolume ?? w.sets.reduce((s, set) => s + set.weight * set.reps, 0)
              return (
                <button
                  key={w.id}
                  className="w-full text-left flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition-all active:scale-[0.98] hover:border-primary/20 hover:bg-accent/30"
                  onClick={() => navigate(`/exercise-history/${w.exerciseId}`)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{w.exerciseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(w.date), 'MMM d')} · {w.sets.length} sets
                      {vol > 0 && ` · ${vol.toLocaleString()} ${w.weightUnit ?? 'kg'}`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        !todayTemplate && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-muted">
              <Dumbbell className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">No workouts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Scan a machine to start your first session</p>
            <Button className="mt-5" size="sm" onClick={() => navigate('/scan')}>
              <QrCode className="h-4 w-4 mr-1.5" /> Scan Your First Exercise
            </Button>
          </div>
        )
      )}
    </div>
  )
}
