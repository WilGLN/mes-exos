export type SpinButtonProps = {
  value: number
  min: number
  max: number
  step?: number
  onChange: (n: number) => void
  /** Affiché à droite (ex. s, min) */
  suffix?: string
  ariaLabel: string
}

export function SpinButton({ value, min, max, step = 1, onChange, suffix, ariaLabel }: SpinButtonProps) {
  const dec = () => onChange(Math.max(min, value - step))
  const inc = () => onChange(Math.min(max, value + step))
  return (
    <div className="timer-spin" aria-label={ariaLabel}>
      <button type="button" className="timer-spin-btn" onClick={dec} aria-label={`Diminuer ${ariaLabel}`}>
        −
      </button>
      <span className="timer-spin-val mono">
        {value}
        {suffix ? <span className="timer-spin-suf"> {suffix}</span> : null}
      </span>
      <button type="button" className="timer-spin-btn" onClick={inc} aria-label={`Augmenter ${ariaLabel}`}>
        +
      </button>
    </div>
  )
}
