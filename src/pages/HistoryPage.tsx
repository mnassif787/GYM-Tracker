// src/pages/HistoryPage.tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfDay, subDays, isToday, isYesterday } from 'date-fns'
import { Trophy, ChevronRight, Trash2, Pencil, Plus, Search, Settings, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useWorkout } from '@/context/WorkoutContext'
import type { Workout, WorkoutSet } from '@/lib/types'
import { cn } from '@/lib/utils'

function EditWorkoutDialog({
  workout,
  onSave,
  onClose,
}: {
  workout: Workout
  onSave: (w: Workout) => void
  onClose: () => void
}) {
  const [sets, setSets] = useState<WorkoutSet[]>(workout.sets.map((s) => ({ ...s })))
  const [notes, setNotes] = useState(workout.notes ?? '')
  const [date, setDate] = useState(format(new Date(workout.date), "yyyy-MM-dd'T'HH:mm"))

  function updateSet(id: string, field: 'weight' | 'reps', value: string) {
    setSets((prev) => prev.map((s) => s.id === id ? { ...s, [field]: parseFloat(value) || 0 } : s))
  }

  function removeSet(id: string) {
    setSets((prev) => prev.filter((s) => s.id !== id))
  }

  function addSet() {
    const last = sets[sets.length - 1]
    setSets((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        weight: last?.weight ?? 0,
        reps: last?.reps ?? 10,
        timestamp: new Date().toISOString(),
        completed: true,
      },
    ])
  }

  function handleSave() {
    const totalVolume = sets.reduce((s, set) => s + set.weight * set.reps, 0)
    onSave({ ...workout, sets, notes, date: new Date(date).toISOString(), totalVolume })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit — {workout.exerciseName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date and Time</Label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes…" className="mt-1.5" />
          </div>
          <div className="space-y-2">
            <Label>Sets</Label>
            {sets.map((set, idx) => (
              <div key={set.id} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10 shrink-0">Set {idx + 1}</span>
                <Input
                  type="number"
                  step="0.5"
                  value={set.weight}
                  onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                  className="w-20 text-sm"
                />
                <span className="text-xs text-muted-foreground shrink-0">{workout.weightUnit ?? 'kg'}</span>
                <span className="text-xs text-muted-foreground shrink-0">×</span>
                <Input
                  type="number"
                  value={set.reps}
                  onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                  className="w-16 text-sm"
                />
                <span className="text-xs text-muted-foreground shrink-0">reps</span>
                {sets.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive ml-auto"
                    onClick={() => removeSet(set.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addSet}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Set
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function HistoryPage() {
  const navigate = useNavigate()
  const { workoutHistory, deleteWorkout, updateWorkout } = useWorkout()
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [deletingWorkout, setDeletingWorkout] = useState<Workout | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string>('All')

  const allMuscles = useMemo(() => {
    const set = new Set<string>()
    for (const w of workoutHistory) for (const m of w.targetMuscles) set.add(m)
    return Array.from(set).sort()
  }, [workoutHistory])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return workoutHistory.filter((w) => {
      const matchSearch =
        !q ||
        w.exerciseName.toLowerCase().includes(q) ||
        w.targetMuscles.some((m) => m.toLowerCase().includes(q))
      const matchMuscle =
        muscleFilter === 'All' ||
        w.targetMuscles.includes(muscleFilter)
      return matchSearch && matchMuscle
    })
  }, [workoutHistory, search, muscleFilter])

  const groupedFiltered = useMemo(() => {
    const groups: { label: string; workouts: Workout[] }[] = []
    const todayGroup: Workout[] = []
    const yesterdayGroup: Workout[] = []
    const weekGroup: Workout[] = []
    const olderGroup: Workout[] = []
    const weekAgo = startOfDay(subDays(new Date(), 7))
    for (const w of filtered) {
      const d = new Date(w.date)
      if (isToday(d)) todayGroup.push(w)
      else if (isYesterday(d)) yesterdayGroup.push(w)
      else if (startOfDay(d) >= weekAgo) weekGroup.push(w)
      else olderGroup.push(w)
    }
    if (todayGroup.length) groups.push({ label: 'Today', workouts: todayGroup })
    if (yesterdayGroup.length) groups.push({ label: 'Yesterday', workouts: yesterdayGroup })
    if (weekGroup.length) groups.push({ label: 'This Week', workouts: weekGroup })
    if (olderGroup.length) groups.push({ label: 'Earlier', workouts: olderGroup })
    return groups
  }, [filtered])

  async function handleSaveEdit(workout: Workout) {
    await updateWorkout(workout)
    setEditingWorkout(null)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-28 space-y-4 page-transition">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => navigate('/settings')}
        >
          <Settings className="h-4 w-4" />
          Manage Data
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by exercise or muscle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Muscle filter chips */}
      {allMuscles.length > 0 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
          style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {allMuscles.map((m) => (
            <button
              key={m}
              onClick={() => setMuscleFilter(muscleFilter === m ? 'All' : m)}
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
          {muscleFilter !== 'All' && (
            <button
              onClick={() => setMuscleFilter('All')}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* List */}
      {workoutHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No workouts logged yet.</p>
          <Button className="mt-4" onClick={() => navigate('/scan')}>
            Scan and Start Workout
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">No workouts match your filter.</p>
          <Button variant="ghost" className="mt-2" onClick={() => { setSearch(''); setMuscleFilter('All') }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedFiltered.map(({ label, workouts }) => (
            <div key={label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
                {label}
              </p>
              <div className="flex flex-col gap-2">
                {workouts.map((workout) => {
                  const totalVol = workout.totalVolume
                    ?? workout.sets.reduce((s, set) => s + set.weight * set.reps, 0)
                  return (
                    <Card
                      key={workout.id}
                      className="rounded-2xl cursor-pointer transition-all active:scale-[0.99] hover:border-primary/20 hover:bg-accent/20"
                      onClick={() => navigate(`/exercise-history/${workout.exerciseId}`)}
                    >
                      <CardContent className="flex items-center gap-3.5 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{workout.exerciseName}</p>
                            {workout.isPR && (
                              <Badge className="shrink-0 bg-amber-500 text-black hover:bg-amber-400 text-xs">
                                <Trophy className="mr-1 h-3 w-3" />PR
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(workout.date), 'MMM d, yyyy · h:mm a')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {workout.sets.length} sets
                            {totalVol > 0 && ` · ${totalVol.toLocaleString()} ${workout.weightUnit ?? 'kg'} volume`}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); setEditingWorkout(workout) }}
                            aria-label="Edit workout"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setDeletingWorkout(workout) }}
                            aria-label="Delete workout"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingWorkout && (
        <EditWorkoutDialog
          workout={editingWorkout}
          onSave={handleSaveEdit}
          onClose={() => setEditingWorkout(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingWorkout && (
        <Dialog open onOpenChange={() => setDeletingWorkout(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Delete Workout?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              This will permanently delete <span className="font-semibold text-foreground">{deletingWorkout.exerciseName}</span>{' '}
              logged on {format(new Date(deletingWorkout.date), 'MMM d, yyyy')}. This cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDeletingWorkout(null)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true)
                  await deleteWorkout(deletingWorkout.id)
                  setIsDeleting(false)
                  setDeletingWorkout(null)
                }}
              >
                {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
