'use client'

// Workout Builder page
// Flow:
//   1. User names the workout
//   2. User taps "Add Exercise" → picks from their library
//   3. For each exercise, user adds sets (reps + weight)
//   4. User taps "Save Workout" → everything is saved to Supabase

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Exercise } from '@/lib/types'

// ─── Types used only on this page ────────────────────────────────────────────

interface SetRow {
  reps: string
  weight: string
}

interface WorkoutExerciseEntry {
  exercise: Exercise
  sets: SetRow[]
}

// ─── Exercise Picker Modal ────────────────────────────────────────────────────

function ExercisePickerModal({
  onClose,
  onPick,
  alreadyPicked,
}: {
  onClose: () => void
  onPick: (exercise: Exercise) => void
  alreadyPicked: string[] // IDs already in the workout
}) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('exercises')
      .select('*')
      .order('name')
      .then(({ data }) => setExercises(data ?? []))
  }, [supabase])

  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.muscle_group ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col max-h-[70vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Pick an Exercise</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              {exercises.length === 0 ? 'Add exercises to your library first.' : 'No results.'}
            </p>
          ) : (
            filtered.map((e) => {
              const alreadyAdded = alreadyPicked.includes(e.id)
              return (
                <button
                  key={e.id}
                  onClick={() => !alreadyAdded && onPick(e)}
                  disabled={alreadyAdded}
                  className={`w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-50 text-left transition-colors ${
                    alreadyAdded
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-blue-50 active:bg-blue-100'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.name}</p>
                    {e.muscle_group && (
                      <p className="text-xs text-gray-400 mt-0.5">{e.muscle_group}</p>
                    )}
                  </div>
                  {alreadyAdded && <span className="text-xs text-gray-400">Added</span>}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Set Row ──────────────────────────────────────────────────────────────────

function SetRowInput({
  index,
  set,
  onChange,
  onRemove,
}: {
  index: number
  set: SetRow
  onChange: (field: 'reps' | 'weight', value: string) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-5 text-right">{index + 1}</span>
      <input
        type="number"
        inputMode="numeric"
        value={set.reps}
        onChange={(e) => onChange('reps', e.target.value)}
        placeholder="Reps"
        min={0}
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="number"
        inputMode="decimal"
        value={set.weight}
        onChange={(e) => onChange('weight', e.target.value)}
        placeholder="kg"
        min={0}
        step={0.5}
        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button onClick={onRemove} className="text-red-400 hover:text-red-600 text-lg leading-none px-1">
        &times;
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewWorkoutPage() {
  const router = useRouter()
  const [workoutName, setWorkoutName] = useState('')
  const [entries, setEntries] = useState<WorkoutExerciseEntry[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Add an exercise to the workout with one empty set to start
  function addExercise(exercise: Exercise) {
    setEntries((prev) => [...prev, { exercise, sets: [{ reps: '', weight: '' }] }])
    setShowPicker(false)
  }

  // Remove an exercise from the workout
  function removeExercise(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  // Add a set row to an exercise
  function addSet(exerciseIndex: number) {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === exerciseIndex
          ? { ...entry, sets: [...entry.sets, { reps: '', weight: '' }] }
          : entry
      )
    )
  }

  // Remove a set row
  function removeSet(exerciseIndex: number, setIndex: number) {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === exerciseIndex
          ? { ...entry, sets: entry.sets.filter((_, j) => j !== setIndex) }
          : entry
      )
    )
  }

  // Update a field in a set row
  function updateSet(exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === exerciseIndex
          ? {
              ...entry,
              sets: entry.sets.map((s, j) => (j === setIndex ? { ...s, [field]: value } : s)),
            }
          : entry
      )
    )
  }

  async function handleSave() {
    if (!workoutName.trim()) {
      setError('Please give your workout a name.')
      return
    }
    if (entries.length === 0) {
      setError('Add at least one exercise.')
      return
    }

    setSaving(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Not logged in.')
      setSaving(false)
      return
    }

    // Step 1: Create the workout record
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, name: workoutName.trim() })
      .select()
      .single()

    if (workoutError || !workout) {
      setError(workoutError?.message ?? 'Failed to save workout.')
      setSaving(false)
      return
    }

    // Step 2: For each exercise, create a workout_exercise row then save its sets
    for (let i = 0; i < entries.length; i++) {
      const { exercise, sets } = entries[i]

      const { data: we, error: weError } = await supabase
        .from('workout_exercises')
        .insert({ workout_id: workout.id, exercise_id: exercise.id, order_index: i })
        .select()
        .single()

      if (weError || !we) continue

      // Step 3: Insert all sets for this exercise
      const setsToInsert = sets
        .filter((s) => s.reps || s.weight) // Only save sets with at least one value
        .map((s) => ({
          workout_exercise_id: we.id,
          reps: s.reps ? parseInt(s.reps) : null,
          weight: s.weight ? parseFloat(s.weight) : null,
        }))

      if (setsToInsert.length > 0) {
        await supabase.from('sets').insert(setsToInsert)
      }
    }

    // All done — go to history
    router.push('/history')
  }

  const pickedIds = entries.map((e) => e.exercise.id)

  return (
    <div className="px-4 pt-6 pb-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-4">New Workout</h1>

      {/* Workout name */}
      <div className="mb-4">
        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="Workout name (e.g. Push Day)"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-4 mb-4">
        {entries.map((entry, exerciseIndex) => (
          <div key={entry.exercise.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            {/* Exercise header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{entry.exercise.name}</p>
                {entry.exercise.muscle_group && (
                  <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full mt-1 inline-block">
                    {entry.exercise.muscle_group}
                  </span>
                )}
              </div>
              <button
                onClick={() => removeExercise(exerciseIndex)}
                className="text-gray-300 hover:text-red-500 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Column labels */}
            <div className="flex items-center gap-2 mb-2 pl-7">
              <span className="flex-1 text-xs text-gray-400 font-medium">Reps</span>
              <span className="flex-1 text-xs text-gray-400 font-medium">Weight (kg)</span>
              <span className="w-6" />
            </div>

            {/* Set rows */}
            <div className="space-y-2">
              {entry.sets.map((set, setIndex) => (
                <SetRowInput
                  key={setIndex}
                  index={setIndex}
                  set={set}
                  onChange={(field, value) => updateSet(exerciseIndex, setIndex, field, value)}
                  onRemove={() => removeSet(exerciseIndex, setIndex)}
                />
              ))}
            </div>

            {/* Add set button */}
            <button
              onClick={() => addSet(exerciseIndex)}
              className="mt-3 text-blue-600 text-xs font-semibold hover:text-blue-800"
            >
              + Add set
            </button>
          </div>
        ))}
      </div>

      {/* Add exercise button */}
      <button
        onClick={() => setShowPicker(true)}
        className="w-full border-2 border-dashed border-blue-200 text-blue-500 font-semibold rounded-2xl py-4 text-sm hover:border-blue-400 hover:text-blue-700 transition-colors mb-6"
      >
        + Add Exercise
      </button>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white font-semibold rounded-xl py-3.5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Workout'}
      </button>

      {/* Exercise picker modal */}
      {showPicker && (
        <ExercisePickerModal
          onClose={() => setShowPicker(false)}
          onPick={addExercise}
          alreadyPicked={pickedIds}
        />
      )}
    </div>
  )
}
