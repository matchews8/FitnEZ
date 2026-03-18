'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type WorkoutWithDetails, type Set, type BodyPart, BODY_PARTS } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatSet(s: Set) {
  const reps = s.reps != null ? String(s.reps) : '—'
  const weight = s.weight != null ? `${s.weight}kg` : '—'
  return `${reps} x ${weight}`
}

const BODY_PART_COLORS: Record<BodyPart, string> = {
  Chest:     'bg-red-50 text-red-600',
  Back:      'bg-green-50 text-green-700',
  Shoulders: 'bg-purple-50 text-purple-600',
  Arms:      'bg-orange-50 text-orange-600',
  Legs:      'bg-blue-50 text-blue-600',
  Core:      'bg-yellow-50 text-yellow-700',
}

// ─── Chevron SVG ──────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── Exercise Row (nested collapsible) ────────────────────────────────────────

function ExerciseRow({
  we,
}: {
  we: WorkoutWithDetails['workout_exercises'][number]
}) {
  const [open, setOpen] = useState(false)
  const sets = we.sets ?? []

  return (
    <div className="border-t border-gray-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-gray-800 truncate">{we.exercise?.name}</span>
          {we.exercise?.body_part && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${BODY_PART_COLORS[we.exercise.body_part as BodyPart]}`}>
              {we.exercise.body_part}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          <span className="text-xs text-gray-400">{sets.length} set{sets.length !== 1 ? 's' : ''}</span>
          <Chevron open={open} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3">
          {sets.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No sets logged</p>
          ) : (
            <ul className="space-y-1">
              {sets
                .slice()
                .sort((a, b) => a.set_number - b.set_number)
                .map((s) => (
                  <li key={s.id} className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-700">Set {s.set_number}:</span>
                    {' '}
                    {formatSet(s)}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
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
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm(`Delete "${workout.name}"? This can't be undone.`)) return
    setDeleting(true)
    await supabase.from('workouts').delete().eq('id', workout.id)
    onDeleted()
  }

  const exerciseCount = workout.workout_exercises?.length ?? 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Workout header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{workout.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {workout.completed_at ? formatDate(workout.completed_at) : ''}
            {' · '}
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Chevron open={open} />
      </button>

      {/* Expanded: exercises */}
      {open && (
        <div className="border-t border-gray-100">
          {workout.workout_exercises?.map((we) => (
            <ExerciseRow key={we.id} we={we} />
          ))}

          {/* Actions */}
          <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-50">
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
          exercise:exercises (*),
          sets (*)
        )
      `)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })

    setWorkouts((data as WorkoutWithDetails[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  function handleRepeat(workout: WorkoutWithDetails) {
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
          <p className="text-gray-400 text-xs mt-1">Tap Workout to log your first session.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-4">
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
