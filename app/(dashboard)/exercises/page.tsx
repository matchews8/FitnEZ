'use client'

// Exercise Library page
// Shows all exercises the user has saved, and lets them add new ones.
// Each exercise has a name, muscle group, and optional notes.

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Exercise, MUSCLE_GROUPS } from '@/lib/types'

// ─── Add Exercise Modal ───────────────────────────────────────────────────────

function AddExerciseModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Not logged in.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('exercises').insert({
      user_id: user.id,
      name: name.trim(),
      muscle_group: muscleGroup || null,
      notes: notes.trim() || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      onSaved() // Tell the parent to refresh the list
    }
  }

  return (
    // Dark overlay behind the modal
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50 px-4 pb-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add Exercise</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exercise name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Bench Press"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Muscle group</label>
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Select a muscle group —</option>
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tips, cues, or anything to remember..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold rounded-xl py-3 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Exercise'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  onDeleted,
}: {
  exercise: Exercise
  onDeleted: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm(`Delete "${exercise.name}"? This can't be undone.`)) return
    setDeleting(true)
    await supabase.from('exercises').delete().eq('id', exercise.id)
    onDeleted()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-4 text-left"
      >
        <div>
          <p className="font-semibold text-gray-900 text-sm">{exercise.name}</p>
          {exercise.muscle_group && (
            <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-full">
              {exercise.muscle_group}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-lg">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50">
          {exercise.notes ? (
            <p className="text-sm text-gray-500 mt-3">{exercise.notes}</p>
          ) : (
            <p className="text-sm text-gray-400 italic mt-3">No notes added.</p>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-3 text-red-500 text-xs font-medium hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete exercise'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  const supabase = createClient()

  const fetchExercises = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true })

    setExercises(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  // Filter by search query
  const filtered = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.muscle_group ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">My Exercises</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white text-sm font-semibold rounded-xl px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search exercises..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Exercise list */}
      {loading ? (
        <p className="text-center text-gray-400 text-sm py-12">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-gray-500 text-sm">
            {search ? 'No exercises match your search.' : 'No exercises yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} onDeleted={fetchExercises} />
          ))}
        </div>
      )}

      {/* Add exercise modal */}
      {showModal && (
        <AddExerciseModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            fetchExercises()
          }}
        />
      )}
    </div>
  )
}
