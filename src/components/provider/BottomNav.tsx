'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { auth } from '@/lib/firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  mode?: 'provider' | 'requestor'
}

// ─── Nav links ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Dashboard', href: '/provider/dashboard' },
  { label: 'Services',  href: '/provider/services' },
  { label: 'Bookings',  href: '/provider/bookings' },
  { label: 'Earnings',  href: '/provider/earnings' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return 'PR'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

// ─── Mini SVG icons ───────────────────────────────────────────────────────────

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[22px] h-[22px]">
      <path d="M3 5h16M3 11h16M3 17h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
      <path d="M4 4l12 12M16 4L4 16" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4 text-gray-400">
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

function DropdownItem({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-[14px] text-gray-700 hover:bg-surface-gray transition-colors"
    >
      {label}
    </Link>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProviderTopNav(_props: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = user?.displayName ?? 'Provider'
  const email = user?.email ?? ''
  const avatarInitials = getInitials(user?.displayName)

  async function handleSignOut() {
    await auth.signOut()
    router.push('/')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return
    function onDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [dropdownOpen])

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      {/* ── Sticky top bar ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-border h-[60px] flex items-center px-4 md:px-8 gap-4">

        {/* Logo */}
        <Link
          href="/provider/dashboard"
          className="text-[20px] font-bold text-brand-primary tracking-tight flex-shrink-0"
        >
          SAVIS
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 flex-1">
          {NAV_LINKS.map(({ label, href }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={`text-[14px] font-medium transition-colors pb-0.5 ${
                  active
                    ? 'text-brand-action border-b-2 border-brand-action'
                    : 'text-gray-500 hover:text-brand-primary'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Push right on mobile */}
        <div className="flex-1 md:hidden" />

        {/* Mobile: small avatar */}
        <div className="md:hidden w-8 h-8 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
          <span className="text-[12px] font-bold text-brand-primary">{avatarInitials}</span>
        </div>

        {/* Desktop: avatar + name + dropdown */}
        <div className="relative hidden md:block flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
              <span className="text-[12px] font-bold text-brand-primary">{avatarInitials}</span>
            </div>
            <span className="text-[14px] font-medium text-gray-800">{displayName}</span>
            <ChevronDownIcon />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-[200px] bg-white rounded-xl shadow-md border border-border z-50">
              <div className="px-4 pt-3 pb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary text-white text-[11px] font-semibold">
                  Provider mode
                </span>
              </div>
              <div className="px-4 pb-3">
                <p className="text-[14px] font-medium text-gray-900">{displayName}</p>
                <p className="text-[12px] text-gray-400 truncate">{email}</p>
              </div>
              <div className="border-t border-border" />
              <div className="py-1">
                <DropdownItem href="/profile" label="Profile" onClick={() => setDropdownOpen(false)} />
                <DropdownItem href="/help" label="Help & Support" onClick={() => setDropdownOpen(false)} />
              </div>
              <div className="border-t border-border" />
              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); void handleSignOut() }}
                  className="w-full text-left px-4 py-2 text-[14px] text-error hover:bg-error-light transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile: hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          className="md:hidden w-9 h-9 flex items-center justify-center text-text-primary flex-shrink-0"
        >
          <HamburgerIcon />
        </button>
      </nav>

      {/* ── Mobile drawer backdrop ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed top-0 left-0 h-full w-[280px] bg-white z-50 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            href="/provider/dashboard"
            onClick={() => setDrawerOpen(false)}
            className="text-[20px] font-bold text-brand-primary tracking-tight"
          >
            SAVIS
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Provider mode pill */}
        <div className="px-6 pb-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-brand-primary text-white text-[11px] font-semibold">
            Provider mode
          </span>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto">
          {NAV_LINKS.map(({ label, href }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center justify-between h-[48px] px-6 text-[15px] font-medium transition-colors ${
                  active
                    ? 'text-brand-action bg-brand-light'
                    : 'text-gray-700 hover:bg-surface-gray'
                }`}
              >
                {label}
                {active && <div className="w-1.5 h-1.5 rounded-full bg-brand-action flex-shrink-0" />}
              </Link>
            )
          })}
        </div>

        <div className="border-t border-border" />

        {/* User info + sign out */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0">
              <span className="text-[13px] font-bold text-brand-primary">{avatarInitials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-gray-900 truncate">{displayName}</p>
              <p className="text-[12px] text-gray-400 truncate">{email}</p>
            </div>
          </div>
          <button
            onClick={() => { setDrawerOpen(false); void handleSignOut() }}
            className="text-[14px] text-error hover:opacity-80 transition-opacity"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}

export { ProviderTopNav as BottomNav }
