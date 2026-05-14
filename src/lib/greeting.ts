import type { User } from '@supabase/supabase-js'

export function firstNameFromUser(user: User | null): string {
  if (!user) return 'Athlète'
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const full = meta?.full_name
  if (typeof full === 'string' && full.trim()) return full.trim().split(/\s+/)[0] ?? 'Athlète'
  const name = meta?.name
  if (typeof name === 'string' && name.trim()) return name.trim().split(/\s+/)[0] ?? 'Athlète'
  const em = user.email ?? ''
  const local = em.split('@')[0]
  if (local) return local.charAt(0).toUpperCase() + local.slice(1)
  return 'Athlète'
}
