import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminLogin as apiAdminLogin, getMe, logout as apiLogout } from '@/api/admin'
import { getAccessToken, getStoredUser } from '@/api/client'
import type { AuthUser } from '@/types'

interface AuthContextValue {
  user: AuthUser | null
  status: 'loading' | 'authenticated' | 'anonymous'
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser<AuthUser>())
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'anonymous'>('loading')

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      if (!getAccessToken()) {
        if (!cancelled) setStatus('anonymous')
        return
      }
      try {
        const me = await getMe()
        if (cancelled) return
        if (me.role !== 'ADMIN') {
          // A non-admin token somehow ended up here — never trust it.
          await apiLogout()
          setUser(null)
          setStatus('anonymous')
          return
        }
        setUser(me)
        setStatus('authenticated')
      } catch {
        if (!cancelled) {
          setUser(null)
          setStatus('anonymous')
        }
      }
    }
    bootstrap()
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await apiAdminLogin(email, password)
    if (loggedInUser.role !== 'ADMIN') {
      await apiLogout()
      throw new Error('This account is not an admin account.')
    }
    setUser(loggedInUser)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
    setStatus('anonymous')
  }, [])

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
