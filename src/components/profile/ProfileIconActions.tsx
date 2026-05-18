type ProfileIconActionsProps = {
  onSave?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onCancel?: () => void
  saveDisabled?: boolean
  busy?: boolean
  saveLabel?: string
}

/** Barre d’actions profil (icônes, zone tactile ≥ 44px). */
export function ProfileIconActions({
  onSave,
  onEdit,
  onDelete,
  onCancel,
  saveDisabled,
  busy,
  saveLabel = 'Enregistrer',
}: ProfileIconActionsProps) {
  return (
    <div className="profile-icon-actions" role="group" aria-label="Actions">
      {onSave ? (
        <button
          type="button"
          className="btn-icon profile-icon-save"
          aria-label={saveLabel}
          title={saveLabel}
          disabled={busy || saveDisabled}
          onClick={onSave}
        >
          💾
        </button>
      ) : null}
      {onEdit ? (
        <button type="button" className="btn-icon sm" aria-label="Modifier" title="Modifier" disabled={busy} onClick={onEdit}>
          ✏️
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          className="btn-icon sm profile-icon-delete"
          aria-label="Supprimer"
          title="Supprimer"
          disabled={busy}
          onClick={onDelete}
        >
          🗑
        </button>
      ) : null}
      {onCancel ? (
        <button type="button" className="btn-icon sm" aria-label="Annuler" title="Annuler" disabled={busy} onClick={onCancel}>
          ✕
        </button>
      ) : null}
    </div>
  )
}

