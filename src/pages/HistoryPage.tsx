// src/pages/HistoryPage.tsx
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Download, Trophy, ChevronRight, Trash2, FlaskConical, Upload, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { useWorkout } from '@/context/WorkoutContext'
import type { Workout, WorkoutSet } from '@/lib/types'

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
          <DialogTitle>Edit -- {workout.exerciseName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date and Time</Label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." className="mt-1" />
          </div>
          <div className="space-y-2">
            <Label>Sets</Label>
            {sets.map((set, idx) => (
              <div key={set.id} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10">Set {idx + 1}</span>
                <Input
                  type="number"
                  step="0.5"
                  value={set.weight}
                  onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                  className="w-20 text-sm"
                />
                <span className="text-xs text-muted-foreground">{workout.weightUnit ?? 'kg'}</span>
                <span className="text-xs text-muted-foreground">x</span>
                <Input
                  type="number"
                  value={set.reps}
                  onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                  className="w-16 text-sm"
                />
                <span className="text-xs text-muted-foreground">reps</span>
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
  const { workoutHistory, deleteWorkout, updateWorkout, loadDemoData, importWorkouts } = useWorkout()
  const importRef = useRef<HTMLInputElement>(null)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify(workoutHistory, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gym-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    importRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importWorkouts(data)
    } catch {
      const { toast } = await import('sonner')
      toast.error('Failed to import - invalid JSON file.')
    } finally {
      e.target.value = ''
    }
  }

  async function handleSaveEdit(workout: Workout) {
    await updateWorkout(workout)
    setEditingWorkout(null)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 page-transition">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadDemoData}>
            <FlaskConical className="mr-2 h-4 w-4" />
            Load Demo
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          {workoutHistory.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
      </div>

      {workoutHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">No workouts logged yet.</p>
          <Button className="mt-4" onClick={() => navigate('/scan')}>
            Scan and Start Workout
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workoutHistory.map((workout) => {
            const totalVol = workout.totalVolume
              ?? workout.sets.reduce((s, set) => s + set.weight * set.reps, 0)
            return (
              <Card
                key={workout.id}
                className="cursor-pointer transition-colors hover:bg-accent/30"
                onClick={() => navigate(`/exercise-history/${workout.exerciseId}`)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{workout.exerciseName}</p>
                      {workout.isPR && (
                        <Badge className="shrink-0 bg-yellow-500 text-black hover:bg-yellow-400">
                          <Trophy className="mr-1 h-3 w-3" />PR
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(workout.date), 'MMM d, yyyy h:mm a')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {workout.sets.length} sets
                      {totalVol > 0 && ` - ${totalVol.toLocaleString()}${workout.weightUnit ?? 'kg'} volume`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingWorkout(workout)
                      }}
                      aria-label="Edit workout"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteWorkout(workout.id)
                      }}
                      aria-label="Delete workout"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {editingWorkout && (
        <EditWorkoutDialog
          workout={editingWorkout}
          onSave={handleSaveEdit}
          onClose={() => setEditingWorkout(null)}
        />
      )}
    </div>
  )
}
