// src/lib/__tests__/db.test.ts
// Tests for the IndexedDB persistence layer using fake-indexeddb.

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import type { Workout, Exercise } from '../types'

// Helper to create a fresh in-memory IndexedDB for each test
function freshIDB() {
  return new IDBFactory()
}

// We patch globalThis.indexedDB before each import so idb picks up the fresh instance
let getAllWorkouts: typeof import('../db').getAllWorkouts
let saveWorkout: typeof import('../db').saveWorkout
let deleteWorkout: typeof import('../db').deleteWorkout
let getAllExercises: typeof import('../db').getAllExercises
let saveExercise: typeof import('../db').saveExercise
let deleteExercise: typeof import('../db').deleteExercise

beforeEach(async () => {
  // Point idb at a brand-new in-memory IDB instance each time
  globalThis.indexedDB = freshIDB()
  // Re-import the module fresh (reset singleton dbPromise)
  vi.resetModules()
  const mod = await import('../db')
  getAllWorkouts = mod.getAllWorkouts
  saveWorkout = mod.saveWorkout
  deleteWorkout = mod.deleteWorkout
  getAllExercises = mod.getAllExercises
  saveExercise = mod.saveExercise
  deleteExercise = mod.deleteExercise
})

// ─── Fixture helpers ──────────────────────────────────────────────────────────
function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: crypto.randomUUID(),
    exerciseId: 'bench-press',
    exerciseName: 'Bench Press',
    targetMuscles: ['Chest'],
    date: new Date().toISOString(),
    sets: [{ id: crypto.randomUUID(), weight: 80, reps: 8, timestamp: new Date().toISOString() }],
    notes: '',
    weightUnit: 'kg',
    ...overrides,
  }
}

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'bench-press',
    name: 'Bench Press',
    targetMuscles: ['Chest', 'Triceps'],
    qrCode: 'GYM-001',
    isEditable: true,
    weightUnit: 'kg',
    ...overrides,
  }
}

// ─── Workouts ─────────────────────────────────────────────────────────────────
describe('Workout CRUD', () => {
  it('getAllWorkouts returns empty array initially', async () => {
    const result = await getAllWorkouts()
    expect(result).toEqual([])
  })

  it('saveWorkout persists a workout', async () => {
    const w = makeWorkout()
    await saveWorkout(w)
    const all = await getAllWorkouts()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe(w.id)
  })

  it('saveWorkout can store multiple workouts', async () => {
    const w1 = makeWorkout()
    const w2 = makeWorkout()
    await saveWorkout(w1)
    await saveWorkout(w2)
    const all = await getAllWorkouts()
    expect(all).toHaveLength(2)
  })

  it('saveWorkout acts as upsert — updates existing workout', async () => {
    const w = makeWorkout({ notes: 'original' })
    await saveWorkout(w)
    await saveWorkout({ ...w, notes: 'updated' })
    const all = await getAllWorkouts()
    expect(all).toHaveLength(1)
    expect(all[0].notes).toBe('updated')
  })

  it('deleteWorkout removes the correct workout', async () => {
    const w1 = makeWorkout()
    const w2 = makeWorkout()
    await saveWorkout(w1)
    await saveWorkout(w2)
    await deleteWorkout(w1.id)
    const all = await getAllWorkouts()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe(w2.id)
  })

  it('deleteWorkout on non-existent id does not throw', async () => {
    await expect(deleteWorkout('non-existent-id')).resolves.not.toThrow()
  })

  it('persists all workout fields correctly', async () => {
    const w = makeWorkout({
      isPR: true,
      totalVolume: 640,
      weightUnit: 'lbs',
    })
    await saveWorkout(w)
    const [saved] = await getAllWorkouts()
    expect(saved.isPR).toBe(true)
    expect(saved.totalVolume).toBe(640)
    expect(saved.weightUnit).toBe('lbs')
    expect(saved.sets).toHaveLength(1)
    expect(saved.sets[0].weight).toBe(80)
  })
})

// ─── Exercises ───────────────────────────────────────────────────────────────
describe('Exercise CRUD', () => {
  it('getAllExercises returns empty array initially', async () => {
    const result = await getAllExercises()
    expect(result).toEqual([])
  })

  it('saveExercise persists an exercise', async () => {
    const ex = makeExercise()
    await saveExercise(ex)
    const all = await getAllExercises()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe(ex.id)
  })

  it('saveExercise upserts — updates existing exercise by id', async () => {
    const ex = makeExercise({ machineName: 'Machine A' })
    await saveExercise(ex)
    await saveExercise({ ...ex, machineName: 'Machine B' })
    const all = await getAllExercises()
    expect(all).toHaveLength(1)
    expect(all[0].machineName).toBe('Machine B')
  })

  it('deleteExercise removes the correct exercise', async () => {
    const ex1 = makeExercise({ id: 'ex-1', name: 'Exercise 1', qrCode: 'Q1' })
    const ex2 = makeExercise({ id: 'ex-2', name: 'Exercise 2', qrCode: 'Q2' })
    await saveExercise(ex1)
    await saveExercise(ex2)
    await deleteExercise('ex-1')
    const all = await getAllExercises()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('ex-2')
  })

  it('persists machine config fields', async () => {
    const ex = makeExercise({ machineName: 'Leg Press', machineLocation: 'Zone A' })
    await saveExercise(ex)
    const [saved] = await getAllExercises()
    expect(saved.machineName).toBe('Leg Press')
    expect(saved.machineLocation).toBe('Zone A')
  })

  it('persists QR code override', async () => {
    const ex = makeExercise({ qrCode: 'CUSTOM-99' })
    await saveExercise(ex)
    const [saved] = await getAllExercises()
    expect(saved.qrCode).toBe('CUSTOM-99')
  })
})
