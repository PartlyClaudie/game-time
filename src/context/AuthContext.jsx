import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/

function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@players.game-hub.local`
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const requestedUserIdRef = useRef(null) // guards against out-of-order fetches

  const loadProfile = useCallback(async (userId) => {
    requestedUserIdRef.current = userId
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    // If the user has since changed again, this response is stale — ignore it
    if (requestedUserIdRef.current !== userId) return
    if (!error) setProfile(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        requestedUserIdRef.current = null
      }
      setLoading(false)
    })

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        requestedUserIdRef.current = null
        setProfile(null)
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [loadProfile])

  const signUp = useCallback(
    async (username, password) => {
      const trimmed = username.trim()
      if (!USERNAME_PATTERN.test(trimmed)) {
        return { error: 'Username must be 3-20 characters: letters, numbers, or underscores only.' }
      }
      if (password.length < 6) {
        return { error: 'Password must be at least 6 characters.' }
      }

      const email = usernameToEmail(trimmed)
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          return { error: 'That username is taken.' }
        }
        return { error: error.message }
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: trimmed,
        })
        if (profileError) {
          return { error: 'Account created, but that username may already be in use.' }
        }
        await loadProfile(data.user.id)
      }

      return { error: null }
    },
    [loadProfile],
  )

  const signIn = useCallback(async (username, password) => {
    const email = usernameToEmail(username)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { error: 'Incorrect username or password.' }
    }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}