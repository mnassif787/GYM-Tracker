// src/lib/demoData.ts
// Generates 4 weeks of realistic progressive workout history for demo purposes.

import type { Workout, WorkoutSet } from './types'

function makeSet(weight: number, reps: number, offsetMinutes: number): WorkoutSet {
  return {
    id: crypto.randomUUID(),
    weight,
    reps,
    timestamp: new Date(Date.now() + offsetMinutes * 60_000).toISOString(),
    completed: true,
  }
}

function makeWorkout(
  exerciseId: string,
  exerciseName: string,
  targetMuscles: string[],
  dateStr: string,
  sets: { weight: number; reps: number }[],
  isPR = false,
): Workout {
  const workoutSets: WorkoutSet[] = sets.map((s, i) =>
    makeSet(s.weight, s.reps, i * 3),
  )
  const totalVolume = workoutSets.reduce((sum, s) => sum + s.weight * s.reps, 0)
  return {
    id: crypto.randomUUID(),
    exerciseId,
    exerciseName,
    targetMuscles,
    date: new Date(dateStr).toISOString(),
    sets: workoutSets,
    notes: '',
    weightUnit: 'kg',
    isPR,
    totalVolume,
  }
}

// Date helpers — 4 weeks back from today
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(18, 0, 0, 0)
  return d.toISOString()
}

export function generateDemoWorkouts(): Workout[] {
  return [
    // ── Week 4 (most recent, highest weights) ──────────────────────────
    makeWorkout('bench-press', 'Bench Press', ['Chest', 'Triceps', 'Shoulders'], daysAgo(1), [
      { weight: 87.5, reps: 8 },
      { weight: 87.5, reps: 7 },
      { weight: 85, reps: 6 },
      { weight: 82.5, reps: 6 },
    ], true),

    makeWorkout('deadlift', 'Deadlift', ['Back', 'Glutes', 'Hamstrings'], daysAgo(2), [
      { weight: 140, reps: 5 },
      { weight: 140, reps: 5 },
      { weight: 135, reps: 5 },
    ], true),

    makeWorkout('squat', 'Barbell Squat', ['Quadriceps', 'Glutes', 'Hamstrings'], daysAgo(4), [
      { weight: 110, reps: 5 },
      { weight: 110, reps: 5 },
      { weight: 107.5, reps: 5 },
      { weight: 107.5, reps: 4 },
      { weight: 105, reps: 5 },
    ], true),

    makeWorkout('lat-pulldown', 'Lat Pulldown', ['Lats', 'Biceps', 'Shoulders'], daysAgo(5), [
      { weight: 67.5, reps: 12 },
      { weight: 67.5, reps: 10 },
      { weight: 65, reps: 10 },
    ]),

    makeWorkout('shoulder-press', 'Shoulder Press', ['Shoulders', 'Triceps'], daysAgo(5), [
      { weight: 57.5, reps: 10 },
      { weight: 57.5, reps: 9 },
      { weight: 55, reps: 8 },
      { weight: 55, reps: 8 },
    ]),

    makeWorkout('bicep-curl', 'Bicep Curl', ['Biceps', 'Forearms'], daysAgo(6), [
      { weight: 17, reps: 12 },
      { weight: 17, reps: 11 },
      { weight: 16, reps: 12 },
    ]),

    // ── Week 3 ─────────────────────────────────────────────────────────
    makeWorkout('bench-press', 'Bench Press', ['Chest', 'Triceps', 'Shoulders'], daysAgo(8), [
      { weight: 85, reps: 8 },
      { weight: 85, reps: 7 },
      { weight: 82.5, reps: 7 },
      { weight: 80, reps: 6 },
    ]),

    makeWorkout('squat', 'Barbell Squat', ['Quadriceps', 'Glutes', 'Hamstrings'], daysAgo(10), [
      { weight: 107.5, reps: 5 },
      { weight: 107.5, reps: 5 },
      { weight: 105, reps: 5 },
      { weight: 105, reps: 5 },
      { weight: 102.5, reps: 5 },
    ]),

    makeWorkout('deadlift', 'Deadlift', ['Back', 'Glutes', 'Hamstrings'], daysAgo(11), [
      { weight: 135, reps: 5 },
      { weight: 135, reps: 5 },
      { weight: 130, reps: 5 },
    ]),

    makeWorkout('leg-press', 'Leg Press', ['Quadriceps', 'Glutes', 'Hamstrings'], daysAgo(10), [
      { weight: 160, reps: 12 },
      { weight: 160, reps: 10 },
      { weight: 155, reps: 10 },
    ]),

    makeWorkout('lat-pulldown', 'Lat Pulldown', ['Lats', 'Biceps', 'Shoulders'], daysAgo(12), [
      { weight: 65, reps: 12 },
      { weight: 65, reps: 11 },
      { weight: 62.5, reps: 10 },
    ]),

    makeWorkout('shoulder-press', 'Shoulder Press', ['Shoulders', 'Triceps'], daysAgo(12), [
      { weight: 55, reps: 10 },
      { weight: 55, reps: 9 },
      { weight: 52.5, reps: 8 },
      { weight: 52.5, reps: 8 },
    ]),

    makeWorkout('bicep-curl', 'Bicep Curl', ['Biceps', 'Forearms'], daysAgo(13), [
      { weight: 16, reps: 12 },
      { weight: 16, reps: 12 },
      { weight: 15, reps: 12 },
    ]),

    // ── Week 2 ─────────────────────────────────────────────────────────
    makeWorkout('bench-press', 'Bench Press', ['Chest', 'Triceps', 'Shoulders'], daysAgo(15), [
      { weight: 82.5, reps: 8 },
      { weight: 82.5, reps: 7 },
      { weight: 80, reps: 7 },
      { weight: 80, reps: 6 },
    ]),

    makeWorkout('squat', 'Barbell Squat', ['Quadriceps', 'Glutes', 'Hamstrings'], daysAgo(17), [
      { weight: 105, reps: 5 },
      { weight: 105, reps: 5 },
      { weight: 102.5, reps: 5 },
      { weight: 102.5, reps: 5 },
      { weight: 100, reps: 5 },
    ]),

    makeWorkout('deadlift', 'Deadlift', ['Back', 'Glutes', 'Hamstrings'], daysAgo(18), [
      { weight: 130, reps: 5 },
      { weight: 130, reps: 5 },
      { weight: 125, reps: 5 },
    ]),

    makeWorkout('leg-press', 'Leg Press', ['Quadriceps', 'Glutes', 'Hamstrings'], daysAgo(17), [
      { weight: 155, reps: 12 },
      { weight: 155, reps: 10 },
      { weight: 150, reps: 10 },
    ]),

    makeWorkout('lat-pulldown', 'Lat Pulldown', ['Lats', 'Biceps', 'Shoulders'], daysAgo(19), [
      { weight: 62.5, reps: 12 },
      { weight: 62.5, reps: 10 },
      { weight: 60, reps: 10 },
    ]),

    makeWorkout('bicep-curl', 'Bicep Curl', ['Biceps', 'Forearms'], daysAgo(20), [
      { weight: 15, reps: 12 },
      { weight: 15, reps: 12 },
      { weight: 14, reps: 12 },
    ]),

    // ── Week 1 (oldest) ────────────────────────────────────────────────
    makeWorkout('bench-press', 'Bench Press', ['Chest', 'Triceps', 'Shoulders'], daysAgo(22), [
      { weight: 80, reps: 8 },
      { weight: 80, reps: 7 },
      { weight: 77.5, reps: 7 },
      { weight: 77.5, reps: 6 },
    ]),

    makeWorkout('squat', 'Barbell Squat', ['Quadriceps', 'Glutes', 'Hamstrings'], daysAgo(24), [
      { weight: 102.5, reps: 5 },
      { weight: 102.5, reps: 5 },
      { weight: 100, reps: 5 },
      { weight: 100, reps: 5 },
      { weight: 100, reps: 4 },
    ]),

    makeWorkout('deadlift', 'Deadlift', ['Back', 'Glutes', 'Hamstrings'], daysAgo(25), [
      { weight: 125, reps: 5 },
      { weight: 125, reps: 5 },
      { weight: 120, reps: 5 },
    ]),

    makeWorkout('leg-press', 'Leg Press', ['Quadriceps', 'Glutes', 'Hamstrings'], daysAgo(24), [
      { weight: 150, reps: 12 },
      { weight: 150, reps: 10 },
      { weight: 145, reps: 10 },
    ]),

    makeWorkout('shoulder-press', 'Shoulder Press', ['Shoulders', 'Triceps'], daysAgo(22), [
      { weight: 52.5, reps: 10 },
      { weight: 52.5, reps: 8 },
      { weight: 50, reps: 8 },
      { weight: 50, reps: 8 },
    ]),

    makeWorkout('lat-pulldown', 'Lat Pulldown', ['Lats', 'Biceps', 'Shoulders'], daysAgo(26), [
      { weight: 60, reps: 12 },
      { weight: 60, reps: 10 },
      { weight: 57.5, reps: 10 },
    ]),

    makeWorkout('bicep-curl', 'Bicep Curl', ['Biceps', 'Forearms'], daysAgo(27), [
      { weight: 14, reps: 12 },
      { weight: 14, reps: 12 },
      { weight: 13, reps: 12 },
    ]),
  ]
}
