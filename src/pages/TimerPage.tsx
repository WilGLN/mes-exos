import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IntervalBuilder } from '../components/timer/IntervalBuilder'
import { IntervalPlayer } from '../components/timer/IntervalPlayer'
import { SimpleTimer } from '../components/timer/SimpleTimer'
import { TimerTabs, type TimerTabId } from '../components/timer/TimerTabs'
import { WorkoutEditor } from '../components/timer/WorkoutEditor'
import { WorkoutList } from '../components/timer/WorkoutList'
import { useTimerWorkouts } from '../hooks/useTimerWorkouts'
import { fetchProfileWithPreferences, type TimerPreferences } from '../lib/catalog'
import { supabase } from '../lib/supabase'
import type { BuiltPhase } from '../types/timer'
import type { TimerWorkout } from '../types/timer'

function readRingFlash(): boolean {
  try {
    const v = localStorage.getItem('lafay_timer_ring_flash')
    if (v === null) return true
    return v === '1'
  } catch {
    return true
  }
}

export function TimerPage() {
  const [tab, setTab] = useState<TimerTabId>('simple')
  const [prefs, setPrefs] = useState<TimerPreferences | null>(null)
  const [playerPhases, setPlayerPhases] = useState<BuiltPhase[] | null>(null)
  const [playerKey, setPlayerKey] = useState(0)
  const [editor, setEditor] = useState<TimerWorkout | 'new' | null>(null)

  const { list, save, remove } = useTimerWorkouts()

  useEffect(() => {
    let cancelled = false
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return
      void fetchProfileWithPreferences(user.id).then(({ data }) => {
        if (cancelled || !data) return
        setPrefs((data.preferences as TimerPreferences) ?? {})
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const sonOn = prefs?.son_fin !== false
  const vibrationOn = prefs?.vibration !== false

  const flashOn = useMemo(() => readRingFlash(), [tab, playerPhases])

  function openPlayer(ph: BuiltPhase[]) {
    if (!ph.length) return
    setPlayerPhases(ph)
    setPlayerKey((k) => k + 1)
  }

  function closePlayer() {
    setPlayerPhases(null)
  }

  return (
    <div className="page-pad page-timer page-timer-v2">
      <Link className="t-back" to="/">
        <span aria-hidden>←</span>
        <span>Accueil</span>
      </Link>

      <TimerTabs value={tab} onChange={setTab} />

      <div className="page-timer-panel" role="tabpanel">
        {tab === 'simple' ? <SimpleTimer /> : null}
        {tab === 'intervals' ? <IntervalBuilder onLaunch={openPlayer} /> : null}
        {tab === 'workouts' ? (
          <WorkoutList
            workouts={list}
            onRemove={remove}
            onLaunch={openPlayer}
            onEdit={(w) => setEditor(w)}
            onNew={() => setEditor('new')}
          />
        ) : null}
      </div>

      {playerPhases ? (
        <IntervalPlayer
          key={playerKey}
          phases={playerPhases}
          onClose={closePlayer}
          sonEnabled={sonOn}
          vibrationEnabled={vibrationOn}
          flashEnabled={flashOn}
        />
      ) : null}

      {editor !== null ? (
        <WorkoutEditor
          initial={editor === 'new' ? null : editor}
          onClose={() => setEditor(null)}
          onSave={(w) => {
            save(w)
          }}
        />
      ) : null}
    </div>
  )
}
