'use client'

import { X, CheckCircle } from 'phosphor-react'
import { useEffect } from 'react'

interface AuthGateSheetProps {
  isOpen: boolean
  onClose: () => void
  serviceName: string
  servicePrice: number
}

export default function AuthGateSheet({
  isOpen,
  onClose,
  serviceName,
  servicePrice,
}: AuthGateSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet — bottom on mobile, centered modal on desktop */}
      <div
        className="
          fixed z-50 bg-white
          bottom-0 left-0 right-0 rounded-t-[20px]
          lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2
          lg:w-[440px] lg:rounded-2xl lg:bottom-auto lg:left-auto lg:right-auto
          p-6 shadow-xl
        "
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to book"
      >
        {/* Drag handle (mobile only) */}
        <div className="lg:hidden flex justify-center mb-4">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Service chip */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 bg-action-light border border-brand-action/20 rounded-full px-4 py-2">
            <CheckCircle weight="fill" size={16} className="text-brand-action" />
            <span className="text-[14px] font-medium text-primary">
              {serviceName} · KES {servicePrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-[22px] font-bold text-primary mb-1.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Sign in to book this service
        </h2>
        <p className="text-[15px] text-secondary mb-6">
          Join thousands of customers already using SAVIS
        </p>

        {/* CTA buttons */}
        <div className="space-y-3">
          <button className="w-full h-[52px] bg-brand-action text-white font-semibold text-[15px] rounded-[10px] hover:bg-brand-action/90 transition-colors">
            Create a free account
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[13px] text-secondary">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button className="w-full h-[52px] border border-border rounded-[10px] flex items-center justify-center gap-3 text-[15px] font-medium text-primary hover:bg-gray-50 transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.39a4.6 4.6 0 01-2 3.02v2.52h3.23c1.89-1.74 2.98-4.3 2.98-7.33z" fill="#4285F4"/>
              <path d="M10 20c2.7 0 4.96-.9 6.62-2.44l-3.23-2.52c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H1.07v2.6A10 10 0 0010 20z" fill="#34A853"/>
              <path d="M4.41 11.87A6.01 6.01 0 014.1 10c0-.65.11-1.28.31-1.87V5.53H1.07A10 10 0 000 10c0 1.61.39 3.14 1.07 4.47l3.34-2.6z" fill="#FBBC05"/>
              <path d="M10 3.96c1.47 0 2.79.51 3.82 1.5L16.69 2.4A9.97 9.97 0 0010 0 10 10 0 001.07 5.53l3.34 2.6C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[13px] text-secondary">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button className="w-full h-[52px] border border-brand-primary rounded-[10px] text-[15px] font-semibold text-brand-primary hover:bg-brand-light transition-colors">
            Sign in instead
          </button>
        </div>

        {/* Legal */}
        <p className="mt-4 text-center text-[12px] text-secondary">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-brand-primary underline">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-brand-primary underline">Privacy Policy</a>
        </p>
      </div>
    </>
  )
}
