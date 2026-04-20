// src/lib/__tests__/exercises.test.ts
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_EXERCISES,
  getExerciseByQrCode,
  getExerciseById,
  getRecommendedWeight,
} from '../exercises'
import type { Workout } from '../types'

// ─── Fixture helpers ──────────────────────────────────────────────────────────
function makeWorkout(
  overrides: Partial<Workout> & { exerciseId: string; sets: Workout['sets'] },
): Workout {
  return {
    id: crypto.randomUUID(),
    exerciseName: 'Test Exercise',
    targetMuscles: [],
    date: new Date().toISOString(),
    notes: '',
    weightUnit: 'kg',
    ...overrides,
  }
}

function makeSet(weight: number, reps = 8) {
  return {
    id: crypto.randomUUID(),
    weight,
    reps,
    timestamp: new Date().toISOString(),
  }
}

// ─── DEFAULT_EXERCISES ────────────────────────────────────────────────────────
describe('DEFAULT_EXERCISES', () => {
  it('contains exactly 7 exercises', () => {
    expect(DEFAULT_EXERCISES).toHaveLength(7)
  })

  it('every exercise has a unique id', () => {
    const ids = DEFAULT_EXERCISES.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every exercise has a unique qrCode', () => {
    const codes = DEFAULT_EXERCISES.map((e) => e.qrCode).filter(Boolean)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('all exercises are marked as editable', () => {
    expect(DEFAULT_EXERCISES.every((e) => e.isEditable === true)).toBe(true)
  })

  it('all exercises use kg as weight unit', () => {
    expect(DEFAULT_EXERCISES.every((e) => e.weightUnit === 'kg')).toBe(true)
  })

  it('each exercise has at least one target muscle', () => {
    DEFAULT_EXERCISES.forEach((e) => {
      expect(e.targetMuscles.length).toBeGreaterThan(0)
    })
  })

  it('each exercise has recommendedSets and recommendedReps defined', () => {
    DEFAULT_EXERCISES.forEach((e) => {
      expect(e.recommendedSets).toBeDefined()
      expect(e.recommendedReps).toBeDefined()
    })
  })

  it('contains the 7 required exercises by id', () => {
    const ids = DEFAULT_EXERCISES.map((e) => e.id)
    expect(ids).toContain('bench-press')
    expect(ids).toContain('squat')
    expect(ids).toContain('deadlift')
    expect(ids).toContain('lat-pulldown')
    expect(ids).toContain('shoulder-press')
    expect(ids).toContain('leg-press')
    expect(ids).toContain('bicep-curl')
  })
})

// ─── getExerciseByQrCode ──────────────────────────────────────────────────────
describe('getExerciseByQrCode', () => {
  it('returns the correct exercise for a known QR code', () => {
    const ex = getExerciseByQrCode('GYM-001')
    expect(ex).toBeDefined()
    expect(ex!.id).toBe('bench-press')
    expect(ex!.name).toBe('Bench Press')
  })

  it('returns undefined for an unknown QR code', () => {
    expect(getExerciseByQrCode('GYM-999')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(getExerciseByQrCode('')).toBeUndefined()
  })

  it('is case-sensitive — uppercase only matches uppercase', () => {
    expect(getExerciseByQrCode('gym-001')).toBeUndefined()
  })

  it('finds all 7 preset QR codes', () => {
    for (let i = 1; i <= 7; i++) {
      const code = `GYM-00${i}`
      expect(getExerciseByQrCode(code)).toBeDefined()
    }
  })

  it('searches within a custom exercise list override', () => {
    const custom = [
      { id: 'custom-1', name: 'Cable Row', targetMuscles: ['Back'], qrCode: 'CUSTOM-01' },
    ]
    const result = getExerciseByQrCode('CUSTOM-01', custom as any)
    expect(result!.id).toBe('custom-1')
  })

  it('returns undefined when custom list does not contain the code', () => {
    const custom = [
      { id: 'custom-1', name: 'Cable Row', targetMuscles: ['Back'], qrCode: 'CUSTOM-01' },
    ]
    expect(getExerciseByQrCode('GYM-001', custom as any)).toBeUndefined()
  })
})

// ─── getExerciseById ──────────────────────────────────────────────────────────
describe('getExerciseById', () => {
  it('returns the correct exercise for a known id', () => {
    const ex = getExerciseById('squat')
    expect(ex).toBeDefined()
    expect(ex!.name).toBe('Barbell Squat')
  })

  it('returns undefined for an unknown id', () => {
    expect(getExerciseById('unknown-exercise')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(getExerciseById('')).toBeUndefined()
  })

  it('finds all 7 preset exercises by id', () => {
    const ids = ['bench-press', 'squat', 'deadlift', 'lat-pulldown', 'shoulder-press', 'leg-press', 'bicep-curl']
    ids.forEach((id) => {
      expect(getExerciseById(id)).toBeDefined()
    })
  })
})

// ─── getRecommendedWeight ────────────────────────────────────────────────────
describe('getRecommendedWeight', () => {
  it('returns null when history is empty', () => {
    expect(getRecommendedWeight('bench-press', [])).toBeNull()
  })

  it('returns null when no workouts match the exerciseId', () => {
    const history = [makeWorkout({ exerciseId: 'squat', sets: [makeSet(100)] })]
    expect(getRecommendedWeight('bench-press', history)).toBeNull()
  })

  it('returns null when the last matching workout has no sets', () => {
    const history = [makeWorkout({ exerciseId: 'bench-press', sets: [] })]
    expect(getRecommendedWeight('bench-press', history)).toBeNull()
  })

  it('returns max weight of last workout + 2.5', () => {
    const history = [
      makeWorkout({ exerciseId: 'bench-press', sets: [makeSet(80), makeSet(85), makeSet(82)] }),
    ]
    expect(getRecommendedWeight('bench-press', history)).toBe(87.5)
  })

  it('uses only the MOST RECENT workout, not the highest-ever', () => {
    const older = makeWorkout({
      exerciseId: 'bench-press',
      sets: [makeSet(100)],
      date: new Date('2026-01-01').toISOString(),
    })
    const newer = makeWorkout({
      exerciseId: 'bench-press',
      sets: [makeSet(60)],
      date: new Date('2026-03-01').toISOString(),
    })
    // Should use newer (60kg) → 62.5, not 102.5
    expect(getRecommendedWeight('bench-press', [older, newer])).toBe(62.5)
  })

  it('ignores workouts for other exercises', () => {
    const history = [
      makeWorkout({ exerciseId: 'squat', sets: [makeSet(200)] }),
      makeWorkout({ exerciseId: 'bench-press', sets: [makeSet(90)] }),
    ]
    expect(getRecommendedWeight('bench-press', history)).toBe(92.5)
  })

  it('handles a single-set workout', () => {
    const history = [makeWorkout({ exerciseId: 'deadlift', sets: [makeSet(120)] })]
    expect(getRecommendedWeight('deadlift', history)).toBe(122.5)
  })

  it('adds exactly 2.5 to max weight', () => {
    const history = [makeWorkout({ exerciseId: 'bench-press', sets: [makeSet(50)] })]
    const result = getRecommendedWeight('bench-press', history)
    expect(result! - 50).toBe(2.5)
  })

  it('handles decimal weights correctly', () => {
    const history = [makeWorkout({ exerciseId: 'bench-press', sets: [makeSet(72.5)] })]
    expect(getRecommendedWeight('bench-press', history)).toBe(75)
  })
})
