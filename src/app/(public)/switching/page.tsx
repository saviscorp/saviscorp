'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// ─── Phosphor-style inline SVG icons ─────────────────────────────────────────

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
      <rect x="4" y="16" width="40" height="28" rx="4" stroke="#640D5F" strokeWidth="3" fill="none"/>
      <path d="M16 16V12a8 8 0 0 1 16 0v4" stroke="#640D5F" strokeWidth="3" strokeLinecap="round"/>
      <line x1="4" y1="28" x2="44" y2="28" stroke="#640D5F" strokeWidth="3"/>
      <line x1="20" y1="28" x2="28" y2="28" stroke="#640D5F" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
      <path d="M6 22L24 6l18 16" stroke="#640D5F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 19v21a2 2 0 0 0 2 2h8V30h8v12h8a2 2 0 0 0 2-2V19" stroke="#640D5F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Inner component ──────────────────────────────────────────────────────────

function SwitchingPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const to = searchParams.get('to') as 'provider' | 'requestor' | null
  const targetMode = to === 'provider' ? 'provider' : 'requestor'

  // Animation phases:
  //   phase 0 (0–800ms):  old icon slides out left + fades, text fades
  //   phase 1 (800ms):    transition; new icon/circle animate in
  //   phase 2 (2000ms):   navigate away
  const [phase, setPhase] = useState<0 | 1>(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800)
    const t2 = setTimeout(() => {
      router.push(targetMode === 'provider' ? '/dashboard/provider' : '/dashboard/requestor')
    }, 2200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [router, targetMode])

  const newModeLabel = targetMode === 'provider' ? 'Provider' : 'Requestor'
  const OldIcon = targetMode === 'provider' ? HouseIcon : BriefcaseIcon
  const NewIcon = targetMode === 'provider' ? BriefcaseIcon : HouseIcon

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative"
      aria-live="polite"
    >
      {/* Expanding circle */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="rounded-full transition-all duration-700 ease-out"
          style={{
            width: phase === 1 ? '120vmax' : '0',
            height: phase === 1 ? '120vmax' : '0',
            background: 'rgba(100, 13, 95, 0.07)',
            transitionDelay: '0ms',
          }}
        />
      </div>

      {/* Phase 0 — old mode slides out */}
      <div
        className="flex flex-col items-center gap-4 absolute transition-all duration-500 ease-in"
        style={{
          opacity: phase === 0 ? 1 : 0,
          transform: phase === 0 ? 'translateX(0)' : 'translateX(-60px)',
        }}
        aria-hidden={phase !== 0}
      >
        <div className="w-20 h-20 rounded-full bg-surface-gray flex items-center justify-center">
          <OldIcon />
        </div>
        <p className="text-[18px] font-semibold text-text-primary">
          Switching to {newModeLabel} mode…
        </p>
      </div>

      {/* Phase 1 — new mode slides in */}
      <div
        className="flex flex-col items-center gap-4 transition-all duration-500 ease-out"
        style={{
          opacity: phase === 1 ? 1 : 0,
          transform: phase === 1 ? 'translateX(0)' : 'translateX(60px)',
          transitionDelay: phase === 1 ? '100ms' : '0ms',
        }}
        aria-hidden={phase !== 1}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-700 ease-out"
          style={{
            background: 'rgba(100, 13, 95, 0.10)',
            transform: phase === 1 ? 'scale(1)' : 'scale(0)',
          }}
        >
          <NewIcon />
        </div>

        <div className="text-center">
          <p className="text-[20px] font-bold text-text-primary">
            You&apos;re now in {newModeLabel} mode
          </p>
          <p className="text-[14px] text-text-secondary mt-1">
            Taking you there now…
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-primary animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function SwitchingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <SwitchingPageInner />
    </Suspense>
  )
}
