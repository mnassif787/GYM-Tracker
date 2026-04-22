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
import { DEFAULT_EXERCISES, getRecommendedWeight } from '@/lib/exercises'
import { generateDemoWorkouts } from '@/lib/demoData'

interface WorkoutContextValue {
  // State
  currentExercise: Exercise | null
  currentWorkout: Workout | null
  workoutHistory: Workout[]
  exercises: Exercise[]
  isAdminMode: boolean

  // Workout actions
  startWorkout: (exercise: Exercise) => void
  addSet: (set: WorkoutSet) => void
  updateSet: (setId: string, partial: Partial<WorkoutSet>) => void
  removeSet: (setId: string) => void
  completeWorkout: () => Promise<void>
  clearCurrentWorkout: () => void
  deleteWorkout: (id: string) => Promise<void>
  getLastWorkout: (exerciseId: string) => Workout | null
  importWorkouts: (data: unknown) => Promise<void>

  // Exercise management (admin)
  saveExercise: (exercise: Exercise) => Promise<void>
  setAdminMode: (value: boolean) => void
  loadDemoData: () => Promise<void>

  // Profile
  profile: UserProfile | null
  saveProfileData: (profile: UserProfile) => Promise<void>

  // Templates
  templates: WorkoutTemplate[]
  saveTemplateData: (template: WorkoutTemplate) => Promise<void>
  deleteTemplateData: (id: string) => Promise<void>
  startTemplate: (template: WorkoutTemplate) => void
  pendingTemplateExercise: Exercise | null
  clearPendingTemplate: () => void
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
      if (recommendedWeight !== null) {
        toast.info(`Recommended weight: ${recommendedWeight}${exercise.weightUnit ?? 'kg'}`, {
          description: `Based on your last ${exercise.name} session + 2.5kg`,
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

    if (templateQueue.length > 0 && templateQueueIndex < templateQueue.length - 1) {
      const nextEx = templateQueue[templateQueueIndex + 1]
      setTemplateQueueIndex((i) => i + 1)
      setPendingTemplateExercise(nextEx)
      toast.success(isPR
        ? `ðŸ† PR! Ready for next: ${nextEx.name}`
        : `Exercise ${templateQueueIndex + 2}/${templateQueue.length} â€” next: ${nextEx.name}`)
    } else if (templateQueue.length > 0) {
      setTemplateQueue([])
      setTemplateQueueIndex(0)
      setPendingTemplateExercise(null)
      toast.success('ðŸŽ‰ Template complete! Amazing workout!', { duration: 5000 })
    } else if (isPR) {
      toast.success(`ðŸ† New Personal Record! ${currentMaxWeight}kg on ${currentWorkout.exerciseName}`, { duration: 5000 })
    } else {
      toast.success(`Workout saved! ${currentWorkout.sets.length} sets logged.`)
    }
  }, [currentWorkout, workoutHistory, templateQueue, templateQueueIndex])

  const clearCurrentWorkout = useCallback(() => {
    setCurrentWorkout(null); setCurrentExercise(null)
  }, [])

  const clearPendingTemplate = useCallback(() => {
    setPendingTemplateExercise(null); setTemplateQueue([]); setTemplateQueueIndex(0)
  }, [])

  const deleteWorkout = useCallback(async (id: string) => {
    await dbDeleteWorkout(id)
    setWorkoutHistory((prev) => prev.filter((w) => w.id !== id))
  }, [])

  const getLastWorkout = useCallback((exerciseId: string): Workout | null => {
    return workoutHistory.filter((w) => w.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null
  }, [workoutHistory])

  const importWorkouts = useCallback(async (data: unknown) => {
    if (!Array.isArray(data)) throw new Error('Invalid format: expected an array')
    const valid = (data as Workout[]).filter(
      (w) => typeof w.id === 'string' && typeof w.exerciseId === 'string' && Array.isArray(w.sets),
    )
    const existingIds = new Set(workoutHistory.map((w) => w.id))
    const toImport = valid.filter((w) => !existingIds.has(w.id))
    if (toImport.length === 0) { toast.info('No new workouts â€” all already exist.'); return }
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
  }, [])

  const startTemplate = useCallback((template: WorkoutTemplate) => {
    const queue = template.exercises
      .map((te) => exercises.find((e) => e.id === te.exerciseId))
      .filter((e): e is Exercise => e !== undefined)
    if (queue.length === 0) { toast.error('No valid exercises in this template.'); return }
    setTemplateQueue(queue)
    setTemplateQueueIndex(0)
    setPendingTemplateExercise(null)
    startWorkout(queue[0])
  }, [exercises, startWorkout])

  const setAdminMode = useCallback((value: boolean) => {
    setIsAdminMode(value)
    // INSECURE: demo only, replace with proper authentication
    if (value) { localStorage.setItem('isAdmin', 'true') } else { localStorage.removeItem('isAdmin') }
  }, [])

  return (
    <WorkoutContext.Provider value={{
      currentExercise, currentWorkout, workoutHistory, exercises, isAdminMode,
      startWorkout, addSet, updateSet, removeSet, completeWorkout, clearCurrentWorkout,
      deleteWorkout, getLastWorkout, importWorkouts,
      saveExercise, setAdminMode, loadDemoData,
      profile, saveProfileData,
      templates, saveTemplateData, deleteTemplateData, startTemplate,
      pendingTemplateExercise, clearPendingTemplate,
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
