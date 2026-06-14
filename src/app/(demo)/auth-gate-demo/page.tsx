'use client'

import { useState } from 'react'
import AuthGateSheet from '@/components/auth/AuthGateSheet'

const MOCK_SERVICE = { name: 'Plumbing Repairs', price: 1500 }

export default function AuthGateDemoPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [variant, setVariant] = useState<'booking' | 'provider'>('booking')

  function open(v: 'booking' | 'provider') {
    setVariant(v)
    setIsOpen(true)
  }

  return (
    <main className="min-h-screen bg-surface-gray flex flex-col items-center justify-center gap-4">
      <p className="text-[13px] text-secondary mb-2">AuthGateSheet demo — click a button to open</p>

      <div className="flex gap-3">
        <button
          onClick={() => open('booking')}
          className="h-11 px-6 bg-brand-action text-white text-[14px] font-semibold rounded-[10px] hover:opacity-90 transition-opacity"
        >
          Open Booking Gate
        </button>
        <button
          onClick={() => open('provider')}
          className="h-11 px-6 bg-brand-primary text-white text-[14px] font-semibold rounded-[10px] hover:opacity-90 transition-opacity"
        >
          Open Provider Gate
        </button>
      </div>

      <AuthGateSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        variant={variant}
        serviceContext={variant === 'booking' ? MOCK_SERVICE : undefined}
        onCreateAccount={() => console.log('onCreateAccount')}
        onSignIn={() => console.log('onSignIn')}
        onGoogleSignIn={() => console.log('onGoogleSignIn')}
      />
    </main>
  )
}
