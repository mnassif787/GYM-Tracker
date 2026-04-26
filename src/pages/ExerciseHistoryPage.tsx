// src/pages/ExerciseHistoryPage.tsx
import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useWorkout } from '@/context/WorkoutContext'

export function ExerciseHistoryPage() {
  const { id: exerciseId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { workoutHistory, exercises } = useWorkout()

  const exercise = useMemo(
    () => exercises.find((e) => e.id === exerciseId),
    [exercises, exerciseId],
  )

  const sessions = useMemo(
    () =>
      workoutHistory
        .filter((w) => w.exerciseId === exerciseId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [workoutHistory, exerciseId],
  )

  const maxWeightEver = useMemo(
    () =>
      sessions.length > 0
        ? Math.max(...sessions.flatMap((w) => w.sets.map((s) => s.weight)))
        : 0,
    [sessions],
  )

  // Trend: compare avg max-weight of last 3 sessions vs previous 3 sessions
  const trend = useMemo(() => {
    const recent = sessions.slice(0, 3)
    const older = sessions.slice(3, 6)
    if (recent.length === 0 || older.length === 0) return null
    const avg = (arr: typeof sessions) =>
      arr.reduce((sum, w) => sum + Math.max(...w.sets.map((s) => s.weight)), 0) / arr.length
    const diff = avg(recent) - avg(older)
    if (diff > 1) return { dir: 'up' as const, label: `+${diff.toFixed(1)}` }
    if (diff < -1) return { dir: 'down' as const, label: diff.toFixed(1) }
    return { dir: 'steady' as const, label: 'Steady' }
  }, [sessions])

  // Sparkline: last 6 sessions in chronological order
  const sparkData = useMemo(
    () =>
      sessions
        .slice(0, 6)
        .reverse()
        .map((w, i) => ({
          i,
          w: Math.max(...w.sets.map((s) => s.weight)),
          date: format(new Date(w.date), 'MMM d'),
        })),
    [sessions],
  )

  const weightUnit = sessions[0]?.weightUnit ?? 'kg'

  if (!exercise) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center page-transition">
        <p className="text-muted-foreground">Exercise not found.</p>
        <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 page-transition">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      <h1 className="text-2xl font-bold">{exercise.name}</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        {exercise.targetMuscles.map((m) => (
          <Badge key={m} variant="secondary">{m}</Badge>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 mb-6 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{sessions.length}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">{maxWeightEver}{weightUnit}</p>
            {trend && (
              <div className="flex items-center justify-center gap-1 mt-0.5">
                {trend.dir === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                {trend.dir === 'down' && <TrendingDown className="h-3 w-3 text-destructive" />}
                {trend.dir === 'steady' && <Minus className="h-3 w-3 text-muted-foreground" />}
                <span className={`text-xs font-medium ${trend.dir === 'up' ? 'text-green-500' : trend.dir === 'down' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {trend.label}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Max Weight</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xl font-bold">
              {sessions.reduce((s, w) => s + w.sets.length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Sets</p>
          </CardContent>
        </Card>
      </div>

      {/* Session list */}
      {sparkData.length >= 2 && (
        <Card className="mb-4">
          <CardContent className="pt-4 pb-2 px-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Progress (last {sparkData.length} sessions)
            </p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={sparkData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value: number) => [`${value}${weightUnit}`, 'Max']}
                  labelFormatter={(label) => label}
                />
                <Line
                  type="monotone"
                  dataKey="w"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Session list */}
      {sessions.length === 0 ? (
        <p className="text-center text-muted-foreground">No sessions logged yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session) => (
            <Card
              key={session.id}
              className={session.isPR ? 'border-yellow-500/50 bg-yellow-500/5' : ''}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {format(new Date(session.date), 'EEEE, MMM d yyyy · h:mm a')}
                  </CardTitle>
                  {session.isPR && (
                    <Badge className="bg-yellow-500 text-black hover:bg-yellow-400">
                      <Trophy className="mr-1 h-3 w-3" /> PR
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                  {session.sets.map((set, idx) => (
                    <div key={set.id}>
                      <div className="flex items-center justify-between py-1 text-sm">
                        <span className="text-muted-foreground">Set {idx + 1}</span>
                        <span className="font-medium">
                          {set.weight}{weightUnit} × {set.reps} reps
                          {set.notes && (
                            <span className="ml-2 font-normal text-xs text-muted-foreground">
                              — {set.notes}
                            </span>
                          )}
                        </span>
                      </div>
                      {idx < session.sets.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
                {session.totalVolume && session.totalVolume > 0 && (
                  <p className="mt-3 text-right text-xs text-muted-foreground">
                    Volume: {session.totalVolume.toLocaleString()}{weightUnit}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
