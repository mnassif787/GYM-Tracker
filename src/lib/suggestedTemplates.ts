import type { TemplateExercise } from './types'
import type { UserProfile } from './types'

export interface SuggestedTemplate {
  name: string
  description: string
  goals: UserProfile['goalType'][]
  exercises: TemplateExercise[]
}

export const SUGGESTED_TEMPLATES: SuggestedTemplate[] = [
  // ── Strength ──────────────────────────────────────────────────────────────
  {
    name: 'Strength A — Lower Body',
    description: 'Classic 5×5 squat focus for maximum lower-body strength.',
    goals: ['strength'],
    exercises: [
      { exerciseId: 'squat', sets: 5, reps: 5 },
      { exerciseId: 'leg-press', sets: 3, reps: 8 },
      { exerciseId: 'deadlift', sets: 3, reps: 5 },
      { exerciseId: 'romanian-deadlift', sets: 3, reps: 8 },
      { exerciseId: 'leg-curl', sets: 3, reps: 10 },
    ],
  },
  {
    name: 'Strength B — Upper Body',
    description: '5×5 bench and row for raw pushing and pulling strength.',
    goals: ['strength'],
    exercises: [
      { exerciseId: 'bench-press', sets: 5, reps: 5 },
      { exerciseId: 'barbell-row', sets: 5, reps: 5 },
      { exerciseId: 'shoulder-press', sets: 4, reps: 5 },
      { exerciseId: 'lat-pulldown', sets: 3, reps: 8 },
    ],
  },

  // ── Hypertrophy ───────────────────────────────────────────────────────────
  {
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps volume block.',
    goals: ['hypertrophy'],
    exercises: [
      { exerciseId: 'bench-press', sets: 4, reps: 10 },
      { exerciseId: 'incline-bench-press', sets: 3, reps: 10 },
      { exerciseId: 'dumbbell-fly', sets: 3, reps: 12 },
      { exerciseId: 'shoulder-press', sets: 4, reps: 10 },
      { exerciseId: 'lateral-raise', sets: 3, reps: 15 },
      { exerciseId: 'tricep-pushdown', sets: 3, reps: 12 },
    ],
  },
  {
    name: 'Pull Day',
    description: 'Back and biceps — lats, rows, and curls.',
    goals: ['hypertrophy'],
    exercises: [
      { exerciseId: 'pullup', sets: 3, reps: 8 },
      { exerciseId: 'barbell-row', sets: 4, reps: 10 },
      { exerciseId: 'seated-cable-row', sets: 3, reps: 12 },
      { exerciseId: 'lat-pulldown', sets: 3, reps: 12 },
      { exerciseId: 'bicep-curl', sets: 3, reps: 12 },
      { exerciseId: 'hammer-curl', sets: 3, reps: 12 },
    ],
  },
  {
    name: 'Leg Day',
    description: 'Quads, glutes, and hamstrings hypertrophy block.',
    goals: ['hypertrophy'],
    exercises: [
      { exerciseId: 'squat', sets: 4, reps: 10 },
      { exerciseId: 'leg-press', sets: 3, reps: 12 },
      { exerciseId: 'romanian-deadlift', sets: 3, reps: 10 },
      { exerciseId: 'leg-curl', sets: 3, reps: 12 },
      { exerciseId: 'leg-extension', sets: 3, reps: 12 },
      { exerciseId: 'calf-raise', sets: 4, reps: 15 },
    ],
  },

  // ── Fat Loss ──────────────────────────────────────────────────────────────
  {
    name: 'Full Body Burn A',
    description: 'High-rep full-body circuit to maximise caloric burn.',
    goals: ['fat-loss'],
    exercises: [
      { exerciseId: 'squat', sets: 3, reps: 15 },
      { exerciseId: 'bench-press', sets: 3, reps: 15 },
      { exerciseId: 'barbell-row', sets: 3, reps: 15 },
      { exerciseId: 'shoulder-press', sets: 3, reps: 15 },
      { exerciseId: 'cable-crunch', sets: 3, reps: 15 },
    ],
  },
  {
    name: 'Full Body Burn B',
    description: 'Compound movement finisher for metabolic conditioning.',
    goals: ['fat-loss'],
    exercises: [
      { exerciseId: 'deadlift', sets: 3, reps: 12 },
      { exerciseId: 'walking-lunge', sets: 3, reps: 12 },
      { exerciseId: 'lat-pulldown', sets: 3, reps: 15 },
      { exerciseId: 'lateral-raise', sets: 3, reps: 15 },
      { exerciseId: 'hanging-leg-raise', sets: 3, reps: 12 },
    ],
  },

  // ── Toning ────────────────────────────────────────────────────────────────
  {
    name: 'Upper Body Tone',
    description: 'Sculpt shoulders, back, and arms with moderate weight.',
    goals: ['toning'],
    exercises: [
      { exerciseId: 'shoulder-press', sets: 3, reps: 12 },
      { exerciseId: 'lateral-raise', sets: 3, reps: 15 },
      { exerciseId: 'seated-cable-row', sets: 3, reps: 15 },
      { exerciseId: 'lat-pulldown', sets: 3, reps: 15 },
      { exerciseId: 'bicep-curl', sets: 3, reps: 15 },
      { exerciseId: 'tricep-pushdown', sets: 3, reps: 15 },
    ],
  },
  {
    name: 'Lower Body Tone',
    description: 'Shape quads and glutes with lighter, higher-rep work.',
    goals: ['toning'],
    exercises: [
      { exerciseId: 'squat', sets: 3, reps: 12 },
      { exerciseId: 'hip-thrust', sets: 3, reps: 15 },
      { exerciseId: 'leg-press', sets: 3, reps: 15 },
      { exerciseId: 'walking-lunge', sets: 3, reps: 12 },
      { exerciseId: 'calf-raise', sets: 3, reps: 15 },
    ],
  },

  // ── Shared ────────────────────────────────────────────────────────────────
  {
    name: 'Big Three',
    description: 'Squat, Bench, Deadlift — the powerlifting trio.',
    goals: ['strength', 'hypertrophy'],
    exercises: [
      { exerciseId: 'squat', sets: 4, reps: 6 },
      { exerciseId: 'bench-press', sets: 4, reps: 6 },
      { exerciseId: 'deadlift', sets: 3, reps: 5 },
    ],
  },
  {
    name: 'Core & Abs',
    description: 'Direct core work suitable for any training goal.',
    goals: ['fat-loss', 'toning', 'hypertrophy'],
    exercises: [
      { exerciseId: 'cable-crunch', sets: 3, reps: 15 },
      { exerciseId: 'hanging-leg-raise', sets: 3, reps: 12 },
      { exerciseId: 'plank', sets: 3, reps: 1 },
    ],
  },
]

export function getSuggestionsForGoal(
  goalType: UserProfile['goalType'],
  existingTemplateNames: string[],
): SuggestedTemplate[] {
  const nameSet = new Set(existingTemplateNames.map((n) => n.toLowerCase()))
  return SUGGESTED_TEMPLATES.filter(
    (t) => t.goals.includes(goalType) && !nameSet.has(t.name.toLowerCase()),
  )
}
