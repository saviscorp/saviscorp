'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PayoutCard, BookingCard, QuickActionButton } from '@/components/ui'
import { BottomNav } from '@/components/provider/BottomNav'
import {
  acceptBooking,
  declineBooking,
  completeBooking,
} from '@/lib/firebase/bookings'
import type { BookingCardData } from '@/components/ui'

// ─── Icons ─────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path d="M10 4v12M4 10h12" />
  </svg>
)
const CalendarIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <rect x="3" y="4" width="14" height="13" rx="2" />
    <path d="M3 8h14M7 2v4M13 2v4" />
  </svg>
)
const ClipboardIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
    <path d="M7 4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
    <rect x="7" y="2" width="6" height="4" rx="1" />
  </svg>
)
const StorefrontIllustration = () => (
  <svg width="160" height="110" viewBox="0 0 160 110" fill="none" aria-hidden="true">
    <rect x="25" y="50" width="110" height="58" rx="4" fill="#640D5F" />
    <rect x="32" y="27" width="96" height="28" rx="3" fill="#4a0a47" />
    <rect x="40" y="13" width="80" height="17" rx="3" fill="#FFB200" />
    <text x="80" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fill="#3D0739" fontFamily="Plus Jakarta Sans, sans-serif">SAVIS</text>
    <rect x="60" y="68" width="40" height="40" rx="3" fill="#EB5B00" />
    <rect x="68" y="76" width="7" height="7" rx="1" fill="#640D5F" />
    <rect x="85" y="76" width="7" height="7" rx="1" fill="#640D5F" />
    <rect x="32" y="60" width="24" height="22" rx="2" fill="rgba(255,255,255,0.12)" />
    <rect x="104" y="60" width="24" height="22" rx="2" fill="rgba(255,255,255,0.12)" />
  </svg>
)

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardData {
  hasServices: boolean
  providerName: string
  pendingPayout: number
  nextPayoutDate: string
  cycleCount: number
  upcomingBookings: BookingCardData[]
  totalUpcoming: number
  showProviderBanner: boolean
}

// ─── Inline toast ──────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed top-16 left-4 right-4 z-50 bg-gray-900 text-white text-[14px] font-medium px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-2">
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-3 text-white/60 hover:text-white text-lg leading-none">×</button>
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyDashboard({ showBanner }: { showBanner: boolean }) {
  const router = useRouter()
  return (
    <main className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
      {showBanner && (
        <div className="w-full mb-6 bg-brand-light border-l-4 border-brand-action rounded-xl p-4 text-left">
          <p className="text-[14px] font-medium text-gray-800">
            You haven&apos;t listed a service yet. Add one to start getting booked.
          </p>
          <button
            onClick={() => router.push('/become-provider/list-service')}
            className="mt-2 text-[13px] font-semibold text-brand-action underline underline-offset-2"
          >
            + Add service
          </button>
        </div>
      )}
      <StorefrontIllustration />
      <h1 className="text-[20px] font-bold text-gray-900 mt-6">Your provider profile is ready</h1>
      <p className="text-[15px] text-gray-500 mt-2 max-w-xs leading-relaxed">
        Add your first service to start receiving bookings and earning on SAVIS.
      </p>
      <button
        onClick={() => router.push('/become-provider/list-service')}
        className="mt-6 w-[280px] py-3.5 bg-brand-action text-white rounded-xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
      >
        + Add a service
      </button>
      <p className="mt-4 text-[13px] text-gray-400">
        Questions?{' '}
        <button
          onClick={() => router.push('/help')}
          className="text-brand-primary underline underline-offset-2"
        >
          Visit Help &amp; Support
        </button>
      </p>
    </main>
  )
}

// ─── Active dashboard ──────────────────────────────────────────────────────────

function ActiveDashboard({ data, onDataChange }: {
  data: DashboardData
  onDataChange: (updater: (prev: BookingCardData[]) => BookingCardData[]) => void
}) {
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const handleAccept = async (id: string) => {
    // Optimistic update
    onDataChange((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'confirmed' as const } : b))
    )
    try {
      await acceptBooking(id)
      showToast('Booking confirmed. Customer has been notified.')
    } catch {
      console.error('acceptBooking failed', id)
      onDataChange((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'pending' as const } : b))
      )
    }
  }

  const handleDecline = async (id: string) => {
    // Optimistic: remove from list
    onDataChange((prev) => prev.filter((b) => b.id !== id))
    try {
      await declineBooking(id, '')
    } catch {
      console.error('declineBooking failed', id)
    }
  }

  const handleComplete = async (id: string) => {
    // Optimistic: remove from upcoming
    onDataChange((prev) => prev.filter((b) => b.id !== id))
    try {
      await completeBooking(id)
    } catch {
      console.error('completeBooking failed', id)
    }
  }

  return (
    <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <PayoutCard
        amount={data.pendingPayout}
        nextPayoutDate={data.nextPayoutDate}
        cycleCount={data.cycleCount}
        onViewEarnings={() => router.push('/provider/earnings')}
      />

      <div className="flex gap-3">
        <QuickActionButton icon={<PlusIcon />} label="Add service" onClick={() => router.push('/become-provider/list-service')} />
        <QuickActionButton icon={<CalendarIcon />} label="Schedule" onClick={() => router.push('/provider/schedule')} />
        <QuickActionButton icon={<ClipboardIcon />} label="Bookings" onClick={() => router.push('/provider/bookings')} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-semibold text-gray-900">Upcoming bookings</h2>
          {data.totalUpcoming > 0 && (
            <button
              onClick={() => router.push('/provider/bookings')}
              className="text-[13px] text-brand-primary hover:underline"
            >
              View all {data.totalUpcoming} →
            </button>
          )}
        </div>
        {data.upcomingBookings.length === 0 ? (
          <div className="bg-white border border-border-savis rounded-xl p-6 text-center text-[14px] text-gray-400">
            No upcoming bookings. They&apos;ll appear here once customers book your services.
          </div>
        ) : (
          <div className="space-y-3">
            {data.upcomingBookings.slice(0, 3).map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                variant="dashboard"
                onAccept={handleAccept}
                onDecline={handleDecline}
                onComplete={handleComplete}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Shell ─────────────────────────────────────────────────────────────────────

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [bookings, setBookings] = useState<BookingCardData[]>(
    initialData.upcomingBookings
  )

  const dataWithBookings: DashboardData = {
    ...initialData,
    upcomingBookings: bookings,
  }

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      <BottomNav mode="provider" />

      {initialData.hasServices ? (
        <ActiveDashboard data={dataWithBookings} onDataChange={setBookings} />
      ) : (
        <EmptyDashboard showBanner={initialData.showProviderBanner} />
      )}
    </div>
  )
}
