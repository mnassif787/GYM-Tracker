// src/lib/db.ts
// IndexedDB persistence layer via idb — replaces all localStorage for workout/exercise data.

import { openDB, type IDBPDatabase } from 'idb'
import type { Workout, Exercise } from './types'

const DB_NAME = 'gym-tracker'
const DB_VERSION = 2

type GymTrackerDB = {
  workouts: {
    key: string
    value: Workout
  }
  exercises: {
    key: string
    value: Exercise
  }
}

let dbPromise: Promise<IDBPDatabase<GymTrackerDB>> | null = null

function getDB(): Promise<IDBPDatabase<GymTrackerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GymTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('workouts', { keyPath: 'id' })
        }
        if (oldVersion < 2) {
          db.createObjectStore('exercises', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

// ─── Workouts ────────────────────────────────────────────────────────────────

export async function getAllWorkouts(): Promise<Workout[]> {
  const db = await getDB()
  return db.getAll('workouts')
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const db = await getDB()
  await db.put('workouts', workout)
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('workouts', id)
}

// ─── Exercises (persisted overrides) ─────────────────────────────────────────

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB()
  return db.getAll('exercises')
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  const db = await getDB()
  await db.put('exercises', exercise)
}

export async function deleteExercise(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('exercises', id)
}
