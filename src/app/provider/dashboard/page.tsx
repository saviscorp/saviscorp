'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { getProviderProfile } from '@/lib/firebase/providers'
import { hasAnyServices } from '@/lib/firebase/services'
import { getUpcomingBookings } from '@/lib/firebase/bookings'
import { getEarningsSummary, getPayoutConfig, calculateNextPayoutDate } from '@/lib/firebase/earnings'
import { DashboardClient } from './DashboardClient'
import type { DashboardData } from './DashboardClient'
import type { BookingCardData } from '@/components/ui'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(preferredDate: string, preferredTime: string): string {
  const date = new Date(preferredDate + 'T00:00:00')
  const dayName = date.toLocaleDateString('en-KE', { weekday: 'short' })
  const dayNum = date.getDate()
  const month = date.toLocaleDateString('en-KE', { month: 'short' })
  const time = preferredTime === 'flexible' ? 'Flexible' : preferredTime
  return `${dayName} ${dayNum} ${month} · ${time}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?'
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-surface-gray pb-20 animate-pulse">
      <div className="h-14 bg-white border-b border-border-savis" />
      <div className="p-4 space-y-4">
        <div className="h-36 bg-gray-200 rounded-2xl" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-border-savis" />
        ))}
      </div>
    </div>
  )
}

// ─── Error state ───────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-surface-gray flex items-center justify-center px-4">
      <div className="bg-white border border-border-savis rounded-xl p-6 text-center max-w-xs">
        <p className="text-[15px] font-semibold text-gray-900 mb-1">Something went wrong</p>
        <p className="text-[13px] text-gray-400 mb-4">Pull to refresh.</p>
        <button
          onClick={onRetry}
          className="px-5 py-2 bg-brand-primary text-white text-[14px] rounded-lg font-medium hover:opacity-90"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProviderDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadError, setLoadError] = useState(false)

  const load = async () => {
    if (!user) return
    setLoadError(false)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const [provider, hasServices, upcomingDocs, payoutConfig] = await Promise.all([
        getProviderProfile(user.uid).catch(() => null),
        hasAnyServices(user.uid).catch(() => false),
        getUpcomingBookings(user.uid).catch(() => [] as Awaited<ReturnType<typeof getUpcomingBookings>>),
        getPayoutConfig().catch(() => ({ cycleStartDate: today, cycleDays: 14 })),
      ])

      const commissionRate = provider?.commissionRate ?? 0.07
      const earnings = await getEarningsSummary(user.uid, commissionRate).catch(() => ({
        totalEarned: 0, pendingPayout: 0, pendingPayoutCount: 0, servicesCompleted: 0, avgPerService: 0,
      }))
      const nextPayoutDate = calculateNextPayoutDate(
        payoutConfig.cycleStartDate,
        payoutConfig.cycleDays
      )

      const showProviderBanner =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('savis_provider_intent') === 'true'
      if (showProviderBanner) sessionStorage.removeItem('savis_provider_intent')

      const upcomingBookings: BookingCardData[] = upcomingDocs
        .filter((b) => b.status !== 'declined')
        .map((b) => ({
          id: b.id,
          customerName: b.customerName ?? 'Customer',
          customerInitials: getInitials(b.customerName ?? '?'),
          serviceName: b.serviceName ?? '',
          dateTime: formatDateTime(b.preferredDate, b.preferredTime),
          location: b.location,
          status: (b.status === 'pending_provider'
            ? 'pending'
            : b.status) as BookingCardData['status'],
          price: b.price,
          specialInstructions: b.specialInstructions,
          bookingRef: `BK-${b.id.slice(0, 8).toUpperCase()}`,
        }))

      setData({
        hasServices,
        providerName: user.displayName ?? 'Provider',
        pendingPayout: earnings.pendingPayout,
        nextPayoutDate,
        cycleCount: earnings.pendingPayoutCount,
        upcomingBookings,
        totalUpcoming: upcomingDocs.length,
        showProviderBanner,
      })
    } catch (err) {
      console.error('Dashboard load error:', err)
      setLoadError(true)
    }
  }

  useEffect(() => {
    if (!authLoading) load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user])

  useEffect(() => {
    if (!authLoading && !user) router.push('/login?next=/provider/dashboard')
  }, [authLoading, user, router])

  if (authLoading || (!data && !loadError)) return <DashboardSkeleton />
  if (loadError) return <ErrorState onRetry={load} />
  if (!data) return <DashboardSkeleton />

  return <DashboardClient initialData={data} />
}
