'use client'

// Workout History page
// Shows past workouts newest first. Each can be expanded to see exercises
// grouped by body part. A "Repeat this workout" button navigates back to
// the New Workout flow with those exercises pre-selected.

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type WorkoutWithDetails, type BodyPart, BODY_PARTS } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const BODY_PART_COLORS: Record<BodyPart, string> = {
  Chest:     'bg-red-50 text-red-600',
  Back:      'bg-green-50 text-green-700',
  Shoulders: 'bg-purple-50 text-purple-600',
  Arms:      'bg-orange-50 text-orange-600',
  Legs:      'bg-blue-50 text-blue-600',
  Core:      'bg-yellow-50 text-yellow-700',
}

// ─── Workout Card ─────────────────────────────────────────────────────────────

function WorkoutCard({
  workout,
  onRepeat,
  onDeleted,
}: {
  workout: WorkoutWithDetails
  onRepeat: (workout: WorkoutWithDetails) => void
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

  // Group exercises by body part for display
  const grouped = BODY_PARTS.reduce<Record<string, typeof workout.workout_exercises>>((acc, bp) => {
    const matches = workout.workout_exercises?.filter((we) => we.exercise?.body_part === bp) ?? []
    if (matches.length > 0) acc[bp] = matches
    return acc
  }, {})

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between px-4 py-4 text-left"
      >
        <div>
          <p className="font-semibold text-gray-900 text-sm">{workout.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{workout.completed_at ? formatDate(workout.completed_at) : ''}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </p>
        </div>
        <span className="text-gray-400 text-lg mt-0.5">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          {/* Exercises grouped by body part */}
          <div className="mt-3 space-y-4">
            {Object.entries(grouped).map(([bp, entries]) => (
              <div key={bp}>
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 ${BODY_PART_COLORS[bp as BodyPart]}`}>
                  {bp}
                </span>
                <ul className="space-y-1">
                  {entries.map((we) => (
                    <li key={we.id} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                      {we.exercise?.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
            <button
              onClick={() => onRepeat(workout)}
              className="flex-1 bg-blue-600 text-white text-xs font-semibold rounded-xl py-2.5 hover:bg-blue-700 transition-colors text-center"
            >
              Repeat this workout
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-400 text-xs font-medium hover:text-red-600 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<WorkoutWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_exercises (
          *,
          exercise:exercises (*)
        )
      `)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    setWorkouts((data as WorkoutWithDetails[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  function handleRepeat(workout: WorkoutWithDetails) {
    // Navigate to New Workout with the repeat param — it will pre-select exercises
    router.push(`/workouts/new?repeat=${workout.id}`)
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">History</h1>

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-12">Loading...</p>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">No workouts yet.</p>
          <p className="text-gray-400 text-xs mt-1">Tap New Workout to log your first session.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onRepeat={handleRepeat}
              onDeleted={fetchHistory}
            />
          ))}
        </div>
      )}
    </div>
  )
}
