// Shared TypeScript types for the entire app.
// These match the table shapes in your Supabase database.

export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Legs',
  'Core',
  'Glutes',
  'Calves',
  'Forearms',
  'Cardio',
  'Other',
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

// A single exercise in the user's library
export interface Exercise {
  id: string
  user_id: string
  name: string
  muscle_group: string | null
  notes: string | null
  created_at: string
}

// A completed workout session
export interface Workout {
  id: string
  user_id: string
  name: string
  notes: string | null
  completed_at: string
  created_at: string
}

// A join between a workout and an exercise (one row per exercise in a workout)
export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  order_index: number
  exercise?: Exercise
  sets?: ExerciseSet[]
}

// A single set within a workout exercise
export interface ExerciseSet {
  id: string
  workout_exercise_id: string
  reps: number | null
  weight: number | null
  created_at: string
}

// A fully populated workout used on the history page
export interface WorkoutWithDetails extends Workout {
  workout_exercises: (WorkoutExercise & {
    exercise: Exercise
    sets: ExerciseSet[]
  })[]
}
