'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { BottomNav } from '@/components/provider/BottomNav'
import { StatusPill, ServiceToggle } from '@/components/ui'
import {
  getProviderServices,
  toggleServiceStatus,
  type ServiceDoc,
} from '@/lib/firebase/services'

// ─── Pause confirm sheet ───────────────────────────────────────────────────────

function PauseConfirmSheet({
  serviceName,
  onConfirm,
  onCancel,
}: {
  serviceName: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={onCancel}>
      <div className="bg-white rounded-t-2xl w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-border-savis mx-auto mb-4" />
        <h2 className="text-[18px] font-bold text-gray-900 mb-2">Pause this service?</h2>
        <p className="text-[14px] text-gray-500 mb-5 leading-relaxed">
          Customers won&apos;t be able to find or book{' '}
          <span className="font-medium text-gray-700">{serviceName}</span> until you reactivate it.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 border border-error text-error rounded-xl font-semibold text-[15px] hover:bg-red-50 active:scale-[0.98] transition-all"
          >
            Pause service
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-semibold text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Keep active
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Service card ──────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  onToggle,
  onEdit,
}: {
  service: ServiceDoc
  onToggle: (id: string, newVal: boolean) => void
  onEdit: (id: string) => void
}) {
  const isPublished = service.status === 'published'
  const price = service.basePrice ?? service.price ?? 0
  const category = service.categoryName ?? service.category ?? ''
  const subcategory = service.subcategoryName ?? service.subcategory ?? ''

  return (
    <div className="bg-white border border-border-savis rounded-xl p-4 shadow-sm">
      <div className="flex gap-3 items-start">
        <div className="w-[60px] h-[60px] rounded-lg bg-brand-light flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
          {service.thumbnailUrl || service.photoUrls?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={service.thumbnailUrl ?? service.photoUrls![0]}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>🛠️</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 truncate">{service.name}</p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {[category, subcategory].filter(Boolean).join(' · ')}
          </p>
          <p className="text-[14px] font-medium text-brand-primary mt-1">
            From KES {price.toLocaleString('en-KE')}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-savis">
        <StatusPill variant={isPublished ? 'published' : 'paused'} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(service.id)}
            className="h-8 px-3 border border-border-savis text-brand-primary rounded-lg text-[13px] font-medium hover:bg-brand-light transition-colors"
          >
            Edit
          </button>
          <ServiceToggle
            checked={isPublished}
            onChange={(v) => onToggle(service.id, v)}
          />
        </div>
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
        {[1,2,3].map((i) => <div key={i} className="h-28 bg-white rounded-xl" />)}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'published' | 'paused'

export default function ProviderServicesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [services, setServices] = useState<ServiceDoc[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [pendingPause, setPendingPause] = useState<ServiceDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setError(false)
    try {
      const docs = await getProviderServices(user.uid)
      setServices(docs)
    } catch (err) {
      console.error('Services load error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, load])

  const handleToggle = (id: string, newVal: boolean) => {
    const svc = services.find((s) => s.id === id)
    if (!svc) return
    if (!newVal) { setPendingPause(svc); return }
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: 'published' as const } : s))
    toggleServiceStatus(id, true).catch((err) => {
      console.error('toggleServiceStatus failed:', err)
      setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: 'paused' as const } : s))
    })
  }

  const confirmPause = () => {
    if (!pendingPause) return
    const id = pendingPause.id
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: 'paused' as const } : s))
    setPendingPause(null)
    toggleServiceStatus(id, false).catch((err) => {
      console.error('toggleServiceStatus failed:', err)
      setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: 'published' as const } : s))
    })
  }

  const filtered = services.filter((s) => {
    if (filter === 'published') return s.status === 'published'
    if (filter === 'paused') return s.status === 'paused'
    return true
  })

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

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">
      <BottomNav mode="provider" />

      <header className="bg-white border-b border-border-savis px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-brand-primary p-1 -ml-1">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">My Services</h1>
        <button
          onClick={() => router.push('/become-provider/list-service')}
          className="text-[14px] font-semibold text-brand-action"
        >
          + Add
        </button>
      </header>

      <main className="flex-1 px-4 py-4 space-y-3">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'published', 'paused'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[14px] font-medium border transition-colors ${
                filter === f
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-surface-gray text-gray-500 border-border-savis'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-border-savis rounded-xl p-8 text-center">
            <p className="text-[15px] font-semibold text-gray-700 mb-1">
              {services.length === 0 ? 'No services yet' : 'No services in this category'}
            </p>
            {services.length === 0 && (
              <button
                onClick={() => router.push('/become-provider/list-service')}
                className="mt-4 px-5 py-2.5 bg-brand-action text-white rounded-xl text-[14px] font-semibold"
              >
                Add your first service
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                onToggle={handleToggle}
                onEdit={(id) => router.push(`/listing/edit/${id}`)}
              />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={() => router.push('/become-provider/list-service')}
        className="fixed bottom-6 right-4 w-14 h-14 rounded-full bg-brand-action text-white flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition-all z-40"
        aria-label="Add new service"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
          <path d="M10 4v12M4 10h12" />
        </svg>
      </button>

      {pendingPause && (
        <PauseConfirmSheet
          serviceName={pendingPause.name}
          onConfirm={confirmPause}
          onCancel={() => setPendingPause(null)}
        />
      )}
    </div>
  )
}
