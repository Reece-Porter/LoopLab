import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null) // { role, can_download } for the signed-in user
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    // Load the existing session on mount, then subscribe to changes.
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Fetch the user's own profile row (role + download flag). RLS allows a user
  // to read only their own row, so this is safe. NOTE: this is used for
  // cosmetic gating in the UI only — real enforcement is the RLS policies and
  // the server-side check.
  useEffect(() => {
    if (!supabase || !user) { setProfile(null); setProfileLoading(false); return }
    let active = true
    setProfileLoading(true)
    supabase.from('profiles').select('role, can_download').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (active) { setProfile(data || null); setProfileLoading(false) } })
      .catch(() => { if (active) { setProfile(null); setProfileLoading(false) } })
    return () => { active = false }
  }, [user])

  const signUp = useCallback(async (email, password, displayName) => {
    if (!supabase) throw new Error('Backend not configured')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split('@')[0] } },
    })
    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Backend not configured')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw new Error('Backend not configured')
    // Send users back to the app after the Google round-trip.
    const redirectTo = window.location.origin + import.meta.env.BASE_URL
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }, [])

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Producer'

  const isAdmin = profile?.role === 'admin'
  const canDownload = isAdmin || profile?.can_download === true

  return (
    <AuthContext.Provider
      value={{ user, loading, profileLoading, displayName, isAdmin, canDownload, configured: isSupabaseConfigured, signUp, signIn, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
