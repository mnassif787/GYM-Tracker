// src/context/WorkoutContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Exercise, Workout, WorkoutSet, UserProfile, WorkoutTemplate } from '@/lib/types'
import {
  getAllWorkouts,
  saveWorkout,
  deleteWorkout as dbDeleteWorkout,
  getAllExercises,
  saveExercise as dbSaveExercise,
  getProfile,
  saveProfile as dbSaveProfile,
  getAllTemplates,
  saveTemplate as dbSaveTemplate,
  deleteTemplate as dbDeleteTemplate,
} from '@/lib/db'
import { DEFAULT_EXERCISES, getRecommendedWeight, getSmartRecommendation, sortExercisesByOptimalOrder } from '@/lib/exercises'
import type { SmartRecommendation } from '@/lib/exercises'
import { generateDemoWorkouts } from '@/lib/demoData'

interface WorkoutContextValue {
  currentExercise: Exercise | null
  currentWorkout: Workout | null
  workoutHistory: Workout[]
  exercises: Exercise[]
  isAdminMode: boolean
  startWorkout: (exercise: Exercise) => void
  addSet: (set: WorkoutSet) => void
  updateSet: (setId: string, partial: Partial<WorkoutSet>) => void
  removeSet: (setId: string) => void
  completeWorkout: () => Promise<void>
  clearCurrentWorkout: () => void
  deleteWorkout: (id: string) => Promise<void>
  updateWorkout: (workout: Workout) => Promise<void>
  getLastWorkout: (exerciseId: string) => Workout | null
  importWorkouts: (data: unknown) => Promise<void>
  getSmartRec: (exerciseId: string) => SmartRecommendation | null
  saveExercise: (exercise: Exercise) => Promise<void>
  setAdminMode: (value: boolean) => void
  loadDemoData: () => Promise<void>
  profile: UserProfile | null
  saveProfileData: (profile: UserProfile) => Promise<void>
  sessionStartTime: Date | null
  templates: WorkoutTemplate[]
  saveTemplateData: (template: WorkoutTemplate) => Promise<void>
  deleteTemplateData: (id: string) => Promise<void>
  startTemplate: (template: WorkoutTemplate, startAt?: number) => void
  resumeActiveTemplate: () => void
  setActiveTemplate: (templateId: string | null) => Promise<void>
  pendingTemplateExercise: Exercise | null
  clearPendingTemplate: () => void
  runningTemplateId: string | null
  saveWeekSchedule: (schedule: Partial<Record<number, string>>) => Promise<void>
  templateQueue: Exercise[]
  templateQueueIndex: number
  swapCurrentExercise: (alternativeExerciseId: string) => void
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null)

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null)
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null)
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([])
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(
    () => localStorage.getItem('isAdmin') === 'true',
  )
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [templateQueue, setTemplateQueue] = useState<Exercise[]>([])
  const [templateQueueIndex, setTemplateQueueIndex] = useState(0)
  const [pendingTemplateExercise, setPendingTemplateExercise] = useState<Exercise | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [runningTemplateId, setRunningTemplateId] = useState<string | null>(null)
  const [runningTemplateStartIdx, setRunningTemplateStartIdx] = useState(0)

  useEffect(() => {
    async function load() {
      const [workouts, savedExercises, savedProfile, savedTemplates] = await Promise.all([
        getAllWorkouts(), getAllExercises(), getProfile(), getAllTemplates(),
      ])
      setWorkoutHistory(workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      if (savedExercises.length > 0) {
        const overrideMap = new Map(savedExercises.map((e) => [e.id, e]))
        setExercises(DEFAULT_EXERCISES.map((e) => overrideMap.get(e.id) ?? e))
      }
      if (savedProfile) setProfile(savedProfile)
      setTemplates(savedTemplates)
    }
    load()
  }, [])

  const startWorkout = useCallback(
    (exercise: Exercise) => {
      const recommendedWeight = getRecommendedWeight(exercise.id, workoutHistory)
      const newWorkout: Workout = {
        id: crypto.randomUUID(), exerciseId: exercise.id, exerciseName: exercise.name,
        targetMuscles: exercise.targetMuscles, date: new Date().toISOString(),
        sets: [], notes: '', weightUnit: exercise.weightUnit ?? 'kg',
      }
      setCurrentExercise(exercise)
      setCurrentWorkout(newWorkout)
      setSessionStartTime((prev) => prev ?? new Date())
      if (recommendedWeight !== null) {
        toast.info(`Recommended: ${recommendedWeight}${exercise.weightUnit ?? 'kg'}`, {
          description: `Based on your last ${exercise.name} session`,
        })
      } else {
        toast.info(`Starting ${exercise.name}`, { description: 'No previous history found.' })
      }
    },
    [workoutHistory],
  )

  const addSet = useCallback((set: WorkoutSet) => {
    setCurrentWorkout((prev) => prev ? { ...prev, sets: [...prev.sets, set] } : prev)
  }, [])

  const updateSet = useCallback((setId: string, partial: Partial<WorkoutSet>) => {
    setCurrentWorkout((prev) =>
      prev ? { ...prev, sets: prev.sets.map((s) => s.id === setId ? { ...s, ...partial } : s) } : prev,
    )
  }, [])

  const removeSet = useCallback((setId: string) => {
    setCurrentWorkout((prev) =>
      prev ? { ...prev, sets: prev.sets.filter((s) => s.id !== setId) } : prev,
    )
  }, [])

  const completeWorkout = useCallback(async () => {
    if (!currentWorkout || currentWorkout.sets.length === 0) {
      toast.error('Add at least one set before completing.')
      return
    }
    const allPastWorkouts = workoutHistory.filter((w) => w.exerciseId === currentWorkout.exerciseId)
    const allTimeMaxWeight = allPastWorkouts.length > 0
      ? Math.max(...allPastWorkouts.flatMap((w) => w.sets.map((s) => s.weight))) : 0
    const currentMaxWeight = Math.max(...currentWorkout.sets.map((s) => s.weight))
    const isPR = currentMaxWeight > allTimeMaxWeight
    const totalVolume = currentWorkout.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
    const finishedWorkout: Workout = { ...currentWorkout, isPR, totalVolume }

    await saveWorkout(finishedWorkout)
    setWorkoutHistory((prev) =>
      [finishedWorkout, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    )
    setCurrentWorkout(null)
    setCurrentExercise(null)

    // Advance active plan exercise index in profile
    if (profile && profile.activeTemplateId && profile.activeTemplateId === runningTemplateId) {
      const tmpl = templates.find((t) => t.id === runningTemplateId)
      if (tmpl) {
        const absoluteIdx = runningTemplateStartIdx + templateQueueIndex
        const nextIdx = (absoluteIdx + 1) % tmpl.exercises.length
        const updated = { ...profile, activeTemplateExerciseIndex: nextIdx }
        await dbSaveProfile(updated)
        setProfile(updated)
      }
    }

    if (templateQueue.length > 0 && templateQueueIndex < templateQueue.length - 1) {
      const nextEx = templateQueue[templateQueueIndex + 1]
      setTemplateQueueIndex((i) => i + 1)
      setPendingTemplateExercise(nextEx)
      toast.success(
        isPR
          ? `PR on ${currentWorkout.exerciseName}! Next: ${nextEx.name}`
          : `Exercise ${templateQueueIndex + 2}/${templateQueue.length} done. Next: ${nextEx.name}`,
      )
    } else if (templateQueue.length > 0) {
      setTemplateQueue([])
      setTemplateQueueIndex(0)
      setRunningTemplateId(null)
      setRunningTemplateStartIdx(0)
      setSessionStartTime(null)
      setPendingTemplateExercise(null)
      toast.success('Template complete! Great workout!', { duration: 5000 })
    } else {
      setSessionStartTime(null)
      if (isPR) {
        toast.success(`New PR! ${currentMaxWeight}kg on ${currentWorkout.exerciseName}`, { duration: 5000 })
      } else {
        toast.success(`Workout saved! ${currentWorkout.sets.length} sets logged.`)
      }
    }
  }, [currentWorkout, workoutHistory, templateQueue, templateQueueIndex, profile, runningTemplateId, runningTemplateStartIdx, templates])

  const clearCurrentWorkout = useCallback(() => {
    setCurrentWorkout(null); setCurrentExercise(null)
  }, [])

  const clearPendingTemplate = useCallback(() => {
    setPendingTemplateExercise(null)
    setTemplateQueue([])
    setTemplateQueueIndex(0)
    setRunningTemplateId(null)
    setRunningTemplateStartIdx(0)
    setSessionStartTime(null)
  }, [])

  const deleteWorkout = useCallback(async (id: string) => {
    await dbDeleteWorkout(id)
    setWorkoutHistory((prev) => prev.filter((w) => w.id !== id))
  }, [])

  const updateWorkout = useCallback(async (workout: Workout) => {
    await saveWorkout(workout)
    setWorkoutHistory((prev) =>
      prev.map((w) => w.id === workout.id ? workout : w)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    )
    toast.success('Workout updated.')
  }, [])

  const getLastWorkout = useCallback((exerciseId: string): Workout | null => {
    return workoutHistory.filter((w) => w.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null
  }, [workoutHistory])

  const getSmartRec = useCallback((exerciseId: string): SmartRecommendation | null => {
    const ex = exercises.find((e) => e.id === exerciseId)
    return getSmartRecommendation(
      exerciseId,
      workoutHistory,
      profile?.goalType,
      ex?.recommendedSets,
      ex?.recommendedReps,
    )
  }, [workoutHistory, profile?.goalType, exercises])

  const importWorkouts = useCallback(async (data: unknown) => {
    if (!Array.isArray(data)) throw new Error('Invalid format: expected an array')
    const valid = (data as Workout[]).filter(
      (w) => typeof w.id === 'string' && typeof w.exerciseId === 'string' && Array.isArray(w.sets),
    )
    const existingIds = new Set(workoutHistory.map((w) => w.id))
    const toImport = valid.filter((w) => !existingIds.has(w.id))
    if (toImport.length === 0) { toast.info('No new workouts - all already exist.'); return }
    await Promise.all(toImport.map((w) => saveWorkout(w)))
    setWorkoutHistory((prev) =>
      [...prev, ...toImport].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    )
    toast.success(`Imported ${toImport.length} workout${toImport.length > 1 ? 's' : ''}.`)
  }, [workoutHistory])

  const saveExercise = useCallback(async (exercise: Exercise) => {
    await dbSaveExercise(exercise)
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.id === exercise.id)
      if (idx >= 0) { const u = [...prev]; u[idx] = exercise; return u }
      return [...prev, exercise]
    })
    toast.success(`${exercise.name} updated.`)
  }, [])

  const loadDemoData = useCallback(async () => {
    const demos = generateDemoWorkouts()
    await Promise.all(demos.map((w) => saveWorkout(w)))
    setWorkoutHistory((prev) =>
      [...demos, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    )
    toast.success(`${demos.length} demo workouts loaded!`, { description: '4 weeks of progressive training history added.' })
  }, [])

  const saveProfileData = useCallback(async (p: UserProfile) => {
    await dbSaveProfile(p)
    setProfile(p)
    toast.success('Profile saved.')
  }, [])

  const saveWeekSchedule = useCallback(async (schedule: Partial<Record<number, string>>) => {
    const base = await getProfile()
    if (!base) return
    const updated: UserProfile = { ...base, weekSchedule: schedule }
    await dbSaveProfile(updated)
    setProfile(updated)
    toast.success('Weekly schedule saved.')
  }, [])

  const saveTemplateData = useCallback(async (template: WorkoutTemplate) => {
    await dbSaveTemplate(template)
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === template.id)
      if (idx >= 0) { const u = [...prev]; u[idx] = template; return u }
      return [...prev, template]
    })
    toast.success(`"${template.name}" saved.`)
  }, [])

  const deleteTemplateData = useCallback(async (id: string) => {
    await dbDeleteTemplate(id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    if (profile?.activeTemplateId === id) {
      const updated = { ...profile, activeTemplateId: undefined, activeTemplateExerciseIndex: 0 }
      await dbSaveProfile(updated)
      setProfile(updated)
    }
  }, [profile])

  const startTemplate = useCallback((template: WorkoutTemplate, startAt = 0) => {
    const sortedIds = sortExercisesByOptimalOrder(
      template.exercises.map((te) => te.exerciseId),
      exercises,
    )
    const allEx = sortedIds
      .map((id) => exercises.find((e) => e.id === id))
      .filter((e): e is Exercise => e !== undefined)
    const queue = allEx.slice(startAt)
    if (queue.length === 0) { toast.error('No valid exercises in this template.'); return }
    setTemplateQueue(queue)
    setTemplateQueueIndex(0)
    setPendingTemplateExercise(null)
    setRunningTemplateId(template.id)
    setRunningTemplateStartIdx(startAt)
    startWorkout(queue[0])
  }, [exercises, startWorkout])

  const resumeActiveTemplate = useCallback(() => {
    if (!profile?.activeTemplateId) {
      toast.error('No active plan set. Assign one in Templates.')
      return
    }
    const template = templates.find((t) => t.id === profile.activeTemplateId)
    if (!template) { toast.error('Active plan template not found.'); return }
    const startAt = (profile.activeTemplateExerciseIndex ?? 0) % template.exercises.length
    toast.info(`Resuming "${template.name}" from exercise ${startAt + 1}/${template.exercises.length}`)
    startTemplate(template, startAt)
  }, [profile, templates, startTemplate])

  const setActiveTemplate = useCallback(async (templateId: string | null) => {
    if (!profile) { toast.error('Create your profile first.'); return }
    const updated: UserProfile = {
      ...profile,
      activeTemplateId: templateId ?? undefined,
      activeTemplateExerciseIndex: 0,
    }
    await dbSaveProfile(updated)
    setProfile(updated)
    if (templateId) {
      const tmpl = templates.find((t) => t.id === templateId)
      toast.success(`"${tmpl?.name ?? 'Template'}" set as your active plan.`)
    } else {
      toast.info('Active plan cleared.')
    }
  }, [profile, templates])

  const setAdminMode = useCallback((value: boolean) => {
    setIsAdminMode(value)
    // INSECURE: demo only, replace with proper authentication
    if (value) { localStorage.setItem('isAdmin', 'true') } else { localStorage.removeItem('isAdmin') }
  }, [])

  const swapCurrentExercise = useCallback((alternativeExerciseId: string) => {
    const alt = exercises.find((e) => e.id === alternativeExerciseId)
    if (!alt) { toast.error('Exercise not found.'); return }
    setTemplateQueue((prev) => {
      const updated = [...prev]
      if (updated[templateQueueIndex] !== undefined) updated[templateQueueIndex] = alt
      return updated
    })
    setPendingTemplateExercise(alt)
    toast.info(`Swapped to ${alt.name}`, { description: `${alt.targetMuscles[0]} · same muscle group` })
  }, [exercises, templateQueueIndex])

  return (
    <WorkoutContext.Provider value={{
      currentExercise, currentWorkout, workoutHistory, exercises, isAdminMode,
      startWorkout, addSet, updateSet, removeSet, completeWorkout, clearCurrentWorkout,
      deleteWorkout, updateWorkout, getLastWorkout, importWorkouts, getSmartRec,
      saveExercise, setAdminMode, loadDemoData,
      profile, saveProfileData, sessionStartTime,
      templates, saveTemplateData, deleteTemplateData, startTemplate,
      resumeActiveTemplate, setActiveTemplate,
      pendingTemplateExercise, clearPendingTemplate,
      runningTemplateId, saveWeekSchedule,
      templateQueue, templateQueueIndex, swapCurrentExercise,
    }}>
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext)
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider')
  return ctx
}