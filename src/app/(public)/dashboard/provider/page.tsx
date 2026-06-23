'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAuthContext } from '@/context/AuthContext'
import { getProviderServices, type ServiceDoc } from '@/lib/firebase/services'
import Link from 'next/link'

// ─── Service card ─────────────────────────────────────────────────────────────

function ServiceItem({ svc }: { svc: ServiceDoc }) {
  const price = svc.basePrice ?? svc.price ?? 0
  const photo = svc.thumbnailUrl ?? svc.photoUrls?.[0]
  const isPublished = svc.status === 'published'

  return (
    <div
      className="bg-white rounded-xl p-4 flex items-center gap-3"
      style={{ border: '1px solid #E8E2E8' }}
    >
      <div
        className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background: '#FDF0FC' }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={svc.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">🛠️</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold truncate" style={{ color: '#1A0A1A' }}>
          {svc.name}
        </p>
        <p className="text-[13px] mt-0.5" style={{ color: '#6B5C6B' }}>
          From KES {price.toLocaleString('en-KE')}
        </p>
      </div>
      <span
        className="text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
        style={{
          background: isPublished ? '#E1F5EE' : '#FFF8E1',
          color: isPublished ? '#1D9E75' : '#9C6B00',
        }}
      >
        {isPublished ? 'Live' : 'Paused'}
      </span>
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
          <div key={i} className="h-20 rounded-xl bg-white" />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProviderDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { switchMode } = useAuthContext()
  const [services, setServices] = useState<ServiceDoc[]>([])
  const [loading, setLoading] = useState(true)

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth?role=provider')
  }, [authLoading, user, router])

  // Load services
  useEffect(() => {
    if (!user) return
    getProviderServices(user.uid)
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }, [user])

  if (authLoading || (loading && user)) return <Skeleton />

  const displayName = user?.displayName?.split(' ')[0] ?? 'Provider'

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
          style={{ background: '#640D5F' }}
        >
          Provider mode
        </span>
      </header>

      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full space-y-5">
        {/* Welcome */}
        <div>
          <h1 className="text-[22px] font-bold" style={{ color: '#1A0A1A' }}>
            Hello, {displayName} 👋
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: '#6B5C6B' }}>
            Manage your services below.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/become-provider/list-service')}
            className="flex-1 h-[48px] rounded-[10px] text-white text-[14px] font-semibold hover:opacity-90 transition-opacity"
            style={{ background: '#D91656' }}
          >
            + List a service
          </button>
          <button
            onClick={() => router.push('/provider/dashboard')}
            className="flex-1 h-[48px] rounded-[10px] text-[14px] font-semibold hover:opacity-90 transition-opacity"
            style={{ background: 'white', border: '1px solid #E8E2E8', color: '#640D5F' }}
          >
            Full dashboard
          </button>
        </div>

        {/* Services */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-semibold" style={{ color: '#1A0A1A' }}>
              My services
            </h2>
            <span className="text-[13px]" style={{ color: '#6B5C6B' }}>
              {services.length} {services.length === 1 ? 'service' : 'services'}
            </span>
          </div>

          {services.length === 0 ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: 'white', border: '1px solid #E8E2E8' }}
            >
              <p className="text-[15px] font-medium" style={{ color: '#1A0A1A' }}>
                No services listed yet
              </p>
              <p className="text-[13px] mt-1 mb-4" style={{ color: '#6B5C6B' }}>
                Your first listing takes under 5 minutes.
              </p>
              <button
                onClick={() => router.push('/become-provider/list-service')}
                className="px-5 py-2.5 rounded-[10px] text-white text-[14px] font-semibold"
                style={{ background: '#640D5F' }}
              >
                List your first service
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((svc) => (
                <ServiceItem key={svc.id} svc={svc} />
              ))}
              <Link
                href="/provider/services"
                className="block text-center text-[13px] font-medium py-2"
                style={{ color: '#640D5F' }}
              >
                Manage all services →
              </Link>
            </div>
          )}
        </div>

        {/* Switch mode */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'white', border: '1px solid #E8E2E8' }}
        >
          <p className="text-[13px] mb-3" style={{ color: '#6B5C6B' }}>
            Want to book services from other providers?
          </p>
          <button
            onClick={() => switchMode('requestor')}
            className="w-full h-[44px] rounded-[10px] text-[14px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#F5F6F8', color: '#640D5F', border: '1px solid #E8E2E8' }}
          >
            Switch to Requestor mode
          </button>
        </div>
      </main>
    </div>
  )
}
