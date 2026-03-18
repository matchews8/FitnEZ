'use client'

// New Workout — multi-step flow
//
// Step 1: Choose "Start new" or "Repeat a previous workout"
// Step 2: (New only) Type a workout name + select body part(s)
// Step 3: Toggle exercises on/off — "Start Workout" creates the DB record
// Step 4: Active workout — log sets/reps/weight per exercise
//         "Finish Workout" saves sets + marks workout complete.
//
// Active workout state lives in WorkoutSessionContext so navigating
// away and back preserves the session.

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type Exercise, type WorkoutWithDetails, BODY_PARTS, type BodyPart } from '@/lib/types'
import { useWorkoutSession, type SetEntry, type ActiveExercise } from '@/lib/workout-session-context'

// ─── Colour map ───────────────────────────────────────────────────────────────

const BODY_PART_COLORS: Record<BodyPart, { pill: string; selected: string }> = {
  Chest:     { pill: 'bg-red-50 text-red-600',      selected: 'border-red-400 bg-red-50' },
  Back:      { pill: 'bg-green-50 text-green-700',   selected: 'border-green-500 bg-green-50' },
  Shoulders: { pill: 'bg-purple-50 text-purple-600', selected: 'border-purple-400 bg-purple-50' },
  Arms:      { pill: 'bg-orange-50 text-orange-600', selected: 'border-orange-400 bg-orange-50' },
  Legs:      { pill: 'bg-blue-50 text-blue-600',     selected: 'border-blue-400 bg-blue-50' },
  Core:      { pill: 'bg-yellow-50 text-yellow-700', selected: 'border-yellow-400 bg-yellow-50' },
}

// ─── Step 1: Choose mode ──────────────────────────────────────────────────────

function Step1({
  onNew,
  onRepeat,
}: {
  onNew: () => void
  onRepeat: (workout: WorkoutWithDetails) => void
}) {
  const [showPastWorkouts, setShowPastWorkouts] = useState(false)
  const [pastWorkouts, setPastWorkouts] = useState<WorkoutWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function loadPastWorkouts() {
    setShowPastWorkouts(true)
    setLoading(true)
    const { data } = await supabase
      .from('workouts')
      .select('*, workout_exercises(*, exercise:exercises(*))')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20)
    setPastWorkouts((data as WorkoutWithDetails[]) ?? [])
    setLoading(false)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">New Workout</h1>
      <p className="text-sm text-gray-400 mb-6">How would you like to start?</p>

      <button
        onClick={onNew}
        className="w-full bg-blue-600 text-white rounded-2xl p-5 text-left mb-3 hover:bg-blue-700 transition-colors shadow-sm"
      >
        <p className="font-bold text-base mb-0.5">Start a new workout</p>
        <p className="text-blue-100 text-sm">Choose a name, body parts, and exercises</p>
      </button>

      {!showPastWorkouts ? (
        <button
          onClick={loadPastWorkouts}
          className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-left hover:bg-gray-50 transition-colors shadow-sm"
        >
          <p className="font-bold text-base text-gray-900 mb-0.5">Repeat a previous workout</p>
          <p className="text-gray-400 text-sm">Pick from your history and repeat it</p>
        </button>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-700 text-sm">Pick a workout to repeat</p>
          </div>
          {loading ? (
            <p className="text-center text-gray-400 text-sm py-6">Loading...</p>
          ) : pastWorkouts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">No past workouts yet.</p>
          ) : (
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {pastWorkouts.map((w) => (
                <button
                  key={w.id}
                  onClick={() => onRepeat(w)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900">{w.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(w.completed_at!)} · {w.workout_exercises?.length ?? 0} exercises
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Name + Body Parts ────────────────────────────────────────────────

function Step2({
  workoutName,
  setWorkoutName,
  selectedBodyParts,
  setSelectedBodyParts,
  onBack,
  onNext,
}: {
  workoutName: string
  setWorkoutName: (v: string) => void
  selectedBodyParts: BodyPart[]
  setSelectedBodyParts: (v: BodyPart[]) => void
  onBack: () => void
  onNext: () => void
}) {
  const [error, setError] = useState<string | null>(null)

  function toggleBodyPart(bp: BodyPart) {
    setSelectedBodyParts(
      selectedBodyParts.includes(bp)
        ? selectedBodyParts.filter((b) => b !== bp)
        : [...selectedBodyParts, bp]
    )
  }

  function handleNext() {
    if (selectedBodyParts.length === 0) { setError('Select at least one body part.'); return }
    setError(null)
    onNext()
  }

  return (
    <div className="px-4 pt-6">
      <button onClick={onBack} className="text-blue-600 text-sm font-medium mb-4 flex items-center gap-1">
        ← Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-5">Name your workout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Workout name</label>
        <input
          type="text"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          placeholder="e.g. Push Day, Leg Day..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Body parts <span className="text-gray-400 font-normal">(select all that apply)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {BODY_PARTS.map((bp) => {
            const active = selectedBodyParts.includes(bp)
            return (
              <button
                key={bp}
                onClick={() => toggleBodyPart(bp)}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${
                  active
                    ? `${BODY_PART_COLORS[bp].selected} border-current`
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {bp}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleNext}
        className="w-full bg-blue-600 text-white font-semibold rounded-xl py-3.5 text-sm hover:bg-blue-700 transition-colors"
      >
        Next → Pick exercises
      </button>
    </div>
  )
}

// ─── Step 3: Exercise Picker ──────────────────────────────────────────────────

function Step3({
  workoutName,
  exercises,
  selectedIds,
  setSelectedIds,
  showAllBodyParts,
  selectedBodyParts,
  saving,
  error,
  onBack,
  onStart,
}: {
  workoutName: string
  exercises: Exercise[]
  selectedIds: Set<string>
  setSelectedIds: (s: Set<string>) => void
  showAllBodyParts: boolean
  selectedBodyParts: BodyPart[]
  saving: boolean
  error: string | null
  onBack: () => void
  onStart: () => void
}) {
  function toggleExercise(id: string) {
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedIds(next)
  }

  const bodyPartsToShow = showAllBodyParts ? BODY_PARTS : selectedBodyParts

  return (
    <div className="px-4 pt-6 pb-32">
      <button onClick={onBack} className="text-blue-600 text-sm font-medium mb-4 flex items-center gap-1">
        ← Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pick exercises</h1>
      <p className="text-sm text-gray-400 mb-5">{workoutName}</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {bodyPartsToShow.map((bp) => {
          const group = exercises.filter((e) => e.body_part === bp)
          if (group.length === 0) return null
          return (
            <div key={bp}>
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${BODY_PART_COLORS[bp].pill}`}>
                {bp}
              </span>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {group.map((exercise) => {
                  const selected = selectedIds.has(exercise.id)
                  return (
                    <button
                      key={exercise.id}
                      onClick={() => toggleExercise(exercise.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${
                        selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
                        {exercise.name}
                      </span>
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {exercises.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-gray-500 text-sm">No exercises in your reserve for these body parts.</p>
          <p className="text-gray-400 text-xs mt-1">Add some in the Reserve tab first.</p>
        </div>
      )}

      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-3 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <span className="flex-1 text-sm font-medium text-gray-600">
            {selectedIds.size === 0
              ? 'No exercises selected'
              : `${selectedIds.size} exercise${selectedIds.size !== 1 ? 's' : ''} selected`}
          </span>
          <button
            onClick={onStart}
            disabled={saving || selectedIds.size === 0}
            className="bg-green-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Starting...' : 'Start Workout'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({
  value,
  onChange,
  step = 1,
}: {
  value: string
  onChange: (v: string) => void
  step?: number
}) {
  const num = value === '' ? 0 : parseFloat(value) || 0

  function decrement() {
    const next = Math.round((num - step) * 100) / 100
    if (next >= 0) onChange(String(next))
  }

  function increment() {
    onChange(String(Math.round((num + step) * 100) / 100))
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Allow free typing — commit validation on blur
    onChange(e.target.value)
  }

  function handleBlur() {
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed < 0) {
      onChange('0')
    } else {
      // Normalise (e.g. strip leading zeros)
      onChange(String(Math.round(parsed * 100) / 100))
    }
  }

  return (
    <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden h-14">
      <button
        type="button"
        onClick={decrement}
        className="w-14 h-full flex items-center justify-center text-3xl font-light text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors select-none"
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="flex-1 h-full bg-transparent text-center text-lg font-bold text-gray-900 tabular-nums focus:outline-none min-w-0"
      />
      <button
        type="button"
        onClick={increment}
        className="w-14 h-full flex items-center justify-center text-3xl font-light text-gray-500 hover:bg-gray-200 active:bg-gray-300 transition-colors select-none"
      >
        +
      </button>
    </div>
  )
}

// ─── Step 4: Active Workout ───────────────────────────────────────────────────

function Step4({
  workoutName,
  exercises,
  sets,
  onSetsChange,
  finishing,
  error,
  onFinish,
}: {
  workoutName: string
  exercises: ActiveExercise[]
  sets: Record<string, SetEntry[]>
  onSetsChange: (weId: string, sets: SetEntry[]) => void
  finishing: boolean
  error: string | null
  onFinish: () => void
}) {
  function addSet(weId: string) {
    const current = sets[weId] ?? []
    const prev = current[current.length - 1]
    const newSet = prev ? { reps: prev.reps, weight: prev.weight } : { reps: '0', weight: '0' }
    onSetsChange(weId, [...current, newSet])
  }

  function removeSet(weId: string, idx: number) {
    const updated = (sets[weId] ?? []).filter((_, i) => i !== idx)
    onSetsChange(weId, updated.length > 0 ? updated : [{ reps: '0', weight: '0' }])
  }

  function updateSet(weId: string, idx: number, field: 'reps' | 'weight', value: string) {
    const updated = (sets[weId] ?? []).map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    )
    onSetsChange(weId, updated)
  }

  return (
    <div className="px-4 pt-6 pb-32">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Active</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{workoutName}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {exercises.map((ex) => {
          const exSets = sets[ex.workoutExerciseId] ?? [{ reps: '', weight: '' }]
          return (
            <div key={ex.workoutExerciseId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{ex.exerciseName}</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${BODY_PART_COLORS[ex.bodyPart].pill}`}>
                  {ex.bodyPart}
                </span>
              </div>

              <div className="px-4 pt-3 pb-3 space-y-3">
                {exSets.map((s, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Set {idx + 1}</span>
                      <button
                        onClick={() => removeSet(ex.workoutExerciseId, idx)}
                        className="text-gray-300 hover:text-red-400 transition-colors text-xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-400 text-center mb-1.5">Reps</p>
                        <Stepper
                          value={s.reps}
                          onChange={(v) => updateSet(ex.workoutExerciseId, idx, 'reps', v)}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 text-center mb-1.5">Weight (kg)</p>
                        <Stepper
                          value={s.weight}
                          onChange={(v) => updateSet(ex.workoutExerciseId, idx, 'weight', v)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addSet(ex.workoutExerciseId)}
                  className="w-full text-blue-600 text-sm font-semibold py-2 hover:text-blue-700 transition-colors border border-blue-200 rounded-xl hover:bg-blue-50"
                >
                  + Add set
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-16 left-0 right-0 px-4 pb-3 pt-3 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-lg mx-auto">
          <button
            onClick={onFinish}
            disabled={finishing}
            className="w-full bg-green-600 text-white font-semibold rounded-xl py-3.5 text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {finishing ? 'Saving...' : 'Finish Workout'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

function NewWorkoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const repeatId = searchParams.get('repeat')
  const { session, startSession, updateSets, clearSession } = useWorkoutSession()

  // If there's already an active session, jump straight to step 4
  const [step, setStep] = useState<1 | 2 | 3 | 4>(() => (session ? 4 : 1))
  const [workoutName, setWorkoutName] = useState('')
  const [selectedBodyParts, setSelectedBodyParts] = useState<BodyPart[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAllBodyParts, setShowAllBodyParts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [initialising, setInitialising] = useState(!!repeatId)
  const [finishing, setFinishing] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)

  const supabase = createClient()

  // If the session appears after mount (shouldn't normally happen, but safety)
  useEffect(() => {
    if (session && step !== 4) setStep(4)
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps

  // If ?repeat=id is in the URL, auto-load that workout and jump to step 3
  useEffect(() => {
    if (!repeatId) return
    async function loadRepeat() {
      const { data: workout } = await supabase
        .from('workouts')
        .select('*, workout_exercises(*, exercise:exercises(*))')
        .eq('id', repeatId)
        .single()

      if (workout) {
        const w = workout as WorkoutWithDetails
        setWorkoutName(w.name)
        const ids = new Set(w.workout_exercises.map((we) => we.exercise_id))
        setSelectedIds(ids)
        setShowAllBodyParts(true)

        const { data: exercises } = await supabase
          .from('exercises')
          .select('*')
          .order('name')
        setAllExercises(exercises ?? [])
        setStep(3)
      }
      setInitialising(false)
    }
    loadRepeat()
  }, [repeatId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNew() {
    setWorkoutName('')
    setSelectedBodyParts([])
    setShowAllBodyParts(false)
    setSelectedIds(new Set())
    setStep(2)
  }

  async function handleRepeat(workout: WorkoutWithDetails) {
    setWorkoutName(workout.name)
    const ids = new Set(workout.workout_exercises.map((we) => we.exercise_id))
    setSelectedIds(ids)
    setShowAllBodyParts(true)

    const { data: exercises } = await supabase
      .from('exercises')
      .select('*')
      .order('name')
    setAllExercises(exercises ?? [])
    setStep(3)
  }

  async function handleStep2Next() {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .in('body_part', selectedBodyParts)
      .order('name')
    setAllExercises(data ?? [])
    if (!workoutName.trim()) {
      const autoName = BODY_PARTS.filter((bp) => selectedBodyParts.includes(bp)).join(', ')
      setWorkoutName(autoName)
    }
    setStep(3)
  }

  // "Start Workout" — create the DB record and start the session
  async function handleStart() {
    if (selectedIds.size === 0) {
      setSaveError('Select at least one exercise.')
      return
    }
    setSaving(true)
    setSaveError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaveError('Not logged in.'); setSaving(false); return }

    const { data: workout, error: wErr } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, name: workoutName || 'Workout' })
      .select()
      .single()

    if (wErr || !workout) {
      setSaveError(wErr?.message ?? 'Failed to create workout.')
      setSaving(false)
      return
    }

    const inserts = Array.from(selectedIds).map((exercise_id) => ({
      workout_id: workout.id,
      exercise_id,
    }))
    const { data: weData } = await supabase
      .from('workout_exercises')
      .insert(inserts)
      .select('*, exercise:exercises(*)')

    const exercises: ActiveExercise[] = (weData ?? []).map((we: any) => ({
      workoutExerciseId: we.id,
      exerciseName: we.exercise?.name ?? '',
      bodyPart: we.exercise?.body_part as BodyPart,
    }))

    const initialSets: Record<string, SetEntry[]> = {}
    exercises.forEach((ex) => { initialSets[ex.workoutExerciseId] = [{ reps: '0', weight: '0' }] })

    startSession({
      workoutId: workout.id,
      workoutName: workoutName || 'Workout',
      exercises,
      sets: initialSets,
    })

    setSaving(false)
    setStep(4)
  }

  // "Finish Workout" — save sets + mark complete + clear session
  async function handleFinish() {
    if (!session) return
    setFinishing(true)
    setFinishError(null)

    const setInserts: object[] = []
    for (const [weId, setList] of Object.entries(session.sets)) {
      setList.forEach((s, idx) => {
        if (s.reps || s.weight) {
          setInserts.push({
            workout_exercise_id: weId,
            set_number: idx + 1,
            reps: s.reps ? parseInt(s.reps) : null,
            weight: s.weight ? parseFloat(s.weight) : null,
          })
        }
      })
    }

    if (setInserts.length > 0) {
      await supabase.from('sets').insert(setInserts)
    }

    await supabase
      .from('workouts')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', session.workoutId)

    clearSession()
    router.push('/history')
  }

  if (initialising) {
    return (
      <div className="flex items-center justify-center pt-24">
        <p className="text-gray-400 text-sm">Loading workout...</p>
      </div>
    )
  }

  if (step === 1) return <Step1 onNew={handleNew} onRepeat={handleRepeat} />

  if (step === 2) {
    return (
      <Step2
        workoutName={workoutName}
        setWorkoutName={setWorkoutName}
        selectedBodyParts={selectedBodyParts}
        setSelectedBodyParts={setSelectedBodyParts}
        onBack={() => setStep(1)}
        onNext={handleStep2Next}
      />
    )
  }

  if (step === 3) {
    return (
      <Step3
        workoutName={workoutName}
        exercises={allExercises}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        showAllBodyParts={showAllBodyParts}
        selectedBodyParts={selectedBodyParts}
        saving={saving}
        error={saveError}
        onBack={() => setStep(showAllBodyParts ? 1 : 2)}
        onStart={handleStart}
      />
    )
  }

  // Step 4 — read exercises + sets from context
  return (
    <Step4
      workoutName={session?.workoutName ?? workoutName}
      exercises={session?.exercises ?? []}
      sets={session?.sets ?? {}}
      onSetsChange={updateSets}
      finishing={finishing}
      error={finishError}
      onFinish={handleFinish}
    />
  )
}

export default function NewWorkoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center pt-24">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    }>
      <NewWorkoutContent />
    </Suspense>
  )
}
