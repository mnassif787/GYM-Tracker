// src/pages/ExercisesPage.tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Play } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorkout } from '@/context/WorkoutContext'
import { cn } from '@/lib/utils'

export function ExercisesPage() {
  const navigate = useNavigate()
  const { exercises, startWorkout } = useWorkout()
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('All')

  const allMuscles = useMemo(() => {
    const set = new Set<string>()
    for (const e of exercises) for (const m of e.targetMuscles) set.add(m)
    return Array.from(set).sort()
  }, [exercises])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return exercises.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.targetMuscles.some((m) => m.toLowerCase().includes(q))
      const matchMuscle = muscleFilter === 'All' || e.targetMuscles.includes(muscleFilter)
      return matchSearch && matchMuscle
    })
  }, [exercises, search, muscleFilter])

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-28 space-y-4 page-transition">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercises</h1>
        <span className="text-sm text-muted-foreground tabular-nums">
          {filtered.length}{filtered.length !== exercises.length && ` / ${exercises.length}`}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or muscle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Muscle filter chips â€” horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {['All', ...allMuscles].map((m) => (
          <button
            key={m}
            onClick={() => setMuscleFilter(m)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
              muscleFilter === m
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Exercise list */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">No exercises match your search.</p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {filtered.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-card px-4 py-3.5 transition-all hover:border-primary/20 hover:bg-accent/30"
            >
              <button
                className="flex-1 min-w-0 text-left active:scale-[0.98]"
                onClick={() => navigate(`/exercise-history/${exercise.id}`)}
              >
                <p className="font-semibold text-sm truncate">{exercise.name}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {exercise.targetMuscles.map((m) => (
                    <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                  ))}
                </div>
                {(exercise.recommendedSets && exercise.recommendedReps) && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {exercise.recommendedSets}×{exercise.recommendedReps} recommended
                  </p>
                )}
                {(exercise.machineName || exercise.machineLocation) && (
                  <p className="text-xs text-primary mt-0.5">
                    {[exercise.machineName, exercise.machineLocation].filter(Boolean).join(' – ')}
                  </p>
                )}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-primary hover:bg-primary/10"
                  title="Start workout"
                  onClick={() => { startWorkout(exercise); navigate('/log') }}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
