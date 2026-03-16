'use client'

import { createContext, useContext, useState } from 'react'
import type { BodyPart } from './types'

export type SetEntry = { reps: string; weight: string }

export type ActiveExercise = {
  workoutExerciseId: string
  exerciseName: string
  bodyPart: BodyPart
}

export type WorkoutSession = {
  workoutId: string
  workoutName: string
  exercises: ActiveExercise[]
  sets: Record<string, SetEntry[]>
}

type WorkoutSessionContextType = {
  session: WorkoutSession | null
  startSession: (s: WorkoutSession) => void
  updateSets: (weId: string, sets: SetEntry[]) => void
  clearSession: () => void
}

const WorkoutSessionContext = createContext<WorkoutSessionContextType>({
  session: null,
  startSession: () => {},
  updateSets: () => {},
  clearSession: () => {},
})

export function WorkoutSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<WorkoutSession | null>(null)

  function startSession(s: WorkoutSession) {
    setSession(s)
  }

  function updateSets(weId: string, newSets: SetEntry[]) {
    setSession((prev) =>
      prev ? { ...prev, sets: { ...prev.sets, [weId]: newSets } } : prev
    )
  }

  function clearSession() {
    setSession(null)
  }

  return (
    <WorkoutSessionContext.Provider value={{ session, startSession, updateSets, clearSession }}>
      {children}
    </WorkoutSessionContext.Provider>
  )
}

export function useWorkoutSession() {
  return useContext(WorkoutSessionContext)
}
