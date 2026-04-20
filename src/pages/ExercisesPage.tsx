// src/pages/ExercisesPage.tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useWorkout } from '@/context/WorkoutContext'

// Derive all unique muscle groups from exercises
const ALL_MUSCLES_PLACEHOLDER = 'All'

export function ExercisesPage() {
  const navigate = useNavigate()
  const { exercises } = useWorkout()
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string>(ALL_MUSCLES_PLACEHOLDER)

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
      const matchMuscle =
        muscleFilter === ALL_MUSCLES_PLACEHOLDER ||
        e.targetMuscles.includes(muscleFilter)
      return matchSearch && matchMuscle
    })
  }, [exercises, search, muscleFilter])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 page-transition">
      <h1 className="mb-4 text-2xl font-bold">Exercises</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or muscle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Muscle filter buttons */}
      <div className="mb-5 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={muscleFilter === ALL_MUSCLES_PLACEHOLDER ? 'default' : 'outline'}
          onClick={() => setMuscleFilter(ALL_MUSCLES_PLACEHOLDER)}
        >
          All
        </Button>
        {allMuscles.map((m) => (
          <Button
            key={m}
            size="sm"
            variant={muscleFilter === m ? 'default' : 'outline'}
            onClick={() => setMuscleFilter(m)}
          >
            {m}
          </Button>
        ))}
      </div>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No exercises match your search.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((exercise) => (
            <Card
              key={exercise.id}
              className="cursor-pointer transition-colors hover:bg-accent/30"
              onClick={() => navigate(`/exercise-history/${exercise.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{exercise.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {exercise.targetMuscles.map((m) => (
                    <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                  ))}
                </div>
                {(exercise.recommendedSets && exercise.recommendedReps) && (
                  <p className="text-xs text-muted-foreground">
                    {exercise.recommendedSets}×{exercise.recommendedReps} recommended
                  </p>
                )}
                {(exercise.machineName || exercise.machineLocation) && (
                  <p className="text-xs text-primary">
                    {[exercise.machineName, exercise.machineLocation].filter(Boolean).join(' — ')}
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
