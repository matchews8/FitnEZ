'use client'

// Workout History page
// Shows all past workouts, newest first.
// Each workout can be expanded to see the exercises and sets performed.

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type WorkoutWithDetails } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Workout Card ─────────────────────────────────────────────────────────────

function WorkoutCard({
  workout,
  onDeleted,
}: {
  workout: WorkoutWithDetails
  onDeleted: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm(`Delete "${workout.name}"? This can't be undone.`)) return
    setDeleting(true)
    await supabase.from('workouts').delete().eq('id', workout.id)
    onDeleted()
  }

  const exerciseCount = workout.workout_exercises?.length ?? 0
  const setCount = workout.workout_exercises?.reduce(
    (total, we) => total + (we.sets?.length ?? 0),
    0
  ) ?? 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header — tap to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <div>
          <p className="font-semibold text-gray-900 text-sm">{workout.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(workout.completed_at)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} · {setCount} set{setCount !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-gray-400 text-lg">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          <div className="mt-3 space-y-4">
            {workout.workout_exercises?.map((we) => (
              <div key={we.id}>
                <p className="text-sm font-medium text-gray-800 mb-1">{we.exercise?.name}</p>
                {we.exercise?.muscle_group && (
                  <span className="inline-block text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full mb-2">
                    {we.exercise.muscle_group}
                  </span>
                )}

                {we.sets && we.sets.length > 0 ? (
                  <table className="w-full text-xs text-gray-500">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="text-left font-medium pb-1">Set</th>
                        <th className="text-left font-medium pb-1">Reps</th>
                        <th className="text-left font-medium pb-1">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {we.sets.map((set, i) => (
                        <tr key={set.id} className="border-t border-gray-50">
                          <td className="py-1 text-gray-400">{i + 1}</td>
                          <td className="py-1">{set.reps ?? '—'}</td>
                          <td className="py-1">{set.weight != null ? `${set.weight} kg` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-gray-400 italic">No sets recorded.</p>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-4 text-red-500 text-xs font-medium hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete workout'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchHistory = useCallback(async () => {
    setLoading(true)

    // Fetch workouts with nested exercises and sets in one query
    const { data } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          exercise:exercises (*),
          sets (*)
        )
      `)
      .order('completed_at', { ascending: false })

    setWorkouts((data as WorkoutWithDetails[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Workout History</h1>

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-12">Loading...</p>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">No workouts yet. Complete your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} onDeleted={fetchHistory} />
          ))}
        </div>
      )}
    </div>
  )
}
