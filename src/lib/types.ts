// src/lib/types.ts

export interface Exercise {
  id: string
  name: string
  targetMuscles: string[]
  instructions?: string
  qrCode?: string
  imageUrl?: string
  isEditable?: boolean
  recommendedSets?: number
  recommendedReps?: number
  weightUnit?: 'kg' | 'lbs'
  machineName?: string
  machineLocation?: string
}

export interface WorkoutSet {
  id: string
  weight: number
  reps: number
  timestamp: string
  notes?: string
  completed?: boolean
  restTime?: number
}

export interface Workout {
  id: string
  exerciseId: string
  exerciseName: string
  targetMuscles: string[]
  date: string
  sets: WorkoutSet[]
  notes: string
  weightUnit?: 'kg' | 'lbs'
  isPR?: boolean
  totalVolume?: number
}

export interface ExerciseStats {
  totalWorkouts: number
  totalSets: number
  lastWorkoutDate: string | null
  maxWeight: number
  weightUnit: 'kg' | 'lbs'
  recommendedWeight?: number
  recommendedReps?: number
  recommendedSets?: number
  progressTrend?: 'up' | 'down' | 'stable'
  totalVolume?: number
  setDetails?: {
    setNumber: number
    averageWeight: number
    maxWeight: number
  }[]
}
