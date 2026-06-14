'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Wallet, X } from 'phosphor-react'

interface AuthGateSheetProps {
  isOpen: boolean
  onClose: () => void
  variant: 'booking' | 'provider'
  serviceContext?: { name: string; price: number }
  onCreateAccount: () => void
  onSignIn: () => void
  onGoogleSignIn: () => void
}

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35Z" fill="#4285F4"/>
    <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.596-4.123H1.064v2.59A9.996 9.996 0 0 0 10 20Z" fill="#34A853"/>
    <path d="M4.404 11.9A6.01 6.01 0 0 1 4.09 10c0-.664.114-1.309.314-1.9V5.51H1.064A9.996 9.996 0 0 0 0 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59Z" fill="#FBBC05"/>
    <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0A9.996 9.996 0 0 0 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977Z" fill="#EA4335"/>
  </svg>
)

export default function AuthGateSheet({
  isOpen,
  onClose,
  variant,
  serviceContext,
  onCreateAccount,
  onSignIn,
  onGoogleSignIn,
}: AuthGateSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
      setTimeout(() => firstFocusableRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const isBooking = variant === 'booking'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(58, 7, 57, 0.55)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet / Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isBooking ? 'Sign in to book this service' : 'Start earning on SAVIS'}
        ref={sheetRef}
        className={[
          'fixed z-50 bg-white',
          // Mobile: bottom sheet
          'bottom-0 left-0 right-0 rounded-t-[20px]',
          // md+: centred modal
          'md:inset-0 md:m-auto md:h-fit md:max-w-[480px] md:rounded-xl md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
          isOpen ? 'animate-slide-up md:animate-none' : '',
        ].join(' ')}
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Close button */}
        <div className="flex justify-end px-4 pt-3 md:pt-4">
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-gray transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 pt-2 md:px-8 md:pb-10 md:pt-2">

          {/* Provider icon */}
          {!isBooking && (
            <div className="mb-5 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-light">
                <Wallet size={32} weight="regular" className="text-brand-primary" />
              </div>
            </div>
          )}

          {/* Booking context chip */}
          {isBooking && serviceContext && (
            <div className="mb-5 flex items-center gap-2 rounded-[10px] border border-brand-action bg-action-light px-4 py-2.5">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-action">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                  <path d="M1 4l2.5 2.5L9 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[14px] font-medium text-brand-action">
                {serviceContext.name} · KES {serviceContext.price.toLocaleString()}
              </span>
            </div>
          )}

          {/* Headline */}
          <h2
            className="mb-1.5 font-display text-[22px] font-bold leading-tight text-text-primary"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {isBooking ? 'Sign in to book this service' : 'Start earning on SAVIS'}
          </h2>

          {/* Subtext */}
          <p className="mb-6 text-[15px] text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>
            {isBooking
              ? 'Join thousands of customers already using SAVIS'
              : 'List your skills, set your price, get booked.'}
          </p>

          {/* Primary CTA */}
          <button
            onClick={isBooking ? onCreateAccount : onCreateAccount}
            className="mb-4 flex h-[52px] w-full items-center justify-center rounded-[10px] bg-brand-action text-[15px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-action"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {isBooking ? 'Create a free account' : 'Become a provider'}
          </button>

          {/* Divider */}
          <Divider />

          {/* Google Sign-In */}
          <button
            onClick={onGoogleSignIn}
            className="mb-4 flex h-[52px] w-full items-center justify-center gap-3 rounded-[10px] border border-[#DADCE0] bg-white text-[15px] font-medium text-[#202124] transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4285F4]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <GoogleLogo />
            Continue with Google
          </button>

          {/* Divider */}
          <Divider />

          {/* Ghost — Sign in */}
          <button
            onClick={onSignIn}
            className="mb-5 flex h-[52px] w-full items-center justify-center rounded-[10px] border border-brand-primary text-[15px] font-semibold text-brand-primary transition-colors hover:bg-brand-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Sign in instead
          </button>

          {/* Footer legal */}
          <p
            className="text-center text-[12px] text-text-secondary"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-brand-primary underline underline-offset-2 hover:opacity-80">
              Terms
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-brand-primary underline underline-offset-2 hover:opacity-80">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

function Divider() {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[13px] text-text-secondary" style={{ fontFamily: "'Inter', sans-serif" }}>
        or
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}
