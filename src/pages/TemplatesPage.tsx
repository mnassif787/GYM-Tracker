// src/pages/TemplatesPage.tsx
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Play, Trash2, ChevronDown, ChevronUp, Pencil, Sparkles,
  BookmarkCheck, ArrowUp, ArrowDown, Wand2, Clock, Dumbbell,
} from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useWorkout } from '@/context/WorkoutContext'
import type { WorkoutTemplate } from '@/lib/types'
import { getSuggestionsForGoal, type SuggestedTemplate } from '@/lib/suggestedTemplates'
import { sortExercisesByOptimalOrder, buildSmartWeekSchedule, getTemplateMuscleGroups } from '@/lib/exercises'
import { cn } from '@/lib/utils'

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 0]

const templateSchema = z.object({
  name: z.string().min(1, 'Name required'),
  description: z.string().optional(),
  exercises: z.array(
    z.object({
      exerciseId: z.string().min(1, 'Choose exercise'),
      sets: z.coerce.number().min(1),
      reps: z.coerce.number().min(1),
    }),
  ).min(1, 'Add at least one exercise'),
})
type TemplateForm = z.infer<typeof templateSchema>

function estimateDuration(exerciseCount: number) {
  return Math.max(15, Math.round(exerciseCount * 4))
}

export function TemplatesPage() {
  const navigate = useNavigate()
  const {
    templates, exercises, profile,
    saveTemplateData, deleteTemplateData, startTemplate,
    setActiveTemplate, resumeActiveTemplate, saveWeekSchedule,
  } = useWorkout()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())

  const todayIdx = new Date().getDay()
  const [weekSchedule, setWeekSchedule] = useState<Partial<Record<number, string>>>(
    () => profile?.weekSchedule ?? {}
  )

  const suggestions = useMemo(() => {
    if (!profile?.goalType) return []
    return getSuggestionsForGoal(profile.goalType, templates.map((t) => t.name))
  }, [profile?.goalType, templates])

  const [daysPerWeek, setDaysPerWeek] = useState(4)

  const muscleConflicts = useMemo(() => {
    const conflicts = new Set<number>()
    for (let i = 0; i < DISPLAY_DAYS.length; i++) {
      const dayA = DISPLAY_DAYS[i]
      const dayB = DISPLAY_DAYS[(i + 1) % DISPLAY_DAYS.length]
      if (!weekSchedule[dayA] || !weekSchedule[dayB]) continue
      const tmplA = templates.find((t) => t.id === weekSchedule[dayA])
      const tmplB = templates.find((t) => t.id === weekSchedule[dayB])
      if (!tmplA || !tmplB) continue
      const musclesA = getTemplateMuscleGroups(tmplA, exercises)
      const musclesB = getTemplateMuscleGroups(tmplB, exercises)
      if (musclesA.some((m) => musclesB.includes(m))) {
        conflicts.add(dayA)
        conflicts.add(dayB)
      }
    }
    return conflicts
  }, [weekSchedule, templates, exercises])

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

  const { register, handleSubmit, control, reset, setValue, getValues, formState: { errors } } = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', description: '', exercises: [{ exerciseId: '', sets: 3, reps: 10 }] },
  })
  const { fields, append, remove, move, replace } = useFieldArray({ control, name: 'exercises' })

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

  function handleOptimizeOrder() {
    const current = getValues('exercises')
    const ids = current.map((e) => e.exerciseId).filter(Boolean)
    const sorted = sortExercisesByOptimalOrder(ids, exercises)
    const reordered = sorted.map((id) => current.find((e) => e.exerciseId === id)!)
    replace(reordered)
  }

  function handleDayChange(dayIdx: number, templateId: string) {
    setWeekSchedule((prev) => {
      const next = { ...prev }
      if (templateId === '__rest__') { delete next[dayIdx] } else { next[dayIdx] = templateId }
      return next
    })
  }

  async function handleSaveSchedule() {
    await saveWeekSchedule(weekSchedule)
  }

  function handleAutoAssign() {
    setWeekSchedule(buildSmartWeekSchedule(templates, exercises, daysPerWeek))
  }

  async function handleDelete(id: string) {
    await deleteTemplateData(id)
  }

  function handleStart(template: WorkoutTemplate) {
    startTemplate(template)
    navigate('/log')
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6 space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Plans</h1>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </div>

      {/* â”€â”€ Weekly Schedule â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {templates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Weekly Schedule
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Days:</span>
                {[3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysPerWeek(d)}
                    className={cn(
                      'h-6 w-6 rounded-full text-[11px] font-bold transition-colors',
                      daysPerWeek === d
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleAutoAssign}>
                <Wand2 className="h-3 w-3" /> Smart Fill
              </Button>
            </div>
          </div>

          {/* Day pill strip */}
          <div
            className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
            style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {DISPLAY_DAYS.map((dayIdx) => {
              const isToday = dayIdx === todayIdx
              const isSelected = dayIdx === selectedDay
              const hasTemplate = !!weekSchedule[dayIdx]
              return (
                <button
                  key={dayIdx}
                  onClick={() => setSelectedDay(dayIdx)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl px-3 py-3 min-w-[48px] min-h-[56px] transition-all shrink-0',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : isToday
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <span className="text-[11px] font-medium">{DAY_LABELS[dayIdx]}</span>
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      hasTemplate && muscleConflicts.has(dayIdx)
                        ? 'bg-amber-400'
                        : hasTemplate
                        ? isSelected ? 'bg-primary-foreground' : 'bg-primary'
                        : 'bg-transparent',
                    )}
                  />
                </button>
              )
            })}
          </div>

          {/* Selected day template picker */}
          <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <div>
              <p className="text-xs text-muted-foreground">
                {DAY_LABELS[selectedDay]}{selectedDay === todayIdx ? ' (Today)' : ''}&nbsp;â€”&nbsp;
                {weekSchedule[selectedDay]
                  ? templates.find((t) => t.id === weekSchedule[selectedDay])?.name ?? 'Unknown'
                  : 'Rest Day'}
              </p>
              {weekSchedule[selectedDay] && (() => {
                const tmpl = templates.find((t) => t.id === weekSchedule[selectedDay])
                const muscles = tmpl ? getTemplateMuscleGroups(tmpl, exercises) : []
                return muscles.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {muscles.map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                    ))}
                    {muscleConflicts.has(selectedDay) && (
                      <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500 bg-amber-500/10">
                        ⚠ Overlaps adjacent day
                      </Badge>
                    )}
                  </div>
                ) : null
              })()}
            </div>
              <Select
                value={weekSchedule[selectedDay] ?? '__rest__'}
                onValueChange={(v) => handleDayChange(selectedDay, v)}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__rest__">Rest Day</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            <Button className="w-full" onClick={handleSaveSchedule}>Save Schedule</Button>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Suggested for You
            </p>
            <Badge variant="outline" className="text-xs capitalize">{profile?.goalType}</Badge>
          </div>
          {suggestions.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl border-l-4 border-l-primary/60 border border-border bg-card p-4 space-y-3"
            >
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.exercises.map((te, i) => {
                  const ex = exercises.find((e) => e.id === te.exerciseId)
                  return (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {ex?.name ?? te.exerciseId} · {te.sets}×{te.reps}
                    </Badge>
                  )
                })}
              </div>
              <Button className="w-full" size="sm" onClick={() => adoptSuggestion(s)}>
                <Play className="h-3.5 w-3.5 mr-1.5" /> Start Now
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {templates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
            <Dumbbell className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-base">Your training plan starts here</p>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-[220px]">
            Create templates to chain exercises into structured workouts.
          </p>
          <Button className="mt-5" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Create First Plan
          </Button>
        </div>
      )}

      {/* Template cards */}
      <div className="space-y-4">
        {templates.map((t) => {
          const isActive = profile?.activeTemplateId === t.id
          const nextIdx = isActive ? (profile?.activeTemplateExerciseIndex ?? 0) % t.exercises.length : null
          const muscles = Array.from(new Set(
            t.exercises.flatMap((te) =>
              exercises.find((e) => e.id === te.exerciseId)?.targetMuscles ?? []
            )
          )).slice(0, 4)
          const duration = estimateDuration(t.exercises.length)

          return (
            <Card
              key={t.id}
              className={cn(
                'overflow-hidden rounded-2xl',
                isActive && 'ring-2 ring-primary',
              )}
            >
              {/* Active banner */}
              {isActive && (
                <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-primary">
                    Active Plan · Exercise {(nextIdx ?? 0) + 1}/{t.exercises.length}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground px-2"
                    onClick={() => setActiveTemplate(null)}
                  >
                    Clear
                  </Button>
                </div>
              )}

              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base leading-tight">{t.name}</p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        {t.exercises.length} exercises
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ~{duration} min
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Muscle badges */}
                {muscles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {muscles.map((m) => (
                      <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                    ))}
                  </div>
                )}

                {/* Exercise list */}
                <div className="flex flex-wrap gap-1">
                  {t.exercises.slice(0, expandedId === t.id ? undefined : 3).map((te, i) => {
                    const ex = exercises.find((e) => e.id === te.exerciseId)
                    return (
                      <span key={i} className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {ex?.name ?? te.exerciseId} · {te.sets}×{te.reps}
                      </span>
                    )
                  })}
                  {t.exercises.length > 3 && (
                    <button
                      className="inline-flex items-center gap-0.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    >
                      {expandedId === t.id
                        ? <><ChevronUp className="h-3 w-3" /> less</>
                        : <><ChevronDown className="h-3 w-3" /> +{t.exercises.length - 3} more</>}
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {isActive ? (
                    <Button className="flex-1" onClick={() => { resumeActiveTemplate(); navigate('/log') }}>
                      <Play className="h-4 w-4 mr-1.5" /> Resume Plan
                    </Button>
                  ) : (
                    <Button className="flex-1" onClick={() => handleStart(t)}>
                      <Play className="h-4 w-4 mr-1.5" /> Start Workout
                    </Button>
                  )}
                  {!isActive && (
                    <Button variant="outline" size="sm" onClick={() => setActiveTemplate(t.id)}>
                      <BookmarkCheck className="h-3.5 w-3.5 mr-1" /> Set as Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Plan' : 'New Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...register('name')} placeholder="e.g. Push Day A" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input {...register('description')} placeholder="Brief notes…" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Exercises</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleOptimizeOrder}
                >
                  <Wand2 className="h-3 w-3" /> Optimize Order
                </Button>
              </div>

              {fields.map((field, idx) => (
                <div key={field.id} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Exercise {idx + 1}</span>
                    <div className="flex gap-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        disabled={idx === 0}
                        onClick={() => move(idx, idx - 1)}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        disabled={idx === fields.length - 1}
                        onClick={() => move(idx, idx + 1)}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => remove(idx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Select
                    defaultValue={field.exerciseId}
                    onValueChange={(v) => setValue(`exercises.${idx}.exerciseId`, v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Pick exercise" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.exercises?.[idx]?.exerciseId && (
                    <p className="text-xs text-destructive">{errors.exercises[idx].exerciseId?.message}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Sets</Label>
                      <Input type="number" min={1} className="h-9" {...register(`exercises.${idx}.sets`)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Reps</Label>
                      <Input type="number" min={1} className="h-9" {...register(`exercises.${idx}.reps`)} />
                    </div>
                  </div>
                </div>
              ))}

              {errors.exercises?.root && (
                <p className="text-xs text-destructive">{errors.exercises.root.message}</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => append({ exerciseId: '', sets: 3, reps: 10 })}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Exercise
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
