'use client'

// Exercise Reserve page
// Shows all exercises in the user's personal reserve, grouped by body part.
// Users can filter by body part, add new exercises, and delete any exercise.

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type Exercise, BODY_PARTS, type BodyPart } from '@/lib/types'

// ─── Add Exercise Modal ───────────────────────────────────────────────────────

function AddExerciseModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [bodyPart, setBodyPart] = useState<BodyPart | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bodyPart) { setError('Please select a body part.'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in.'); setLoading(false); return }

    const { error } = await supabase.from('exercises').insert({
      user_id: user.id,
      name: name.trim(),
      body_part: bodyPart,
    })

    if (error) { setError(error.message); setLoading(false) }
    else onSaved()
  }

  return (
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
              placeholder="e.g. Cable Lateral Raise"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body part *</label>
            <div className="grid grid-cols-3 gap-2">
              {BODY_PARTS.map((bp) => (
                <button
                  key={bp}
                  type="button"
                  onClick={() => setBodyPart(bp)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                    bodyPart === bp
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {bp}
                </button>
              ))}
            </div>
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

// ─── Body Part Badge ──────────────────────────────────────────────────────────

const BODY_PART_COLORS: Record<BodyPart, string> = {
  Chest:     'bg-red-50 text-red-600',
  Back:      'bg-green-50 text-green-700',
  Shoulders: 'bg-purple-50 text-purple-600',
  Arms:      'bg-orange-50 text-orange-600',
  Legs:      'bg-blue-50 text-blue-600',
  Core:      'bg-yellow-50 text-yellow-700',
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReservePage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filter, setFilter] = useState<BodyPart | 'All'>('All')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Set<BodyPart>>(new Set())

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

  useEffect(() => { fetchExercises() }, [fetchExercises])

  async function handleDelete(exercise: Exercise) {
    if (!confirm(`Remove "${exercise.name}" from your exercises?`)) return
    setDeletingId(exercise.id)
    await supabase.from('exercises').delete().eq('id', exercise.id)
    setExercises((prev) => prev.filter((e) => e.id !== exercise.id))
    setDeletingId(null)
  }

  function toggleSection(bp: BodyPart) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.has(bp) ? next.delete(bp) : next.add(bp)
      return next
    })
  }

  const visibleBodyParts = filter === 'All' ? BODY_PARTS : [filter]

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Exercises</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white text-sm font-semibold rounded-xl px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {(['All', ...BODY_PARTS] as const).map((bp) => (
          <button
            key={bp}
            onClick={() => setFilter(bp)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === bp
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {bp}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 text-sm py-12">Loading...</p>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-gray-500 text-sm">No exercises yet. Tap + Add to get started.</p>
        </div>
      ) : (
        <div className="space-y-2 pb-4">
          {visibleBodyParts.map((bp) => {
            const group = exercises.filter((e) => e.body_part === bp)
            if (group.length === 0) return null
            const isOpen = openSections.has(bp)
            return (
              <div key={bp} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Collapsible header */}
                <button
                  onClick={() => toggleSection(bp)}
                  className="w-full flex items-center justify-between px-4 py-3.5"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${BODY_PART_COLORS[bp]}`}>
                      {bp}
                    </span>
                    <span className="text-xs text-gray-400">{group.length}</span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Exercise list */}
                {isOpen && (
                  <div className="divide-y divide-gray-50 border-t border-gray-100">
                    {group.map((exercise) => (
                      <div key={exercise.id} className="flex items-center justify-between px-4 py-3">
                        <span className="text-sm font-medium text-gray-800">{exercise.name}</span>
                        <button
                          onClick={() => handleDelete(exercise)}
                          disabled={deletingId === exercise.id}
                          className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none disabled:opacity-40"
                          title="Remove exercise"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <AddExerciseModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchExercises() }}
        />
      )}
    </div>
  )
}
