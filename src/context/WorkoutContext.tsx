// src/context/WorkoutContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Exercise, Workout, WorkoutSet } from '@/lib/types'
import {
  getAllWorkouts,
  saveWorkout,
  deleteWorkout as dbDeleteWorkout,
  getAllExercises,
  saveExercise as dbSaveExercise,
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

  // Exercise management (admin)
  saveExercise: (exercise: Exercise) => Promise<void>
  setAdminMode: (value: boolean) => void
  loadDemoData: () => Promise<void>
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

  // Load workouts and persisted exercise overrides from IndexedDB on mount
  useEffect(() => {
    async function load() {
      const [workouts, savedExercises] = await Promise.all([
        getAllWorkouts(),
        getAllExercises(),
      ])
      setWorkoutHistory(workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))

      if (savedExercises.length > 0) {
        // Merge: saved exercises override defaults, preserving any defaults not yet overridden
        const overrideMap = new Map(savedExercises.map((e) => [e.id, e]))
        setExercises(DEFAULT_EXERCISES.map((e) => overrideMap.get(e.id) ?? e))
      }
    }
    load()
  }, [])

  const startWorkout = useCallback(
    (exercise: Exercise) => {
      const recommendedWeight = getRecommendedWeight(exercise.id, workoutHistory)
      const newWorkout: Workout = {
        id: crypto.randomUUID(),
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        targetMuscles: exercise.targetMuscles,
        date: new Date().toISOString(),
        sets: [],
        notes: '',
        weightUnit: exercise.weightUnit ?? 'kg',
      }
      setCurrentExercise(exercise)
      setCurrentWorkout(newWorkout)

      if (recommendedWeight !== null) {
        toast.info(`Recommended weight: ${recommendedWeight}${exercise.weightUnit ?? 'kg'}`, {
          description: `Based on your last ${exercise.name} session + 2.5kg`,
        })
      } else {
        toast.info(`Starting ${exercise.name}`, {
          description: 'No previous history found. Set your own starting weight.',
        })
      }
    },
    [workoutHistory],
  )

  const addSet = useCallback((set: WorkoutSet) => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev
      return { ...prev, sets: [...prev.sets, set] }
    })
  }, [])

  const updateSet = useCallback((setId: string, partial: Partial<WorkoutSet>) => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sets: prev.sets.map((s) => (s.id === setId ? { ...s, ...partial } : s)),
      }
    })
  }, [])

  const removeSet = useCallback((setId: string) => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev
      return { ...prev, sets: prev.sets.filter((s) => s.id !== setId) }
    })
  }, [])

  const completeWorkout = useCallback(async () => {
    if (!currentWorkout || currentWorkout.sets.length === 0) {
      toast.error('Add at least one set before completing.')
      return
    }

    const allPastWorkouts = workoutHistory.filter(
      (w) => w.exerciseId === currentWorkout.exerciseId,
    )
    const allTimeMaxWeight =
      allPastWorkouts.length > 0
        ? Math.max(...allPastWorkouts.flatMap((w) => w.sets.map((s) => s.weight)))
        : 0

    const currentMaxWeight = Math.max(...currentWorkout.sets.map((s) => s.weight))
    const isPR = currentMaxWeight > allTimeMaxWeight

    const totalVolume = currentWorkout.sets.reduce((sum, s) => sum + s.weight * s.reps, 0)

    const finishedWorkout: Workout = {
      ...currentWorkout,
      isPR,
      totalVolume,
    }

    await saveWorkout(finishedWorkout)
    setWorkoutHistory((prev) =>
      [finishedWorkout, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    )
    setCurrentWorkout(null)
    setCurrentExercise(null)

    if (isPR) {
      toast.success(`🏆 New Personal Record! ${currentMaxWeight}kg on ${currentWorkout.exerciseName}`, {
        duration: 5000,
      })
    } else {
      toast.success(`Workout saved! ${currentWorkout.sets.length} sets logged.`)
    }
  }, [currentWorkout, workoutHistory])

  const clearCurrentWorkout = useCallback(() => {
    setCurrentWorkout(null)
    setCurrentExercise(null)
  }, [])

  const deleteWorkout = useCallback(async (id: string) => {
    await dbDeleteWorkout(id)
    setWorkoutHistory((prev) => prev.filter((w) => w.id !== id))
  }, [])

  const getLastWorkout = useCallback(
    (exerciseId: string): Workout | null => {
      const found = workoutHistory
        .filter((w) => w.exerciseId === exerciseId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return found[0] ?? null
    },
    [workoutHistory],
  )

  const saveExercise = useCallback(async (exercise: Exercise) => {
    await dbSaveExercise(exercise)
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.id === exercise.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = exercise
        return updated
      }
      return [...prev, exercise]
    })
    toast.success(`${exercise.name} updated.`)
  }, [])

  const loadDemoData = useCallback(async () => {
    const demos = generateDemoWorkouts()
    await Promise.all(demos.map((w) => saveWorkout(w)))
    setWorkoutHistory((prev) =>
      [...demos, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    )
    toast.success(`${demos.length} demo workouts loaded!`, {
      description: '4 weeks of progressive training history added.',
    })
  }, [])

  const setAdminMode = useCallback((value: boolean) => {
    setIsAdminMode(value)
    // INSECURE: demo only, replace with proper authentication
    if (value) {
      localStorage.setItem('isAdmin', 'true')
    } else {
      localStorage.removeItem('isAdmin')
    }
  }, [])

  return (
    <WorkoutContext.Provider
      value={{
        currentExercise,
        currentWorkout,
        workoutHistory,
        exercises,
        isAdminMode,
        startWorkout,
        addSet,
        updateSet,
        removeSet,
        completeWorkout,
        clearCurrentWorkout,
        deleteWorkout,
        getLastWorkout,
        saveExercise,
        setAdminMode,
        loadDemoData,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext)
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider')
  return ctx
}
