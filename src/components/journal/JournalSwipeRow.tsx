import { useEffect, useRef, type Dispatch, type ReactNode, type SetStateAction } from 'react'

const ACTION_W = 76

export type JournalSwipeRowProps = {
  rowId: string
  /** L’id de la ligne actuellement ouverte (révèle la poubelle), ou null. */
  openRowId: string | null
  setOpenRowId: Dispatch<SetStateAction<string | null>>
  onDelete: () => Promise<{ error: Error | null }>
  children: ReactNode
  /** Texte du `window.confirm` avant suppression. */
  deleteConfirmMessage?: string
  /** Libellé accessible du bouton poubelle. */
  deleteAriaLabel?: string
}

/**
 * Glisser vers la gauche pour révéler la suppression (mobile).
 * Un seul panneau ouvert à la fois via openRowId.
 */
export function JournalSwipeRow({
  rowId,
  openRowId,
  setOpenRowId,
  onDelete,
  children,
  deleteConfirmMessage = 'Supprimer cette entrée du journal ?',
  deleteAriaLabel = 'Supprimer l’entrée',
}: JournalSwipeRowProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const txRef = useRef(0)
  const liveTxRef = useRef(0)
  const startRef = useRef({ x: 0, y: 0, tx: 0 })
  const axisRef = useRef<'h' | 'v' | null>(null)

  const rowIdRef = useRef(rowId)
  const setOpenRowIdRef = useRef(setOpenRowId)
  rowIdRef.current = rowId
  setOpenRowIdRef.current = setOpenRowId

  const applyTx = (v: number) => {
    const clamped = Math.min(0, Math.max(-ACTION_W, v))
    txRef.current = clamped
    liveTxRef.current = clamped
    const el = panelRef.current
    if (el) el.style.transform = `translate3d(${clamped}px,0,0)`
  }

  useEffect(() => {
    if (openRowId === rowId) {
      if (txRef.current !== -ACTION_W) applyTx(-ACTION_W)
    } else if (txRef.current !== 0) {
      applyTx(0)
    }
  }, [openRowId, rowId])

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      startRef.current = { x: t.clientX, y: t.clientY, tx: txRef.current }
      axisRef.current = null
    }

    const onMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      const dx = t.clientX - startRef.current.x
      const dy = t.clientY - startRef.current.y
      if (axisRef.current === null) {
        if (Math.hypot(dx, dy) < 12) return
        axisRef.current = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v'
      }
      if (axisRef.current === 'v') return
      e.preventDefault()
      const next = Math.min(0, Math.max(-ACTION_W, startRef.current.tx + dx))
      applyTx(next)
    }

    const onEnd = () => {
      const ax = axisRef.current
      axisRef.current = null
      if (ax === 'v') {
        if (Math.abs(liveTxRef.current) > 2) applyTx(0)
        return
      }
      if (ax === 'h') {
        const cur = liveTxRef.current
        const open = cur <= -ACTION_W / 2
        if (open) {
          applyTx(-ACTION_W)
          setOpenRowIdRef.current(rowIdRef.current)
        } else {
          applyTx(0)
          setOpenRowIdRef.current((prev) => (prev === rowIdRef.current ? null : prev))
        }
      }
    }

    panel.addEventListener('touchstart', onStart, { passive: true })
    panel.addEventListener('touchmove', onMove, { passive: false })
    panel.addEventListener('touchend', onEnd)
    panel.addEventListener('touchcancel', onEnd)
    return () => {
      panel.removeEventListener('touchstart', onStart)
      panel.removeEventListener('touchmove', onMove)
      panel.removeEventListener('touchend', onEnd)
      panel.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  async function handleDelete() {
    if (!window.confirm(deleteConfirmMessage)) return
    const { error } = await onDelete()
    if (error) {
      window.alert(error.message)
      return
    }
    setOpenRowId(null)
    applyTx(0)
  }

  return (
    <div className="journal-swipe-wrap">
      <div className="journal-swipe-actions">
        <button type="button" className="journal-swipe-delete" aria-label={deleteAriaLabel} onClick={() => void handleDelete()}>
          🗑
        </button>
      </div>
      <div ref={panelRef} className="journal-swipe-panel">
        <div className="journal-swipe-panel-inner">{children}</div>
      </div>
    </div>
  )
}
