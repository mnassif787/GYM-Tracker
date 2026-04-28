// src/pages/TemplatesPage.tsx
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Play, Trash2, ChevronDown, ChevronUp, Pencil, Sparkles,
  ArrowUp, ArrowDown, Wand2, Clock, Dumbbell,
  Calendar, Moon, ChevronRight, CheckCircle2,
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
    saveWeekSchedule,
  } = useWorkout()

  const [activeTab, setActiveTab] = useState<'week' | 'plans'>('week')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkoutTemplate | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showDayPicker, setShowDayPicker] = useState(false)
  const [pickingDay, setPickingDay] = useState<number | null>(null)
  const todayIdx = new Date().getDay()

  const [weekSchedule, setWeekSchedule] = useState<Partial<Record<number, string>>>(
    () => profile?.weekSchedule ?? {},
  )
  // Sync when profile loads asynchronously
  useEffect(() => {
    if (profile?.weekSchedule) setWeekSchedule(profile.weekSchedule)
  }, [profile?.weekSchedule])

  const [daysPerWeek, setDaysPerWeek] = useState(4)

  const suggestions = useMemo(() => {
    if (!profile?.goalType) return []
    return getSuggestionsForGoal(profile.goalType, templates.map((t) => t.name))
  }, [profile?.goalType, templates])

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
      if (musclesA.some((m) => musclesB.includes(m))) { conflicts.add(dayA); conflicts.add(dayB) }
    }
    return conflicts
  }, [weekSchedule, templates, exercises])

  async function adoptSuggestion(s: SuggestedTemplate) {
    const template: WorkoutTemplate = {
      id: crypto.randomUUID(), name: s.name, description: s.description,
      exercises: s.exercises, createdAt: new Date().toISOString(),
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
      id: editing?.id ?? crypto.randomUUID(), name: data.name, description: data.description,
      exercises: data.exercises, createdAt: editing?.createdAt ?? new Date().toISOString(),
    }
    await saveTemplateData(template)
    setDialogOpen(false)
  }

  function handleOptimizeOrder() {
    const current = getValues('exercises')
    const ids = current.map((e) => e.exerciseId).filter(Boolean)
    const sorted = sortExercisesByOptimalOrder(ids, exercises)
    replace(sorted.map((id) => current.find((e) => e.exerciseId === id)!))
  }

  async function handleDayChange(dayIdx: number, templateId: string) {
    const next = { ...weekSchedule }
    if (templateId === '__rest__') { delete next[dayIdx] } else { next[dayIdx] = templateId }
    setWeekSchedule(next)
    await saveWeekSchedule(next)
  }

  async function handleAutoAssign() {
    const newSchedule = buildSmartWeekSchedule(templates, exercises, daysPerWeek)
    setWeekSchedule(newSchedule)
    await saveWeekSchedule(newSchedule)
  }

  function handleStart(template: WorkoutTemplate) {
    startTemplate(template)
    navigate('/log')
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6 space-y-5 page-transition">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Plans</h1>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-muted p-1">
        {([
          { key: 'week', label: 'My Week', icon: Calendar },
          { key: 'plans', label: `Plans (${templates.length})`, icon: Dumbbell },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all',
              activeTab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ─── MY WEEK TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'week' && (
        <>
          {/* Smart Fill explanation card */}
          {templates.length >= 2 && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    <Wand2 className="h-4 w-4 text-primary shrink-0" /> Auto-Build My Week
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    Assigns plans so you never train the same muscles two days in a row.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground mr-0.5">Days/wk:</span>
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
                      >{d}</button>
                    ))}
                  </div>
                  <Button size="sm" className="h-7 text-xs" onClick={handleAutoAssign}>
                    Fill Schedule
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* No plans yet */}
          {templates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center space-y-3">
              <p className="font-semibold text-sm">No plans yet</p>
              <p className="text-xs text-muted-foreground">Create plans first, then assign them to days here.</p>
              <Button size="sm" onClick={() => setActiveTab('plans')}>
                <Plus className="h-4 w-4 mr-1.5" /> Create a Plan
              </Button>
            </div>
          )}

          {/* 7-day list — tap any row to assign */}
          {templates.length > 0 && (
            <div className="space-y-2">
              {DISPLAY_DAYS.map((dayIdx) => {
                const isToday = dayIdx === todayIdx
                const template = weekSchedule[dayIdx]
                  ? templates.find((t) => t.id === weekSchedule[dayIdx]) ?? null
                  : null
                const muscles = template ? getTemplateMuscleGroups(template, exercises) : []
                const hasConflict = muscleConflicts.has(dayIdx) && !!template

                return (
                  <button
                    key={dayIdx}
                    onClick={() => { setPickingDay(dayIdx); setShowDayPicker(true) }}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.98]',
                      isToday ? 'border-primary/50 bg-primary/5' : 'border-border bg-card hover:bg-accent/40',
                    )}
                  >
                    {/* Day badge */}
                    <div className={cn(
                      'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl',
                      isToday ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}>
                      <span className="text-xs font-bold leading-none">{DAY_LABELS[dayIdx]}</span>
                      {isToday && <span className="text-[9px] mt-0.5 opacity-80">Today</span>}
                    </div>

                    {/* Template info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-semibold text-sm', !template && 'text-muted-foreground')}>
                        {template ? template.name : 'Rest Day'}
                      </p>
                      {template && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {muscles.slice(0, 3).map((m) => (
                            <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0">{m}</Badge>
                          ))}
                          {hasConflict && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-500 bg-amber-500/10">
                              ⚠ Overlap
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Today → show Start button; other days → chevron */}
                    {isToday && template ? (
                      <Button
                        size="sm"
                        className="shrink-0 h-8"
                        onClick={(e) => { e.stopPropagation(); handleStart(template) }}
                      >
                        <Play className="h-3.5 w-3.5 mr-1" /> Start
                      </Button>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Day assignment picker dialog */}
          <Dialog open={showDayPicker} onOpenChange={setShowDayPicker}>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {pickingDay !== null ? DAY_LABELS[pickingDay] : ''} — Assign Workout
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2 py-1">
                <button
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors hover:bg-accent',
                    pickingDay !== null && !weekSchedule[pickingDay] ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                  onClick={() => {
                    if (pickingDay !== null) { handleDayChange(pickingDay, '__rest__'); setShowDayPicker(false) }
                  }}
                >
                  <Moon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Rest Day</p>
                    <p className="text-xs text-muted-foreground">No workout — recovery</p>
                  </div>
                  {pickingDay !== null && !weekSchedule[pickingDay] && (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>

                {templates.map((t) => {
                  const isCurrent = pickingDay !== null && weekSchedule[pickingDay] === t.id
                  const muscles = getTemplateMuscleGroups(t, exercises)
                  return (
                    <button
                      key={t.id}
                      className={cn(
                        'w-full text-left rounded-xl border px-4 py-3 transition-colors hover:bg-accent',
                        isCurrent ? 'border-primary bg-primary/5' : 'border-border',
                      )}
                      onClick={() => {
                        if (pickingDay !== null) { handleDayChange(pickingDay, t.id); setShowDayPicker(false) }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm">{t.name}</p>
                        {isCurrent && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                      )}
                      {muscles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {muscles.slice(0, 4).map((m) => (
                            <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* ─── MY PLANS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'plans' && (
        <>
          {/* Empty state */}
          {templates.length === 0 && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-14 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
                  <Dumbbell className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-semibold text-base">Your training plan starts here</p>
                <p className="mt-1.5 text-sm text-muted-foreground max-w-[220px]">
                  Create a plan or pick from our suggestions below.
                </p>
                <Button className="mt-5" size="sm" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-1.5" /> Create First Plan
                </Button>
              </div>

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
                    <div key={s.name} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {s.exercises.slice(0, 4).map((te, i) => {
                          const ex = exercises.find((e) => e.id === te.exerciseId)
                          return (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {ex?.name ?? te.exerciseId}
                            </Badge>
                          )
                        })}
                        {s.exercises.length > 4 && (
                          <Badge variant="secondary" className="text-xs">+{s.exercises.length - 4} more</Badge>
                        )}
                      </div>
                      <Button className="w-full" size="sm" onClick={() => adoptSuggestion(s)}>
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add This Plan
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template cards */}
          <div className="space-y-3">
            {templates.map((t) => {
              const muscles = Array.from(new Set(
                t.exercises.flatMap((te) => exercises.find((e) => e.id === te.exerciseId)?.targetMuscles ?? [])
              )).slice(0, 4)
              const duration = estimateDuration(t.exercises.length)
              const scheduledDays = DISPLAY_DAYS.filter((d) => weekSchedule[d] === t.id)
                .map((d) => DAY_LABELS[d])

              return (
                <Card key={t.id} className="overflow-hidden rounded-2xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base leading-tight">{t.name}</p>
                        {t.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
                        )}
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3 w-3" />{t.exercises.length} exercises
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />~{duration} min
                          </span>
                          {scheduledDays.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />{scheduledDays.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteTemplateData(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {muscles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {muscles.map((m) => (
                          <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    )}

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

                    <Button className="w-full" onClick={() => handleStart(t)}>
                      <Play className="h-4 w-4 mr-1.5" /> Start Workout
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

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
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleOptimizeOrder}>
                  <Wand2 className="h-3 w-3" /> Optimize Order
                </Button>
              </div>
              {fields.map((field, idx) => (
                <div key={field.id} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Exercise {idx + 1}</span>
                    <div className="flex gap-0.5">
                      <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={idx === 0} onClick={() => move(idx, idx - 1)}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={idx === fields.length - 1} onClick={() => move(idx, idx + 1)}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      {fields.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Select defaultValue={field.exerciseId} onValueChange={(v) => setValue(`exercises.${idx}.exerciseId`, v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Pick exercise" /></SelectTrigger>
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
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => append({ exerciseId: '', sets: 3, reps: 10 })}>
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

