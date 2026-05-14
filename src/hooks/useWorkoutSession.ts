import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SetEntry, WorkoutSessionExercise, WorkoutSessionState } from '../types/training'
import {
  getLastPerformance,
  getWorkoutExercisesWithDetails,
  getWorkoutSetEntries,
  insertWorkoutSet,
} from '../lib/workoutSession'

export function useWorkoutSession(workoutId: string | null, defaultRest: number) {
  const [state, setState] = useState<WorkoutSessionState>('loading')
  const [exercises, setExercises] = useState<WorkoutSessionExercise[]>([])
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [setNumber, setSetNumber] = useState(1)
  const [side, setSide] = useState<'droite' | 'gauche' | undefined>(undefined)
  const [entries, setEntries] = useState<Record<string, SetEntry[]>>({})
  const [lastPerf, setLastPerf] = useState<SetEntry[]>([])
  const [timerSeconds, setTimerSeconds] = useState(defaultRest)
  const [isInterExercise, setIsInterExercise] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentExercise = exercises[exerciseIndex]
  const totalSets = Math.max(1, currentExercise?.series ?? 1)
  const completedSets = entries[currentExercise?.workout_exercise_id ?? ''] ?? []
  const isUnilateral = currentExercise?.unilateral === true

  useEffect(() => {
    if (!workoutId) {
      setState('loading')
      return
    }
    let cancelled = false
    setState('loading')
    void getWorkoutExercisesWithDetails(workoutId)
      .then(async (data) => {
        if (cancelled) return
        setExercises(data)
        const byEx: Record<string, SetEntry[]> = {}
        for (const ex of data) {
          byEx[ex.workout_exercise_id] = await getWorkoutSetEntries(ex.workout_exercise_id)
        }
        if (cancelled) return
        setEntries(byEx)
        setState(data.length ? 'set_in_progress' : 'complete')
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur chargement séance')
          setState('ready')
        }
      })
    return () => {
      cancelled = true
    }
  }, [workoutId])

  useEffect(() => {
    if (!currentExercise) return
    void getLastPerformance(currentExercise.exercise_code).then(setLastPerf).catch(() => setLastPerf([]))
  }, [currentExercise?.exercise_code])

  const maxProgress = useMemo(() => {
    if (!currentExercise) return totalSets
    if (!isUnilateral) return totalSets
    return totalSets * 2
  }, [currentExercise, isUnilateral, totalSets])

  const visualSetNumber = useMemo(() => {
    if (!isUnilateral) return setNumber
    if (!side) return setNumber
    return side === 'droite' ? setNumber : totalSets + setNumber
  }, [isUnilateral, side, setNumber, totalSets])

  const advanceAfterSet = useCallback(
    (restUsed: number) => {
      if (!currentExercise) return
      const nextSet = setNumber + 1
      if (isUnilateral && !side) {
        setSide('droite')
        setState('set_in_progress')
        return
      }

      if (isUnilateral) {
        if (currentExercise.side_mode === 'alterne') {
          if (side === 'droite') {
            setSide('gauche')
            setState('resting')
            setTimerSeconds(restUsed)
            setIsInterExercise(false)
            return
          }
          if (nextSet <= totalSets) {
            setSetNumber(nextSet)
            setSide('droite')
            setState('resting')
            setTimerSeconds(restUsed)
            setIsInterExercise(false)
            return
          }
        } else {
          if (side === 'droite' && nextSet <= totalSets) {
            setSetNumber(nextSet)
            setState('resting')
            setTimerSeconds(restUsed)
            setIsInterExercise(false)
            return
          }
          if (side === 'droite' && nextSet > totalSets) {
            setSetNumber(1)
            setSide('gauche')
            setState('resting')
            setTimerSeconds(restUsed)
            setIsInterExercise(false)
            return
          }
          if (side === 'gauche' && nextSet <= totalSets) {
            setSetNumber(nextSet)
            setState('resting')
            setTimerSeconds(restUsed)
            setIsInterExercise(false)
            return
          }
        }
      } else if (nextSet <= totalSets) {
        setSetNumber(nextSet)
        setState('resting')
        setTimerSeconds(restUsed)
        setIsInterExercise(false)
        return
      }

      if (exerciseIndex + 1 < exercises.length) {
        setState('exercise_transition')
        setTimerSeconds(currentExercise.rest_after_exercise_seconds || restUsed)
        setIsInterExercise(true)
      } else {
        setState('complete')
      }
    },
    [currentExercise, setNumber, isUnilateral, side, totalSets, exerciseIndex, exercises.length],
  )

  const validateSet = useCallback(
    async (reps: number, restUsed: number, completed = true) => {
      if (!currentExercise) return
      const key = currentExercise.workout_exercise_id
      const idxForDb = visualSetNumber
      await insertWorkoutSet({
        workout_exercise_id: key,
        set_number: idxForDb,
        reps,
        rest_seconds: restUsed,
        completed,
        side,
        exercise_code: currentExercise.exercise_code,
      })
      setEntries((prev) => {
        const cur = prev[key] ?? []
        const next = [...cur.filter((x) => x.set_number !== idxForDb), { set_number: idxForDb, reps, completed, side }]
        next.sort((a, b) => a.set_number - b.set_number)
        return { ...prev, [key]: next }
      })
      advanceAfterSet(restUsed)
    },
    [currentExercise, visualSetNumber, side, advanceAfterSet],
  )

  const skipSet = useCallback(
    async (restUsed: number) => {
      await validateSet(0, restUsed, false)
    },
    [validateSet],
  )

  const nextExercise = useCallback(() => {
    if (exerciseIndex + 1 >= exercises.length) {
      setState('complete')
      return
    }
    const nextIdx = exerciseIndex + 1
    const nextEx = exercises[nextIdx]
    setExerciseIndex(nextIdx)
    setSetNumber(1)
    setSide(nextEx?.unilateral ? 'droite' : undefined)
    setState('set_in_progress')
    setIsInterExercise(false)
  }, [exerciseIndex, exercises])

  const previousExercise = useCallback(() => {
    if (exerciseIndex <= 0) return
    setExerciseIndex((i) => i - 1)
    setSetNumber(1)
    setSide(undefined)
    setState('set_in_progress')
  }, [exerciseIndex])

  const startTimer = useCallback((seconds: number, interExercise = false) => {
    setTimerSeconds(seconds)
    setIsInterExercise(interExercise)
    setState('resting')
  }, [])

  const skipRest = useCallback(() => {
    if (isInterExercise) {
      nextExercise()
      return
    }
    setState('set_in_progress')
  }, [isInterExercise, nextExercise])

  return {
    state,
    error,
    exercises,
    exerciseIndex,
    currentExercise,
    currentSet: setNumber,
    currentSide: side,
    totalSets,
    maxProgress,
    visualSetNumber,
    completedSets,
    lastPerformance: lastPerf,
    timerSeconds,
    isInterExercise,
    setState,
    validateSet,
    skipSet,
    nextExercise,
    previousExercise,
    startTimer,
    skipRest,
  }
}
