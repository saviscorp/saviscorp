'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CaretLeft,
  ShareNetwork,
  Star,
  MapPin,
  CheckCircle,
  CurrencyDollar,
  Clock,
  NavigationArrow,
  CaretRight,
  ShieldCheck,
  ArrowCounterClockwise,
  CaretDown,
  CaretUp,
} from 'phosphor-react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuth } from '@/lib/hooks/useAuth'
import AuthGateSheet from '@/components/auth/AuthGateSheet'

// ─── Types & helpers ──────────────────────────────────────────────────────────

interface ServiceData {
  id: string
  service_name: string
  service_description: string
  price: number
  pricing_type: string
  category: string
  subcategory: string
  duration: string
  logistics: string
  service_photos: string[]
  providerId?: string
}

function normaliseService(id: string, raw: Record<string, unknown>): ServiceData {
  const dMin = raw.durationMin as number | undefined
  const dMax = raw.durationMax as number | undefined
  const dUnit = raw.durationUnit as string | undefined
  const computedDuration =
    dMin !== undefined && dMax !== undefined
      ? `${dMin}–${dMax} ${dUnit ?? ''}`.trim()
      : (dUnit ?? '')
  return {
    id,
    service_name: ((raw.service_name ?? raw.name ?? '') as string).trim(),
    service_description: ((raw.service_description ?? raw.description ?? '') as string),
    price: (raw.price ?? 0) as number,
    pricing_type: ((raw.pricing_type ?? raw.pricingType ?? 'per session') as string),
    category: ((raw.category ?? raw.categoryName ?? '') as string),
    subcategory: ((raw.subcategory ?? raw.subcategoryName ?? '') as string),
    duration: ((raw.duration as string | undefined) ?? computedDuration),
    logistics: ((raw.logistics ?? raw.serviceMode ?? '') as string),
    service_photos: ((raw.service_photos ?? raw.photoUrls ?? []) as string[]),
    providerId: (raw.providerId as string | undefined),
  }
}

// ─── Helper components ────────────────────────────────────────────────────────

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          weight={rating >= star ? 'fill' : rating >= star - 0.5 ? 'fill' : 'regular'}
          className={rating >= star - 0.5 ? 'text-brand-gold' : 'text-gray-200'}
        />
      ))}
    </div>
  )
}

function ReviewerAvatar({ name, colorClass }: { name: string; colorClass: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
      <span className="text-[11px] font-semibold text-brand-primary">{initials}</span>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-surface-gray animate-pulse">
      <div className="aspect-video bg-gray-200 lg:rounded-xl" />
      <div className="mx-4 mt-4 bg-white rounded-xl p-4 space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="mx-4 mt-3 bg-white rounded-xl p-4 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [serviceData, setServiceData] = useState<ServiceData | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<'not_found' | 'error' | null>(null)
  const [currentImage, setCurrentImage] = useState(0)
  const [descExpanded, setDescExpanded] = useState(false)
  const [authGateOpen, setAuthGateOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setPageLoading(true)
    setPageError(null)

    getDoc(doc(db, 'services', params.id))
      .then((snap) => {
        if (cancelled) return
        if (!snap.exists()) {
          setPageError('not_found')
        } else {
          setServiceData(normaliseService(snap.id, snap.data() as Record<string, unknown>))
        }
        setPageLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('ServiceDetailPage:', err)
        setPageError('error')
        setPageLoading(false)
      })

    return () => { cancelled = true }
  }, [params.id])

  function handleBook() {
    if (authLoading) return
    if (!user) {
      sessionStorage.setItem('savis_pending_booking', params.id)
      setAuthGateOpen(true)
    } else {
      router.push(`/services/${params.id}/book`)
    }
  }

  async function handleGoogleSignIn() {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
      setAuthGateOpen(false)
      router.push(`/services/${params.id}/book`)
    } catch {
      // user dismissed the popup — stay on page
    }
  }

  if (pageLoading) {
    return <PageSkeleton />
  }

  if (pageError === 'not_found' || !serviceData) {
    return (
      <div className="min-h-screen bg-surface-gray flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-[22px] font-bold text-primary">Service not found</p>
        <p className="text-[15px] text-secondary">This service may have been removed or is no longer available.</p>
        <Link
          href="/"
          className="h-11 px-6 bg-brand-primary text-white rounded-[10px] flex items-center text-[14px] font-semibold hover:opacity-90 transition-opacity"
        >
          Browse all services
        </Link>
      </div>
    )
  }

  if (pageError === 'error') {
    return (
      <div className="min-h-screen bg-surface-gray flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-[22px] font-bold text-primary">Something went wrong</p>
        <p className="text-[15px] text-secondary">Could not load this service. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="h-11 px-6 bg-brand-primary text-white rounded-[10px] text-[14px] font-semibold hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    )
  }

  const sd = serviceData

  return (
    <>
      {/* ── Auth gate sheet ──────────────────────────────────────────────── */}
      <AuthGateSheet
        isOpen={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        variant="booking"
        serviceContext={{ name: sd.service_name, price: sd.price }}
        onCreateAccount={() => router.push('/register')}
        onSignIn={() => router.push(`/login?next=/services/${params.id}`)}
        onGoogleSignIn={handleGoogleSignIn}
      />

      <div className="min-h-screen bg-surface-gray">

        {/* ── Desktop layout wrapper ───────────────────────────────────────── */}
        <div className="lg:max-w-[1180px] lg:mx-auto lg:px-6 lg:py-6 lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:items-start">

          {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
          <div>

            {/* ── Image gallery section ──────────────────────────────────── */}
            <div className="relative bg-gray-100">
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 lg:hidden">
                <Link
                  href="/"
                  className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-[14px] font-medium text-brand-primary shadow-sm"
                >
                  <CaretLeft size={14} />
                  Services
                </Link>
                <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm text-secondary">
                  <ShareNetwork size={18} />
                </button>
              </div>

              <div className="hidden lg:flex items-center justify-between mb-4">
                <Link href="/" className="flex items-center gap-1.5 text-brand-primary text-[14px] font-medium hover:underline">
                  <CaretLeft size={14} />
                  Services
                </Link>
                <div className="flex items-center gap-2">
                  <h1 className="text-[17px] font-semibold text-primary">{sd.service_name}</h1>
                </div>
                <button className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-secondary hover:bg-gray-50">
                  <ShareNetwork size={18} />
                </button>
              </div>

              <div className="aspect-video bg-gray-200 relative overflow-hidden lg:rounded-xl">
                {sd.service_photos.length > 0 ? (
                  <img
                    src={sd.service_photos[currentImage]}
                    alt={sd.service_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-[13px]">No photos yet</span>
                  </div>
                )}
                {sd.service_photos.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {sd.service_photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === currentImage ? 'bg-white w-4' : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {sd.service_photos.length > 1 && (
                <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto scrollbar-hide lg:px-0 lg:pt-3">
                  {sd.service_photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === currentImage ? 'border-brand-primary' : 'border-transparent'
                      }`}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Service info card ─────────────────────────────────────── */}
            <div className="mx-4 lg:mx-0 mt-4 bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h1 className="text-[22px] font-bold text-primary leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {sd.service_name}
                </h1>
              </div>

              {(sd.category || sd.subcategory) && (
                <p className="text-[13px] text-secondary mb-2">
                  {sd.category}{sd.subcategory ? ` › ${sd.subcategory}` : ''}
                </p>
              )}

              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-brand-light rounded-xl p-3 flex flex-col items-center gap-1">
                  <CurrencyDollar size={18} className="text-brand-primary" />
                  <span className="text-[13px] font-semibold text-primary">KES {sd.price.toLocaleString()}</span>
                  <span className="text-[11px] text-secondary">
                    {sd.pricing_type === 'per_hour' ? 'per hour' : sd.pricing_type === 'fixed' ? 'fixed' : sd.pricing_type || 'per session'}
                  </span>
                </div>
                {sd.duration && (
                  <div className="bg-[#FFF3E8] rounded-xl p-3 flex flex-col items-center gap-1">
                    <Clock size={18} className="text-brand-warm" />
                    <span className="text-[13px] font-semibold text-primary">{sd.duration}</span>
                    <span className="text-[11px] text-secondary">duration</span>
                  </div>
                )}
                {sd.logistics && (
                  <div className="bg-[#E8F9F3] rounded-xl p-3 flex flex-col items-center gap-1">
                    <NavigationArrow size={18} className="text-success" />
                    <span className="text-[13px] font-semibold text-success capitalize">{sd.logistics}</span>
                    <span className="text-[11px] text-secondary">How it works</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── About this service ────────────────────────────────────── */}
            <div className="mx-4 lg:mx-0 mt-3 bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <h2 className="text-[17px] font-semibold text-primary mb-3">About this service</h2>
              {sd.service_description ? (
                <>
                  <div className={`text-[15px] text-secondary leading-relaxed overflow-hidden transition-all ${descExpanded ? '' : 'line-clamp-3'}`}>
                    {sd.service_description}
                  </div>
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="mt-2 flex items-center gap-1 text-[13px] text-brand-primary font-medium"
                  >
                    {descExpanded ? (
                      <><CaretUp size={13} /> Show less</>
                    ) : (
                      <><CaretDown size={13} /> Read more</>
                    )}
                  </button>
                </>
              ) : (
                <p className="text-[15px] text-secondary">No description provided.</p>
              )}
            </div>

            {/* ── Provider card ─────────────────────────────────────────── */}
            <div className="mx-4 lg:mx-0 mt-3 bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <h2 className="text-[17px] font-semibold text-primary mb-3">About the provider</h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center shrink-0">
                  <span className="text-[15px] font-semibold text-brand-primary">P</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-primary">SAVIS Provider</span>
                    <span className="inline-flex items-center gap-1 bg-success-light text-success text-[11px] font-medium px-2 py-0.5 rounded-full">
                      <CheckCircle weight="fill" size={10} />
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StarRating rating={5} size={12} />
                  </div>
                </div>
              </div>
              <Link
                href={sd.providerId ? `/providers/${sd.providerId}` : '/'}
                className="flex items-center justify-center gap-1.5 w-full h-[44px] border border-brand-primary rounded-[10px] text-[14px] font-semibold text-brand-primary hover:bg-brand-light transition-colors"
              >
                View full profile
                <CaretRight size={14} />
              </Link>
            </div>

            {/* ── Reviews ───────────────────────────────────────────────── */}
            <div className="mx-4 lg:mx-0 mt-3 bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <h2 className="text-[17px] font-semibold text-primary mb-4">Reviews</h2>
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <ReviewerAvatar name="No Reviews" colorClass="bg-surface-gray" />
                <p className="text-[14px] font-medium text-primary">No reviews yet</p>
                <p className="text-[13px] text-secondary">Be the first to book and leave a review.</p>
              </div>
            </div>

            <div className="h-24" />
          </div>

          {/* ── RIGHT COLUMN (desktop sidebar) ────────────────────────── */}
          <div className="hidden lg:block sticky top-6">
            <div className="bg-brand-primary rounded-xl p-5 mb-4">
              <p className="text-[28px] font-bold text-white leading-none">KES {sd.price.toLocaleString()}</p>
              <p className="text-[13px] text-white/70 mt-1">
                {sd.pricing_type === 'per_hour' ? '/hr' : sd.pricing_type === 'fixed' ? 'fixed' : `/${sd.pricing_type || 'session'}`}
                {sd.duration ? ` · ${sd.duration}` : ''}
              </p>
            </div>

            <button
              onClick={handleBook}
              className="w-full h-[52px] bg-brand-action text-white font-semibold text-[16px] rounded-[10px] hover:bg-brand-action/90 transition-colors mb-4 shadow-sm"
            >
              Book this service
            </button>

            <div className="bg-white rounded-xl border border-border divide-y divide-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3">
                <ShieldCheck size={18} className="text-success shrink-0" />
                <span className="text-[13px] text-secondary">No charge until you confirm</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <NavigationArrow size={18} className="text-brand-warm shrink-0" />
                <span className="text-[13px] text-secondary">Provider comes to your location</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <ArrowCounterClockwise size={18} className="text-brand-primary shrink-0" />
                <span className="text-[13px] text-secondary">Free cancellation · 24h notice</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky bottom CTA (mobile only) ──────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-3 flex items-center justify-between gap-4 z-20 lg:hidden">
          <div>
            <p className="text-[18px] font-bold text-primary">KES {sd.price.toLocaleString()}</p>
            <p className="text-[12px] text-secondary">
              {sd.pricing_type === 'per_hour' ? '/hr' : `/${sd.pricing_type || 'session'}`}
            </p>
          </div>
          <button
            onClick={handleBook}
            className="flex-1 h-[48px] bg-brand-action text-white font-semibold text-[15px] rounded-[10px] hover:bg-brand-action/90 transition-colors"
          >
            Book this service
          </button>
        </div>
      </div>
    </>
  )
}
