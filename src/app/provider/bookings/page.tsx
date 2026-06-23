'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { BottomNav } from '@/components/provider/BottomNav'
import { BookingCard } from '@/components/ui'
import {
  getUpcomingBookings,
  getCompletedBookings,
  acceptBooking,
  declineBooking,
  completeBooking,
} from '@/lib/firebase/bookings'
import type { BookingDoc } from '@/lib/firebase/bookings'
import type { BookingCardData } from '@/components/ui'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(preferredDate: string, preferredTime: string): string {
  const date = new Date(preferredDate + 'T00:00:00')
  const dayName = date.toLocaleDateString('en-KE', { weekday: 'short' })
  const dayNum = date.getDate()
  const mon = date.toLocaleDateString('en-KE', { month: 'short' })
  const time = preferredTime === 'flexible' ? 'Flexible' : preferredTime
  return `${dayName} ${dayNum} ${mon} · ${time}`
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?'
}

function bookingToCard(b: BookingDoc): BookingCardData {
  const cName = b.customerName ?? 'Customer'
  return {
    id: b.id,
    customerName: cName,
    customerInitials: getInitials(cName),
    serviceName: b.serviceName ?? '',
    dateTime: formatDateTime(b.preferredDate, b.preferredTime),
    location: b.location,
    status: (b.status === 'pending_provider'
      ? 'pending'
      : b.status === 'declined'
      ? 'pending'
      : b.status) as BookingCardData['status'],
    price: b.price,
    specialInstructions: b.specialInstructions,
    bookingRef: `BK-${b.id.slice(0, 8).toUpperCase()}`,
  }
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed top-16 left-4 right-4 z-50 bg-gray-900 text-white text-[14px] font-medium px-4 py-3 rounded-xl shadow-lg flex items-center justify-between">
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-3 text-white/60 hover:text-white text-lg">×</button>
    </div>
  )
}

// ─── Decline sheet ─────────────────────────────────────────────────────────────

function DeclineSheet({
  booking,
  onConfirm,
  onCancel,
}: {
  booking: BookingCardData
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onCancel}>
      <div className="bg-white rounded-t-2xl w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-border-savis mx-auto mb-4" />
        <h2 className="text-[18px] font-bold text-gray-900 mb-1">Why are you declining?</h2>
        <p className="text-[14px] text-gray-400 mb-4">{booking.serviceName} · {booking.customerName}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional reason…"
          rows={3}
          className="w-full border border-border-savis rounded-xl p-3 text-[14px] text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none mb-4"
        />
        <button
          onClick={() => onConfirm(reason)}
          className="w-full py-3.5 bg-error text-white rounded-xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Decline booking
        </button>
        <button onClick={onCancel} className="w-full mt-2 py-2 text-[14px] text-gray-400">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="min-h-screen bg-surface-gray animate-pulse">
      <div className="h-14 bg-white border-b border-border-savis" />
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white rounded-xl" />)}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type TabType = 'upcoming' | 'completed'

export default function ProviderBookingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<TabType>('upcoming')
  const [upcoming, setUpcoming] = useState<BookingCardData[]>([])
  const [completed, setCompleted] = useState<BookingCardData[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [declineTarget, setDeclineTarget] = useState<BookingCardData | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const [upcomingDocs, completedDocs] = await Promise.all([
        getUpcomingBookings(user.uid),
        getCompletedBookings(user.uid),
      ])
      setUpcoming(upcomingDocs.map(bookingToCard))
      setCompleted(completedDocs.map(bookingToCard))
    } catch (err) {
      console.error('Bookings load error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, load])

  const handleAccept = async (id: string) => {
    setUpcoming((prev) => prev.map((b) => b.id === id ? { ...b, status: 'confirmed' as const } : b))
    try {
      await acceptBooking(id)
      showToast('Booking confirmed. Customer has been notified.')
    } catch (err) {
      console.error('acceptBooking failed:', err)
      setUpcoming((prev) => prev.map((b) => b.id === id ? { ...b, status: 'pending' as const } : b))
    }
  }

  const handleDeclineClick = (id: string) => {
    const booking = upcoming.find((b) => b.id === id)
    if (booking) setDeclineTarget(booking)
  }

  const handleDeclineConfirm = async (reason: string) => {
    if (!declineTarget) return
    const id = declineTarget.id
    setDeclineTarget(null)
    const removed = upcoming.find((b) => b.id === id)!
    setUpcoming((prev) => prev.filter((b) => b.id !== id))
    try {
      await declineBooking(id, reason)
    } catch (err) {
      console.error('declineBooking failed:', err)
      setUpcoming((prev) => [...prev, removed])
    }
  }

  const handleComplete = async (id: string) => {
    const booking = upcoming.find((b) => b.id === id)
    setUpcoming((prev) => prev.filter((b) => b.id !== id))
    if (booking) setCompleted((prev) => [{ ...booking, status: 'completed' as const }, ...prev])
    try {
      await completeBooking(id)
    } catch (err) {
      console.error('completeBooking failed:', err)
      if (booking) {
        setUpcoming((prev) => [...prev, booking])
        setCompleted((prev) => prev.filter((b) => b.id !== id))
      }
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (authLoading || loading) return <Skeleton />

  if (error) {
    return (
      <div className="min-h-screen bg-surface-gray flex items-center justify-center px-4">
        <div className="bg-white border border-border-savis rounded-xl p-6 text-center max-w-xs">
          <p className="text-[15px] font-semibold text-gray-900 mb-1">Something went wrong</p>
          <p className="text-[13px] text-gray-400 mb-4">Pull to refresh.</p>
          <button onClick={load} className="px-5 py-2 bg-brand-primary text-white text-[14px] rounded-lg font-medium">Retry</button>
        </div>
      </div>
    )
  }

  const items = tab === 'upcoming' ? upcoming : completed

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      <BottomNav mode="provider" />
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-brand-primary p-1 -ml-1">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M12 4l-6 6 6 6"/></svg>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">Bookings</h1>
        <div className="w-8" />
      </header>

      {/* Tab switcher */}
      <div className="bg-white border-b border-border-savis px-4 flex gap-0">
        {(['upcoming', 'completed'] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'upcoming' && upcoming.length > 0 && (
              <span className="ml-1.5 text-[11px] bg-brand-primary text-white px-1.5 py-0.5 rounded-full">
                {upcoming.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 px-4 py-4 space-y-3">
        {items.length === 0 ? (
          <div className="bg-white border border-border-savis rounded-xl p-8 text-center">
            <p className="text-[15px] font-semibold text-gray-700 mb-1">
              {tab === 'upcoming' ? 'No upcoming bookings' : 'No completed bookings yet'}
            </p>
            <p className="text-[13px] text-gray-400">
              {tab === 'upcoming'
                ? 'Booking requests will appear here once customers find your services.'
                : 'Completed bookings will appear here.'}
            </p>
          </div>
        ) : (
          items.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              variant="manage"
              expanded={expanded.has(booking.id)}
              onToggleExpand={toggleExpand}
              onAccept={tab === 'upcoming' ? handleAccept : undefined}
              onDecline={tab === 'upcoming' ? handleDeclineClick : undefined}
              onComplete={tab === 'upcoming' ? handleComplete : undefined}
            />
          ))
        )}
      </main>

      {declineTarget && (
        <DeclineSheet
          booking={declineTarget}
          onConfirm={handleDeclineConfirm}
          onCancel={() => setDeclineTarget(null)}
        />
      )}

    </div>
  )
}
