// src/pages/TemplatesPage.tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Play, Trash2, ChevronDown, ChevronUp, Pencil, Sparkles, BookmarkCheck } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkout } from '@/context/WorkoutContext'
import type { WorkoutTemplate } from '@/lib/types'
import { getSuggestionsForGoal, type SuggestedTemplate } from '@/lib/suggestedTemplates'

const templateSchema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  exercises: z.array(
    z.object({ exerciseId: z.string().min(1, 'Choose exercise'), sets: z.coerce.number().min(1), reps: z.coerce.number().min(1) }),
  ).min(1, 'Add at least one exercise'),
})
type TemplateForm = z.infer<typeof templateSchema>

export function TemplatesPage() {
  const navigate = useNavigate()
  const { templates, exercises, profile, saveTemplateData, deleteTemplateData, startTemplate, setActiveTemplate, resumeActiveTemplate } = useWorkout()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const suggestions = useMemo(() => {
    if (!profile?.goalType) return []
    return getSuggestionsForGoal(profile.goalType, templates.map((t) => t.name))
  }, [profile?.goalType, templates])

  async function adoptSuggestion(s: SuggestedTemplate) {
    const template: WorkoutTemplate = {
      id: crypto.randomUUID(),
      name: s.name,
      description: s.description,
      exercises: s.exercises,
      createdAt: new Date().toISOString(),
    }
    await saveTemplateData(template)
    startTemplate(template)
    navigate('/log')
  }

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', description: '', exercises: [{ exerciseId: '', sets: 3, reps: 10 }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'exercises' })

  function openCreate() {
    setEditing(null)
    reset({ name: '', description: '', exercises: [{ exerciseId: '', sets: 3, reps: 10 }] })
    setDialogOpen(true)
  }

  function openEdit(t: WorkoutTemplate) {
    setEditing(t)
    reset({ name: t.name, description: t.description ?? '', exercises: t.exercises })
    setDialogOpen(true)
  }

  async function onSubmit(data: TemplateForm) {
    const template: WorkoutTemplate = {
      id: editing?.id ?? crypto.randomUUID(),
      name: data.name,
      description: data.description,
      exercises: data.exercises,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    }
    await saveTemplateData(template)
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    await deleteTemplateData(id)
  }

  function handleStart(template: WorkoutTemplate) {
    startTemplate(template)
    navigate('/log')
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Suggested for You</h2>
            <span className="text-xs text-muted-foreground capitalize">({profile?.goalType})</span>
          </div>
          {suggestions.map((s) => (
            <Card key={s.name} className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{s.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {s.exercises.map((te, i) => {
                    const ex = exercises.find((e) => e.id === te.exerciseId)
                    return (
                      <Badge key={i} variant="outline" className="text-xs">
                        {ex?.name ?? te.exerciseId} · {te.sets}×{te.reps}
                      </Badge>
                    )
                  })}
                </div>
                <Button className="w-full" variant="secondary" onClick={() => adoptSuggestion(s)}>
                  <Play className="h-4 w-4 mr-2" /> Start Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {templates.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No templates yet. Create one to chain exercises into a full workout session.
          </CardContent>
        </Card>
      )}

      {templates.map((t) => {
        const isActive = profile?.activeTemplateId === t.id
        const nextIdx = isActive ? (profile?.activeTemplateExerciseIndex ?? 0) % t.exercises.length : null
        return (
        <Card key={t.id} className={isActive ? 'ring-2 ring-primary' : ''}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{t.name}</CardTitle>
                  {isActive && <Badge className="text-xs bg-primary text-primary-foreground">Active Plan</Badge>}
                </div>
                {t.description && <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>}
                {isActive && nextIdx !== null && (
                  <p className="text-xs text-primary mt-0.5">
                    Resume from exercise {nextIdx + 1}/{t.exercises.length}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => openEdit(t)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {t.exercises.slice(0, expandedId === t.id ? undefined : 3).map((te, i) => {
                const ex = exercises.find((e) => e.id === te.exerciseId)
                return (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {ex?.name ?? te.exerciseId} · {te.sets}x{te.reps}
                  </Badge>
                )
              })}
              {t.exercises.length > 3 && (
                <button
                  className="text-xs text-muted-foreground underline"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  {expandedId === t.id ? <><ChevronUp className="inline h-3 w-3" /> less</> : <><ChevronDown className="inline h-3 w-3" /> +{t.exercises.length - 3} more</>}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {isActive ? (
                <Button className="flex-1" onClick={() => { resumeActiveTemplate(); navigate('/log') }}>
                  <Play className="h-4 w-4 mr-2" /> Resume Plan
                </Button>
              ) : (
                <Button className="flex-1" onClick={() => handleStart(t)}>
                  <Play className="h-4 w-4 mr-2" /> Start Workout
                </Button>
              )}
              {isActive ? (
                <Button variant="outline" size="sm" onClick={() => setActiveTemplate(null)}>
                  Clear
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setActiveTemplate(t.id)}>
                  <BookmarkCheck className="h-4 w-4 mr-1" /> Set as Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        )
      })}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Template' : 'New Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input {...register('name')} placeholder="e.g. Push Day A" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input {...register('description')} placeholder="Brief notes…" />
            </div>

            <div className="space-y-2">
              <Label>Exercises</Label>
              {fields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      defaultValue={field.exerciseId}
                      onValueChange={(v) => setValue(`exercises.${idx}.exerciseId`, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pick exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {exercises.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.exercises?.[idx]?.exerciseId && (
                      <p className="text-xs text-destructive mt-0.5">{errors.exercises[idx].exerciseId?.message}</p>
                    )}
                  </div>
                  <div className="w-14">
                    <Label className="text-xs">Sets</Label>
                    <Input type="number" min={1} {...register(`exercises.${idx}.sets`)} />
                  </div>
                  <div className="w-14">
                    <Label className="text-xs">Reps</Label>
                    <Input type="number" min={1} {...register(`exercises.${idx}.reps`)} />
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" size="icon" variant="ghost" className="text-destructive mb-0.5" onClick={() => remove(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {errors.exercises?.root && (
                <p className="text-xs text-destructive">{errors.exercises.root.message}</p>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ exerciseId: '', sets: 3, reps: 10 })}>
                <Plus className="h-4 w-4 mr-1" /> Add Exercise
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Template</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
