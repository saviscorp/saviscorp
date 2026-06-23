'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppRole = 'provider' | 'requestor'

interface AuthContextValue {
  currentUser: User | null
  role: AppRole | null
  activeMode: AppRole
  loading: boolean
  switchMode: (newMode: AppRole) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  role: null,
  activeMode: 'requestor',
  loading: true,
  switchMode: () => {},
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [role, setRole] = useState<AppRole | null>(null)
  const [activeMode, setActiveMode] = useState<AppRole>('requestor')
  const [loading, setLoading] = useState(true)

  // Hydrate activeMode from localStorage (runs once on mount)
  useEffect(() => {
    const stored = localStorage.getItem('savis_active_mode')
    if (stored === 'provider' || stored === 'requestor') {
      setActiveMode(stored)
    }
  }, [])

  // Listen to Firebase auth state + load role from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid))
          if (snap.exists()) {
            const data = snap.data()
            // Support both the new `role` field and the legacy `activeRole` field
            const rawRole = data.role ?? (data.activeRole === 'provider' ? 'provider' : 'requestor')
            const userRole: AppRole = rawRole === 'provider' ? 'provider' : 'requestor'
            setRole(userRole)
            // Only set activeMode from Firestore if nothing is in localStorage yet
            const stored = localStorage.getItem('savis_active_mode')
            if (!stored) {
              setActiveMode(userRole)
              localStorage.setItem('savis_active_mode', userRole)
            }
          }
        } catch {
          // Firestore fetch failed; role stays null — acceptable degraded state
        }
      } else {
        setRole(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const switchMode = useCallback((newMode: AppRole) => {
    setActiveMode(newMode)
    localStorage.setItem('savis_active_mode', newMode)
    router.push(`/switching?to=${newMode}`)
  }, [router])

  return (
    <AuthContext.Provider value={{ currentUser, role, activeMode, loading, switchMode }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuthContext() {
  return useContext(AuthContext)
}
