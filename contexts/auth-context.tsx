'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  fullName: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  function safeJson(res: Response) {
    const text = res.clone().text()
    return text.then((t: string) => {
      try { return JSON.parse(t) } catch { return null }
    })
  }

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await safeJson(res)
        if (data?.user) setUser(data.user)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Login failed. Please try again.')
    if (!data?.user) throw new Error('Invalid response from server.')
    setUser(data.user)
    router.push('/dashboard')
  }

  const register = async (fullName: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password }),
    })
    const data = await safeJson(res)
    if (!res.ok) throw new Error(data?.error || 'Registration failed. Please try again.')
    if (!data?.user) throw new Error('Invalid response from server.')
    setUser(data.user)
    router.push('/dashboard')
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
