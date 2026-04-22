// src/pages/HomePage.tsx
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Play, QrCode, LayoutTemplate, History, TrendingUp, ChevronRight, Dumbbell, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkout } from '@/context/WorkoutContext'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage() {
  const navigate = useNavigate()
  const {
    profile, templates, exercises, workoutHistory,
    startTemplate, resumeActiveTemplate,
  } = useWorkout()

  const todayIdx = new Date().getDay()
  const todayTemplateId = profile?.weekSchedule?.[todayIdx]
  const todayTemplate = templates.find((t) => t.id === todayTemplateId)
  const isActive = profile?.activeTemplateId === todayTemplateId && !!todayTemplateId

  // Last 3 distinct exercises logged
  const recentWorkouts = workoutHistory.slice(0, 5)

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24 space-y-5 page-transition">
      {/* ── Greeting ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}{profile?.name ? `, ${profile.name}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {/* ── Today's Workout ───────────────────────────────────────────── */}
      <Card className={todayTemplate ? 'border-primary/40 bg-primary/5' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5" />
            {DAY_NAMES[todayIdx]}'s Workout
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayTemplate ? (
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-lg">{todayTemplate.name}</p>
                {todayTemplate.description && (
                  <p className="text-xs text-muted-foreground">{todayTemplate.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
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
                  <span className="ml-2 text-primary font-medium">
                    • Exercise {profile.activeTemplateExerciseIndex + 1}/{todayTemplate.exercises.length} in progress
                  </span>
                )}
              </div>
              {isActive ? (
                <Button className="w-full" onClick={() => { resumeActiveTemplate(); navigate('/log') }}>
                  <Play className="h-4 w-4 mr-2" /> Resume Where You Left Off
                </Button>
              ) : (
                <Button className="w-full" onClick={() => { startTemplate(todayTemplate); navigate('/log') }}>
                  <Play className="h-4 w-4 mr-2" /> Start Today's Workout
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Coffee className="h-8 w-8 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Rest Day</p>
                <p className="text-xs text-muted-foreground">No workout scheduled for today.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
                Edit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => navigate('/scan')}
        >
          <CardContent className="flex flex-col items-center gap-2 py-5">
            <QrCode className="h-7 w-7 text-primary" />
            <p className="text-sm font-medium">Scan Machine</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => navigate('/templates')}
        >
          <CardContent className="flex flex-col items-center gap-2 py-5">
            <LayoutTemplate className="h-7 w-7 text-primary" />
            <p className="text-sm font-medium">My Plans</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => navigate('/history')}
        >
          <CardContent className="flex flex-col items-center gap-2 py-5">
            <History className="h-7 w-7 text-primary" />
            <p className="text-sm font-medium">History</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={() => navigate('/progress')}
        >
          <CardContent className="flex flex-col items-center gap-2 py-5">
            <TrendingUp className="h-7 w-7 text-primary" />
            <p className="text-sm font-medium">Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Activity ───────────────────────────────────────────── */}
      {recentWorkouts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent Activity</p>
          {recentWorkouts.map((w) => {
            const vol = w.totalVolume ?? w.sets.reduce((s, set) => s + set.weight * set.reps, 0)
            return (
              <button
                key={w.id}
                className="w-full text-left flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:bg-accent/30 transition-colors"
                onClick={() => navigate(`/exercise-history/${w.exerciseId}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{w.exerciseName}</p>
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
      )}

      {recentWorkouts.length === 0 && !todayTemplate && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-3">No workouts yet — let's get started!</p>
          <Button onClick={() => navigate('/scan')}>
            <QrCode className="h-4 w-4 mr-2" /> Scan Your First Exercise
          </Button>
        </div>
      )}
    </div>
  )
}
