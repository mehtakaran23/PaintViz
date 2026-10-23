import { useEffect, useMemo, useState } from 'react'
import {
  getCurrentUser,
  loginUser,
  registerUser,
} from '../services/authService.js'
import { AuthContext } from './AuthContext.js'

const AUTH_STORAGE_KEY = 'paintviz.auth'

function readStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)
  const [isLoading, setIsLoading] = useState(() => Boolean(readStoredAuth()?.token))

  useEffect(() => {
    let isMounted = true
    const storedAuth = readStoredAuth()

    if (!storedAuth?.token) {
      return () => {
        isMounted = false
      }
    }

    getCurrentUser(storedAuth.token)
      .then(({ user }) => {
        if (!isMounted) return
        const refreshedAuth = { token: storedAuth.token, user }
        setAuth(refreshedAuth)
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(refreshedAuth))
      })
      .catch(() => {
        if (!isMounted) return
        localStorage.removeItem(AUTH_STORAGE_KEY)
        setAuth(null)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  function saveAuth(nextAuth) {
    setAuth(nextAuth)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth))
  }

  async function register(credentials) {
    const result = await registerUser(credentials)
    saveAuth({ token: result.token, user: result.user })
    return result
  }

  async function login(credentials) {
    const result = await loginUser(credentials)
    saveAuth({ token: result.token, user: result.user })
    return result
  }

  function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuth(null)
  }

  const value = useMemo(
    () => ({
      token: auth?.token || null,
      user: auth?.user || null,
      isAuthenticated: Boolean(auth?.token && auth?.user),
      isLoading,
      register,
      login,
      logout,
    }),
    [auth, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
