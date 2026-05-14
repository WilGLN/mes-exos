import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null)
      setUser(null)
      setLoading(false)
      return
    }

    let cancelled = false

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (cancelled) return
        setSession(s)
        setUser(s?.user ?? null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase non configuré (.env.local)') }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase non configuré (.env.local)') }
    }
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error ? new Error(error.message) : null }
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, loading, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
