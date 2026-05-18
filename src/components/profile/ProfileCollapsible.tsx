import type { ReactNode } from 'react'

type ProfileCollapsibleProps = {
  id: string
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}

/** Panneau profil repliable (fermé par défaut côté parent). */
export function ProfileCollapsible({ id, title, open, onToggle, children }: ProfileCollapsibleProps) {
  const panelId = `${id}-panel`
  return (
    <div className={`profile-collapse${open ? ' open' : ''}`}>
      <button
        type="button"
        className="profile-collapse-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="profile-collapse-title">{title}</span>
        <span className="profile-collapse-chevron" aria-hidden />
      </button>
      <div id={panelId} className="profile-collapse-panel" hidden={!open} aria-hidden={!open}>
        <div className="profile-collapse-inner">{children}</div>
      </div>
    </div>
  )
}
