// src/components/WorkoutForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import type { WorkoutSet } from '@/lib/types'

const setSchema = z.object({
  weight: z.coerce.number().positive('Weight must be positive'),
  reps: z.coerce.number().int().min(1, 'At least 1 rep'),
  notes: z.string().optional(),
})
type SetForm = z.infer<typeof setSchema>

interface WorkoutFormProps {
  sets: WorkoutSet[]
  weightUnit: string
  onAddSet: (set: WorkoutSet) => void
  onUpdateSet: (id: string, partial: Partial<WorkoutSet>) => void
  onRemoveSet: (id: string) => void
  onSetAdded: () => void // callback to auto-start rest timer
  recommendedWeight?: number | null
  recommendedSets?: number
  recommendedReps?: number
}

export function WorkoutForm({
  sets,
  weightUnit,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onSetAdded,
  recommendedWeight,
  recommendedSets,
  recommendedReps,
}: WorkoutFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<SetForm>({
    resolver: zodResolver(setSchema),
    defaultValues: {
      weight: recommendedWeight ?? undefined,
      reps: recommendedReps ?? undefined,
    },
  })

  function onSubmit(data: SetForm) {
    const newSet: WorkoutSet = {
      id: crypto.randomUUID(),
      weight: data.weight,
      reps: data.reps,
      notes: data.notes,
      timestamp: new Date().toISOString(),
      completed: true,
    }
    onAddSet(newSet)
    reset({ weight: data.weight, reps: data.reps, notes: '' })
    onSetAdded()
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Recommendation hint */}
      {(recommendedWeight || recommendedSets || recommendedReps) && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm">
          <p className="font-medium text-primary">Recommendation</p>
          <p className="text-muted-foreground">
            {recommendedSets}×{recommendedReps} @ {recommendedWeight}{weightUnit}
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="mt-1 h-auto p-0 text-xs text-primary"
            onClick={() => {
              if (recommendedWeight) setValue('weight', recommendedWeight)
              if (recommendedReps) setValue('reps', recommendedReps)
            }}
          >
            Apply
          </Button>
        </div>
      )}

      {/* Add set form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="weight">Weight ({weightUnit})</Label>
            <Input
              id="weight"
              type="number"
              step="0.5"
              placeholder="60"
              {...register('weight')}
              className="mt-1"
            />
            {errors.weight && (
              <p className="text-xs text-destructive mt-1">{errors.weight.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="reps">Reps</Label>
            <Input
              id="reps"
              type="number"
              placeholder="10"
              {...register('reps')}
              className="mt-1"
            />
            {errors.reps && (
              <p className="text-xs text-destructive mt-1">{errors.reps.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Felt strong, good form…"
            rows={2}
            {...register('notes')}
            className="mt-1"
          />
        </div>

        <Button type="submit" className="w-full">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Log Set {sets.length + 1}
        </Button>
      </form>

      {/* Logged sets */}
      {sets.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Logged Sets
          </p>
          {sets.map((set, idx) => (
            <SetRow
              key={set.id}
              set={set}
              index={idx + 1}
              weightUnit={weightUnit}
              onUpdate={(partial) => onUpdateSet(set.id, partial)}
              onRemove={() => onRemoveSet(set.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Individual set row (inline edit) ────────────────────────────────────────
interface SetRowProps {
  set: WorkoutSet
  index: number
  weightUnit: string
  onUpdate: (partial: Partial<WorkoutSet>) => void
  onRemove: () => void
}

function SetRow({ set, index, weightUnit, onUpdate, onRemove }: SetRowProps) {
  const [editing, setEditing] = useState(false)
  const [weight, setWeight] = useState(set.weight.toString())
  const [reps, setReps] = useState(set.reps.toString())

  function saveEdit() {
    onUpdate({ weight: parseFloat(weight), reps: parseInt(reps) })
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
      <Badge variant="outline" className="shrink-0">Set {index}</Badge>
      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-16 rounded border bg-background px-2 py-1 text-sm"
          />
          <span className="text-xs text-muted-foreground">{weightUnit}</span>
          <span className="text-xs text-muted-foreground">×</span>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-14 rounded border bg-background px-2 py-1 text-sm"
          />
          <span className="text-xs text-muted-foreground">reps</span>
          <Button size="sm" onClick={saveEdit} className="ml-auto h-7 px-2 text-xs">Save</Button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm">
            {set.weight}{weightUnit} × {set.reps} reps
            {set.notes && <span className="ml-2 text-xs text-muted-foreground">— {set.notes}</span>}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditing(true)}
            aria-label="Edit set"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRemove}
            aria-label="Remove set"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  )
}
