import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const urlRaw = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/**
 * L’URL projet doit être l’origine seule (ex. https://xxxx.supabase.co), sans /rest/v1 ni slash final.
 * Sinon les requêtes auth deviennent du type .../rest/v1/auth/v1/... → « Invalid path specified in request URL ».
 */
function supabaseOriginFromInput(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(withProto)
  } catch {
    return ''
  }
  const host = parsed.hostname.toLowerCase()
  if (['supabase.com', 'www.supabase.com', 'app.supabase.com'].includes(host)) {
    return ''
  }
  return `${parsed.protocol}//${parsed.host}`
}

const url = supabaseOriginFromInput(urlRaw)

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Ce que le dernier `vite build` a embarqué (pas de valeurs affichées). */
export const supabaseBuildEnvFlags = {
  hasUrl: Boolean(urlRaw.length > 0),
  hasAnonKey: Boolean(anonKey.length > 0),
  /** Origine dérivée utilisable par le client (hors dashboard supabase.com, etc.). */
  hasRecognizedOrigin: Boolean(url),
} as const

/** Placeholders : createClient refuse une URL vide (erreur au chargement du bundle). */
const clientUrl = url.length > 0 ? url : 'https://missing-env-vars.supabase.co'
const clientKey = anonKey.length > 0 ? anonKey : 'missing-anon-key'

/** Client unique : jamais de clé service_role côté navigateur. */
export const supabase: SupabaseClient = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
