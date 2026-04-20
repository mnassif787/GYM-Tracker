// src/lib/exercises.ts

import type { Exercise, Workout } from './types'

export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    targetMuscles: ['Chest', 'Triceps', 'Shoulders'],
    qrCode: 'GYM-001',
    isEditable: true,
    recommendedSets: 4,
    recommendedReps: 8,
    weightUnit: 'kg',
    instructions:
      'Lie flat on a bench. Grip the barbell slightly wider than shoulder-width. Lower the bar to your chest, then press up explosively.',
  },
  {
    id: 'squat',
    name: 'Barbell Squat',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    qrCode: 'GYM-002',
    isEditable: true,
    recommendedSets: 5,
    recommendedReps: 5,
    weightUnit: 'kg',
    instructions:
      'Place barbell on upper traps. Stand shoulder-width apart. Squat down until thighs are parallel to the floor, keeping chest up.',
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    targetMuscles: ['Back', 'Glutes', 'Hamstrings'],
    qrCode: 'GYM-003',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 5,
    weightUnit: 'kg',
    instructions:
      'Stand with feet hip-width apart, bar over mid-foot. Hinge at the hips, grip bar, keep back neutral, drive through heels to stand.',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    targetMuscles: ['Lats', 'Biceps', 'Shoulders'],
    qrCode: 'GYM-004',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Sit at lat pulldown machine. Grip bar wide. Pull bar down to upper chest while leaning slightly back. Controlled return.',
  },
  {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    targetMuscles: ['Shoulders', 'Triceps'],
    qrCode: 'GYM-005',
    isEditable: true,
    recommendedSets: 4,
    recommendedReps: 10,
    weightUnit: 'kg',
    instructions:
      'Sit or stand with dumbbells at shoulder height. Press overhead until arms are fully extended. Lower with control.',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    qrCode: 'GYM-006',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Sit in leg press machine. Place feet shoulder-width on platform. Lower platform until 90° knee angle, press back up without locking knees.',
  },
  {
    id: 'bicep-curl',
    name: 'Bicep Curl',
    targetMuscles: ['Biceps', 'Forearms'],
    qrCode: 'GYM-007',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Stand with dumbbells at sides. Curl weights toward shoulders keeping elbows fixed. Squeeze at top, lower with control.',
  },
]

export function getExerciseByQrCode(qrCode: string, exercises = DEFAULT_EXERCISES): Exercise | undefined {
  return exercises.find((e) => e.qrCode === qrCode)
}

export function getExerciseById(id: string, exercises = DEFAULT_EXERCISES): Exercise | undefined {
  return exercises.find((e) => e.id === id)
}

/**
 * Finds the last workout for the given exercise and returns the max weight + 2.5kg
 * as the recommended starting weight for the next session.
 */
export function getRecommendedWeight(exerciseId: string, history: Workout[]): number | null {
  const exerciseWorkouts = history
    .filter((w) => w.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (exerciseWorkouts.length === 0) return null

  const lastWorkout = exerciseWorkouts[0]
  if (!lastWorkout.sets || lastWorkout.sets.length === 0) return null

  const maxWeight = Math.max(...lastWorkout.sets.map((s) => s.weight))
  return maxWeight + 2.5
}
