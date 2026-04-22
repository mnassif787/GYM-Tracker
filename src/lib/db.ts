// src/lib/db.ts
// IndexedDB persistence layer via idb — replaces all localStorage for workout/exercise data.

import { openDB, type IDBPDatabase } from 'idb'
import type { Workout, Exercise, UserProfile, WorkoutTemplate } from './types'

const DB_NAME = 'gym-tracker'
const DB_VERSION = 3

type GymTrackerDB = {
  workouts: { key: string; value: Workout }
  exercises: { key: string; value: Exercise }
  profile: { key: string; value: UserProfile }
  templates: { key: string; value: WorkoutTemplate }
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
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('profile')) {
            db.createObjectStore('profile', { keyPath: 'id' })
          }
          if (!db.objectStoreNames.contains('templates')) {
            db.createObjectStore('templates', { keyPath: 'id' })
          }
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

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await getDB()
  return db.get('profile', 'user-profile')
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDB()
  await db.put('profile', profile)
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function getAllTemplates(): Promise<WorkoutTemplate[]> {
  const db = await getDB()
  return db.getAll('templates')
}

export async function saveTemplate(template: WorkoutTemplate): Promise<void> {
  const db = await getDB()
  await db.put('templates', template)
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('templates', id)
}
