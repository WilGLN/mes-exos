export type TimerTabId = 'simple' | 'intervals' | 'workouts'

export type TimerTabsProps = {
  value: TimerTabId
  onChange: (id: TimerTabId) => void
}

const ITEMS: { id: TimerTabId; label: string }[] = [
  { id: 'simple', label: 'Simple' },
  { id: 'intervals', label: 'Intervalles' },
  { id: 'workouts', label: 'Mes séances' },
]

export function TimerTabs({ value, onChange }: TimerTabsProps) {
  return (
    <div className="timer-tabs" role="tablist" aria-label="Modes du chrono">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={value === it.id}
          className={`timer-tab${value === it.id ? ' timer-tab-on' : ''}`}
          onClick={() => onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
