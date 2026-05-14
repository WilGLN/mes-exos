import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && anonKey)

/** Ce que le dernier `vite build` a embarqué (pas de valeurs affichées). */
export const supabaseBuildEnvFlags = {
  hasUrl: Boolean(import.meta.env.VITE_SUPABASE_URL?.trim()),
  hasAnonKey: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()),
} as const

/** Placeholders : createClient refuse une URL vide (erreur au chargement du bundle). */
const clientUrl = url && url.length > 0 ? url : 'https://missing-env-vars.supabase.co'
const clientKey = anonKey && anonKey.length > 0 ? anonKey : 'missing-anon-key'

/** Client unique : jamais de clé service_role côté navigateur. */
export const supabase: SupabaseClient = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
