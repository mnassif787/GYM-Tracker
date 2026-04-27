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

  // ── Back ─────────────────────────────────────────────────────────────────
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    targetMuscles: ['Back', 'Lats', 'Biceps'],
    qrCode: 'GYM-008',
    isEditable: true,
    recommendedSets: 4,
    recommendedReps: 8,
    weightUnit: 'kg',
    instructions:
      'Hinge forward at the hips, back flat, knees slightly bent. Pull the barbell to your lower ribcage, leading with elbows. Lower with control.',
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    targetMuscles: ['Back', 'Lats', 'Biceps'],
    qrCode: 'GYM-009',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Sit upright at cable row machine. Pull handle to abdomen, squeezing shoulder blades together. Slowly extend arms back to start.',
  },
  {
    id: 'pullup',
    name: 'Pull-Up',
    targetMuscles: ['Lats', 'Biceps', 'Back'],
    qrCode: 'GYM-010',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 8,
    weightUnit: 'kg',
    instructions:
      'Hang from a bar with overhand grip, hands shoulder-width apart. Pull your chest to the bar by driving elbows down. Lower fully.',
  },

  // ── Chest ────────────────────────────────────────────────────────────────
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
    qrCode: 'GYM-011',
    isEditable: true,
    recommendedSets: 4,
    recommendedReps: 10,
    weightUnit: 'kg',
    instructions:
      'Set bench to 30-45 degrees. Lower the barbell to your upper chest, then press up and slightly back. Focus on upper pec stretch at the bottom.',
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    targetMuscles: ['Chest', 'Shoulders'],
    qrCode: 'GYM-012',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Lie flat on a bench with dumbbells above your chest, elbows slightly bent. Lower them out in an arc until you feel a chest stretch, then squeeze back up.',
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    targetMuscles: ['Chest'],
    qrCode: 'GYM-013',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 15,
    weightUnit: 'kg',
    instructions:
      'Stand between two cable stacks set high. Pull handles down and together in front of you, crossing slightly. Squeeze chest, slowly return.',
  },

  // ── Shoulders ────────────────────────────────────────────────────────────
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    targetMuscles: ['Shoulders'],
    qrCode: 'GYM-014',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 15,
    weightUnit: 'kg',
    instructions:
      'Hold dumbbells at your sides. Raise arms out to the sides until shoulder height, leading with elbows slightly bent. Lower with control.',
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    targetMuscles: ['Shoulders', 'Traps', 'Back'],
    qrCode: 'GYM-015',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 15,
    weightUnit: 'kg',
    instructions:
      'Set cable at head height with rope attachment. Pull toward your face, flaring elbows out. Externally rotate hands at end of movement.',
  },

  // ── Arms ─────────────────────────────────────────────────────────────────
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    targetMuscles: ['Triceps'],
    qrCode: 'GYM-016',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Stand at cable machine with bar or rope set high. Keeping elbows at your sides, push down until arms are fully extended. Slowly return.',
  },
  {
    id: 'overhead-tricep-extension',
    name: 'Overhead Tricep Extension',
    targetMuscles: ['Triceps'],
    qrCode: 'GYM-017',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Hold a dumbbell with both hands overhead, arms straight. Lower the weight behind your head by bending elbows, then extend back up.',
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    targetMuscles: ['Biceps', 'Forearms'],
    qrCode: 'GYM-018',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Hold dumbbells with a neutral (palms-in) grip. Curl weights up without rotating your wrist. Great for brachialis and forearm thickness.',
  },

  // ── Legs ─────────────────────────────────────────────────────────────────
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    targetMuscles: ['Hamstrings', 'Glutes', 'Back'],
    qrCode: 'GYM-019',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 10,
    weightUnit: 'kg',
    instructions:
      'Hold a barbell at hip height. Hinge forward, pushing hips back, keeping bar close to legs and back flat. Lower until hamstring stretch, drive hips forward to stand.',
  },
  {
    id: 'leg-curl',
    name: 'Lying Leg Curl',
    targetMuscles: ['Hamstrings'],
    qrCode: 'GYM-020',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Lie face down on leg curl machine. Curl weight up toward glutes by flexing knees. Squeeze at the top, lower with control.',
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    targetMuscles: ['Quadriceps'],
    qrCode: 'GYM-021',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Sit in leg extension machine. Extend legs until straight, squeezing quads at the top. Lower slowly.',
  },
  {
    id: 'calf-raise',
    name: 'Standing Calf Raise',
    targetMuscles: ['Calves'],
    qrCode: 'GYM-022',
    isEditable: true,
    recommendedSets: 4,
    recommendedReps: 15,
    weightUnit: 'kg',
    instructions:
      'Stand on the edge of a step or calf raise platform. Rise onto your toes as high as possible, pause at the top, then lower fully for a deep stretch.',
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    targetMuscles: ['Glutes', 'Hamstrings'],
    qrCode: 'GYM-023',
    isEditable: true,
    recommendedSets: 4,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Rest upper back on a bench, barbell across hips. Drive hips up by squeezing glutes until body forms a straight line from knees to shoulders. Lower with control.',
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings'],
    qrCode: 'GYM-024',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Hold dumbbells at your sides. Step forward into a lunge, lower back knee toward floor, then drive through front heel and bring the other foot forward. Alternate legs.',
  },

  // ── Core ─────────────────────────────────────────────────────────────────
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    targetMuscles: ['Abs', 'Core'],
    qrCode: 'GYM-025',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 15,
    weightUnit: 'kg',
    instructions:
      'Kneel at a high cable with rope attachment. Hold rope at either side of your head. Crunch down by flexing your spine, not pulling with your arms.',
  },
  {
    id: 'plank',
    name: 'Plank',
    targetMuscles: ['Core', 'Abs', 'Shoulders'],
    qrCode: 'GYM-026',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 1,
    weightUnit: 'kg',
    instructions:
      'Support your body on forearms and toes, body in a straight line. Brace your core, squeeze glutes, do not let hips sag. Hold for time.',
  },
  {
    id: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    targetMuscles: ['Abs', 'Core', 'Hip Flexors'],
    qrCode: 'GYM-027',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 12,
    weightUnit: 'kg',
    instructions:
      'Hang from a pull-up bar. Keeping legs straight or knees bent for easier variation, raise them until parallel to the floor. Lower with control, avoid swinging.',
  },

  // ── Traps ────────────────────────────────────────────────────────────────
  {
    id: 'shrug',
    name: 'Dumbbell Shrug',
    targetMuscles: ['Traps'],
    qrCode: 'GYM-028',
    isEditable: true,
    recommendedSets: 3,
    recommendedReps: 15,
    weightUnit: 'kg',
    instructions:
      'Hold heavy dumbbells at your sides. Shrug shoulders straight up toward your ears, hold briefly at the top, then lower fully. No rolling of the shoulders.',
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
// ─── Smart per-set recommendation ────────────────────────────────────────────

export interface SmartRecommendation {
  weight: number
  reps: number
  sets: number
  note: string
  lastSets: import('./types').WorkoutSet[]
  isProgression: boolean
}

/**
 * Returns a data-driven recommendation for the next session based on:
 * - Per-set history from the last workout (so Set 2 mirrors last Set 2)
 * - Profile goal type (determines target rep range)
 * - Progressive overload: bumps weight when target reps were hit last time
 */
export function getSmartRecommendation(
  exerciseId: string,
  history: Workout[],
  goalType?: string,
  fallbackSets?: number,
  fallbackReps?: number,
): SmartRecommendation | null {
  const past = history
    .filter((w) => w.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const lastWorkout = past[0]
  if (!lastWorkout || lastWorkout.sets.length === 0) return null

  const lastSets = lastWorkout.sets

  // Target reps by goal
  const targetReps =
    goalType === 'strength' ? 5
    : goalType === 'hypertrophy' ? 10
    : goalType === 'fat-loss' || goalType === 'toning' ? 15
    : fallbackReps ?? lastSets[0]?.reps ?? 10

  const avgWeight = lastSets.reduce((a, s) => a + s.weight, 0) / lastSets.length
  const hitAllReps = lastSets.every((s) => s.reps >= targetReps)
  // Progressive overload increment depends on goal (heavier lifts need smaller jumps)
  const increment = avgWeight >= 100 ? 2.5 : avgWeight >= 60 ? 2.5 : 1.25
  const suggestedWeight = hitAllReps
    ? Math.round((avgWeight + increment) * 4) / 4   // round to nearest 0.25
    : Math.round(avgWeight * 4) / 4

  return {
    weight: suggestedWeight,
    reps: targetReps,
    sets: fallbackSets ?? lastSets.length,
    note: hitAllReps
      ? `You hit all reps last time (avg ${avgWeight.toFixed(1)}kg) — try ${suggestedWeight}kg today!`
      : `Aim for ${targetReps} reps each set. Last avg: ${avgWeight.toFixed(1)}kg.`,
    lastSets,
    isProgression: hitAllReps,
  }
}

// ─── Exercise ordering helpers ────────────────────────────────────────────────

// Canonical muscle group order: compound/large groups first, isolation last
export const MUSCLE_GROUP_ORDER: string[] = [
  'Quadriceps', 'Hamstrings', 'Glutes', 'Back', 'Chest',
  'Shoulders', 'Triceps', 'Biceps', 'Core', 'Calves', 'Forearms',
]

/**
 * Lower score = should go earlier in workout.
 * Compound movements (more target muscles) + large muscle groups rank first.
 */
export function getExercisePriority(exercise: Exercise): number {
  const primaryMuscle = exercise.targetMuscles[0] ?? ''
  const groupRank = MUSCLE_GROUP_ORDER.indexOf(primaryMuscle)
  const groupScore = groupRank === -1 ? MUSCLE_GROUP_ORDER.length : groupRank
  // More target muscles = more compound = lower score (compound first)
  const compoundBonus = (4 - Math.min(exercise.targetMuscles.length, 4)) * 10
  return groupScore + compoundBonus
}

/**
 * Returns exerciseIds sorted in optimal workout order:
 * compound multi-joint first, isolation last.
 * Preserves original index as tiebreaker so stable.
 */
export function sortExercisesByOptimalOrder(
  exerciseIds: string[],
  allExercises: Exercise[],
): string[] {
  return [...exerciseIds].sort((a, b) => {
    const exA = allExercises.find((e) => e.id === a)
    const exB = allExercises.find((e) => e.id === b)
    if (!exA || !exB) return 0
    return getExercisePriority(exA) - getExercisePriority(exB)
  })
}

// ─── Template scheduling helpers ─────────────────────────────────────────────

/** Returns the set of primary muscle groups targeted by a template. */
export function getTemplateMuscleGroups(
  template: import('./types').WorkoutTemplate,
  exercises: Exercise[],
): string[] {
  const muscles = new Set<string>()
  template.exercises.forEach((te) => {
    const ex = exercises.find((e) => e.id === te.exerciseId)
    if (ex?.targetMuscles[0]) muscles.add(ex.targetMuscles[0])
  })
  return Array.from(muscles)
}

/**
 * Builds a smart weekly schedule by assigning templates to training days,
 * minimising consecutive-day muscle group overlap.
 * Uses a greedy algorithm: for each training day, picks the template with
 * the least muscle overlap vs the previous day, breaking ties by usage count.
 */
export function buildSmartWeekSchedule(
  templates: import('./types').WorkoutTemplate[],
  exercises: Exercise[],
  daysPerWeek = 4,
): Partial<Record<number, string>> {
  if (templates.length === 0) return {}

  const TRAINING_DAYS: Record<number, number[]> = {
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 5],
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5, 6],
  }
  const days = TRAINING_DAYS[Math.min(6, Math.max(2, daysPerWeek))] ?? [1, 3, 5]

  const tmplMuscles = templates.map((t) => ({
    id: t.id,
    muscles: getTemplateMuscleGroups(t, exercises),
  }))

  const schedule: Partial<Record<number, string>> = {}
  const usedCount = new Map(templates.map((t) => [t.id, 0]))
  let prevMuscles: string[] = []

  for (const day of days) {
    const scored = tmplMuscles
      .map((tm) => ({
        id: tm.id,
        score:
          tm.muscles.filter((m) => prevMuscles.includes(m)).length * 100 +
          (usedCount.get(tm.id) ?? 0),
      }))
      .sort((a, b) => a.score - b.score)
    const chosen = scored[0].id
    schedule[day] = chosen
    usedCount.set(chosen, (usedCount.get(chosen) ?? 0) + 1)
    prevMuscles = tmplMuscles.find((tm) => tm.id === chosen)?.muscles ?? []
  }

  return schedule
}

// ─── Alternative exercise finder ─────────────────────────────────────────────

/**
 * Returns up to `count` alternative exercises targeting the same primary muscle,
 * excluding the current exercise. Most similar (highest muscle overlap) first.
 */
export function getAlternativeExercises(
  exerciseId: string,
  allExercises: Exercise[],
  count = 5,
): Exercise[] {
  const current = allExercises.find((e) => e.id === exerciseId)
  if (!current) return []
  const primaryMuscle = current.targetMuscles[0]
  return allExercises
    .filter((e) => e.id !== exerciseId && e.targetMuscles.includes(primaryMuscle))
    .map((e) => ({
      exercise: e,
      overlap: e.targetMuscles.filter((m) => current.targetMuscles.includes(m)).length,
    }))
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, count)
    .map((item) => item.exercise)
}