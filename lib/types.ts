// Shared TypeScript types for the entire app.
// These match the table shapes in your Supabase database.

export const BODY_PARTS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'] as const

export type BodyPart = (typeof BODY_PARTS)[number]

// A single exercise in the user's Exercise Reserve
export interface Exercise {
  id: string
  user_id: string
  name: string
  body_part: BodyPart
  form_tips: string | null
  created_at: string
}

// A workout session (completed_at is null while active)
export interface Workout {
  id: string
  user_id: string
  name: string
  completed_at: string | null
  created_at: string
}

// A logged set within a workout exercise
export interface Set {
  id: string
  workout_exercise_id: string
  set_number: number
  reps: number | null
  weight: number | null
  created_at: string
}

// A link between a workout and an exercise
export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  exercise?: Exercise
  sets?: Set[]
}

// A fully populated workout used on the history page
export interface WorkoutWithDetails extends Workout {
  workout_exercises: (WorkoutExercise & { exercise: Exercise; sets: Set[] })[]
}
