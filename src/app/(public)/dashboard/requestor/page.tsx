'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAuthContext } from '@/context/AuthContext'
import { getUpcomingBookings, type BookingDoc } from '@/lib/firebase/bookings'

// ─── Booking item ─────────────────────────────────────────────────────────────

function BookingItem({ booking }: { booking: BookingDoc }) {
  const isPending = booking.status === 'pending_provider'
  const isConfirmed = booking.status === 'confirmed'
  const isCompleted = booking.status === 'completed'

  let statusLabel = 'Pending'
  let statusBg = '#FFF8E1'
  let statusColor = '#9C6B00'
  if (isConfirmed) { statusLabel = 'Confirmed'; statusBg = '#E1F5EE'; statusColor = '#1D9E75' }
  if (isCompleted) { statusLabel = 'Completed'; statusBg = '#E1F5EE'; statusColor = '#1D9E75' }
  void isPending

  return (
    <div
      className="bg-white rounded-xl p-4 space-y-2"
      style={{ border: '1px solid #E8E2E8', borderLeft: `3px solid ${isConfirmed ? '#640D5F' : '#FFB200'}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[15px] font-semibold" style={{ color: '#1A0A1A' }}>
          {booking.serviceName ?? 'Service'}
        </p>
        <span
          className="text-[11px] font-medium px-2.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: statusBg, color: statusColor }}
        >
          {statusLabel}
        </span>
      </div>
      <div className="flex items-center gap-4 text-[13px]" style={{ color: '#6B5C6B' }}>
        <span>{booking.preferredDate}</span>
        <span>{booking.preferredTime}</span>
      </div>
      <p className="text-[13px] font-medium" style={{ color: '#640D5F' }}>
        KES {booking.price.toLocaleString('en-KE')}
      </p>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen animate-pulse" style={{ background: '#F5F6F8' }}>
      <div className="h-[60px] bg-white" style={{ borderBottom: '1px solid #E8E2E8' }} />
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-white" />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestorDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { switchMode } = useAuthContext()
  const [bookings, setBookings] = useState<BookingDoc[]>([])
  const [loading, setLoading] = useState(true)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth?role=requestor')
  }, [authLoading, user, router])

  // Load bookings
  useEffect(() => {
    if (!user) return
    getUpcomingBookings(user.uid)
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [user])

  if (authLoading || (loading && user)) return <Skeleton />

  const displayName = user?.displayName?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F6F8' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 bg-white px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid #E8E2E8' }}
      >
        <span className="text-[20px] font-bold" style={{ color: '#640D5F' }}>SAVIS</span>
        <span
          className="text-[12px] font-semibold px-3 py-1 rounded-full text-white"
          style={{ background: '#D91656' }}
        >
          Requestor mode
        </span>
      </header>

      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-5">
        {/* Welcome */}
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: '#1A0A1A' }}>
            Hello, {displayName} 👋
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: '#6B5C6B' }}>
            Your upcoming bookings are below.
          </p>
        </div>

        {/* Browse */}
        <Link
          href="/"
          className="flex items-center justify-center h-[48px] rounded-[10px] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
          style={{ background: '#D91656' }}
        >
          Browse services
        </Link>

        {/* Bookings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold" style={{ color: '#1A0A1A' }}>
              My bookings
            </h2>
            <span className="text-[13px]" style={{ color: '#6B5C6B' }}>
              {bookings.length} upcoming
            </span>
          </div>

          {bookings.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: 'white', border: '1px solid #E8E2E8' }}
            >
              <p className="text-[15px] font-medium" style={{ color: '#1A0A1A' }}>
                No bookings yet
              </p>
              <p className="text-[13px] mt-1 mb-4" style={{ color: '#6B5C6B' }}>
                Browse available services and make your first booking.
              </p>
              <Link
                href="/"
                className="inline-block px-5 py-2.5 rounded-[10px] text-white text-[14px] font-semibold"
                style={{ background: '#640D5F' }}
              >
                Browse services
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <BookingItem key={b.id} booking={b} />
              ))}
            </div>
          )}
        </div>

        {/* Switch mode */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'white', border: '1px solid #E8E2E8' }}
        >
          <p className="text-[13px] mb-3" style={{ color: '#6B5C6B' }}>
            Want to offer your own services on SAVIS?
          </p>
          <button
            onClick={() => switchMode('provider')}
            className="w-full h-[44px] rounded-[10px] text-[14px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#F5F6F8', color: '#640D5F', border: '1px solid #E8E2E8' }}
          >
            Switch to Provider mode
          </button>
        </div>
      </main>
    </div>
  )
}
