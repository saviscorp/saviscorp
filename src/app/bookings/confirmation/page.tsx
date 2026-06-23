'use client'

import { useRouter } from 'next/navigation'

export default function BookingConfirmationPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col items-center justify-center px-6 text-center">
      {/* Check illustration */}
      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
        <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
          <circle cx="20" cy="20" r="20" fill="#1D9E75" fillOpacity="0.15" />
          <path d="M12 20l6 6 10-12" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="text-[24px] font-bold text-gray-900 mb-2">Booking request sent!</h1>
      <p className="text-[15px] text-gray-500 max-w-xs leading-relaxed mb-8">
        The provider will review your request and confirm it shortly. You&apos;ll be notified once it&apos;s confirmed.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => router.push('/bookings')}
          className="w-full py-3.5 bg-brand-primary text-white rounded-xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          View my bookings
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3.5 border border-border-savis text-gray-700 rounded-xl font-semibold text-[15px] hover:bg-brand-light transition-all"
        >
          Browse more services
        </button>
      </div>
    </div>
  )
}
