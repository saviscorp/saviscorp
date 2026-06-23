'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { clearAuthCookies } from '@/lib/session'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAuthContext } from '@/context/AuthContext'

export default function UserAvatarMenu() {
  const router = useRouter()
  const { user } = useAuth()
  const { activeMode, switchMode } = useAuthContext()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  const photoURL = user?.photoURL ?? null
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Account'
  const email = user?.email ?? ''
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  async function handleSignOut() {
    setOpen(false)
    await signOut(auth)
    clearAuthCookies()
    router.push('/')
  }

  function handleSwitchMode() {
    setOpen(false)
    switchMode(activeMode === 'provider' ? 'requestor' : 'provider')
  }

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      {/* Avatar button */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Account menu"
        aria-expanded={open}
        className="h-8 w-8 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
      >
        {photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoURL} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-brand-primary flex items-center justify-center">
            <span className="text-white text-[12px] font-bold leading-none">{initials}</span>
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-border rounded-xl shadow-md p-2 min-w-[220px]">
          {/* Header row with X button */}
          <div className="flex items-start justify-between px-3 py-2">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-primary truncate">{displayName}</p>
              <p className="text-[12px] text-secondary truncate">{email}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-gray transition-colors flex-shrink-0"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5 text-secondary">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          <div className="my-1 h-px bg-border" />

          {/* Mode badge */}
          <div className="px-3 py-1.5">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
              style={{ background: activeMode === 'provider' ? '#640D5F' : '#D91656' }}
            >
              {activeMode === 'provider' ? 'Provider mode' : 'Requestor mode'}
            </span>
          </div>

          <div className="my-1 h-px bg-border" />

          {/* Edit profile */}
          <button
            onClick={() => { setOpen(false); router.push('/profile') }}
            className="w-full text-left px-3 py-2 rounded-lg text-[14px] text-primary hover:bg-surface-gray transition-colors"
          >
            Edit profile
          </button>

          {/* Switch mode */}
          <button
            onClick={handleSwitchMode}
            className="w-full text-left px-3 py-2 rounded-lg text-[14px] text-primary hover:bg-surface-gray transition-colors"
          >
            Switch to {activeMode === 'provider' ? 'Requestor' : 'Provider'} mode
          </button>

          <div className="my-1 h-px bg-border" />

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 rounded-lg text-[14px] text-error hover:bg-surface-gray transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
