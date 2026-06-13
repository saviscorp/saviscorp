'use client'

import { useState } from 'react'
import Link from 'next/link'
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
  Timer,
  ShieldCheck,
  ArrowCounterClockwise,
  CaretDown,
  CaretUp,
} from 'phosphor-react'
import AuthGateSheet from '@/components/ui/AuthGateSheet'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id: string
  reviewer: string
  rating: number
  date: string
  text: string
}

interface Provider {
  id: string
  name: string
  photo: string | null
  rating: number
  reviews: number
  verified: boolean
  memberSince: number
  responseTime: string
}

interface MockService {
  id: string
  name: string
  category: string
  subcategory: string
  rating: number
  reviewCount: number
  verified: boolean
  priceFrom: number
  duration: string
  mode: string
  description: string
  images: string[]
  provider: Provider
  reviews: Review[]
  location: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SERVICE: MockService = {
  id: '1',
  name: 'Plumbing Repairs',
  category: 'Cleaning',
  subcategory: 'Deep Cleaning',
  rating: 4.9,
  reviewCount: 52,
  verified: true,
  priceFrom: 1500,
  duration: '2–4 hrs',
  mode: 'Mobile',
  location: 'Lavington',
  description:
    'Professional deep cleaning of your home using hospital-grade products. Includes all rooms, kitchen, bathrooms, and windows. All equipment and cleaning materials are provided — you don\'t need to prepare anything.',
  images: [
    '/placeholder-clean-1.jpg',
    '/placeholder-clean-2.jpg',
    '/placeholder-clean-3.jpg',
    '/placeholder-clean-4.jpg',
  ],
  provider: {
    id: 'p1',
    name: 'John M.',
    photo: null,
    rating: 4.9,
    reviews: 36,
    verified: true,
    memberSince: 2022,
    responseTime: '2 hours',
  },
  reviews: [
    { id: 'r1', reviewer: 'David K.', rating: 5, date: '2 days ago', text: 'Amina was thorough and professional. My home has never been cleaner!' },
    { id: 'r2', reviewer: 'Mary W.', rating: 4, date: '1 week ago', text: 'Great service, arrived on time and brought her own equipment.' },
  ],
}

const RATING_BREAKDOWN = [
  { star: 5, pct: 78 },
  { star: 4, pct: 14 },
  { star: 3, pct: 5 },
  { star: 2, pct: 2 },
  { star: 1, pct: 1 },
]

const HIGHLIGHTS = [
  'Hospital-grade products',
  'Equipment provided',
  'All rooms covered',
  'Eco-friendly options',
]

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

// ─── Main page ────────────────────────────────────────────────────────────────

interface ServiceDetailPageProps {
  isAuthenticated?: boolean
}

export default function ServiceDetailPage({ isAuthenticated = false }: ServiceDetailPageProps) {
  const service = MOCK_SERVICE
  const [currentImage, setCurrentImage] = useState(0)
  const [descExpanded, setDescExpanded] = useState(false)
  const [authGateOpen, setAuthGateOpen] = useState(false)

  const handleBook = () => {
    if (!isAuthenticated) {
      setAuthGateOpen(true)
    } else {
      // Navigate to booking flow
    }
  }

  return (
    <>
      {/* ── Auth gate sheet ──────────────────────────────────────────────── */}
      <AuthGateSheet
        isOpen={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        serviceName={service.name}
        servicePrice={service.priceFrom}
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
                  <h1 className="text-[17px] font-semibold text-primary">{service.name}</h1>
                </div>
                <button className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-secondary hover:bg-gray-50">
                  <ShareNetwork size={18} />
                </button>
              </div>

              <div className="aspect-video bg-gray-200 relative overflow-hidden lg:rounded-xl">
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-[13px]">Image {currentImage + 1} of {service.images.length}</span>
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {service.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === currentImage ? 'bg-white w-4' : 'bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 px-4 pt-3 pb-1 overflow-x-auto scrollbar-hide lg:px-0 lg:pt-3">
                {service.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`shrink-0 w-16 h-12 rounded-lg bg-gray-200 overflow-hidden border-2 transition-colors ${
                      i === currentImage ? 'border-brand-primary' : 'border-transparent'
                    }`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-200" />
                  </button>
                ))}
              </div>
            </div>

            {/* ── Service info card ─────────────────────────────────────── */}
            <div className="mx-4 lg:mx-0 mt-4 bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h1 className="text-[22px] font-bold text-primary leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {service.name}
                </h1>
                {service.verified && (
                  <span className="shrink-0 inline-flex items-center gap-1 bg-success-light text-success text-[11px] font-medium px-2.5 py-1 rounded-full mt-1">
                    <CheckCircle weight="fill" size={12} />
                    Verified
                  </span>
                )}
              </div>

              <p className="text-[13px] text-secondary mb-2">
                {service.category} › {service.subcategory}
              </p>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={service.rating} size={14} />
                  <span className="text-[14px] font-semibold text-primary">{service.rating}</span>
                  <button className="text-[13px] text-brand-primary underline underline-offset-2">
                    ({service.reviewCount} reviews)
                  </button>
                </div>
                <div className="flex items-center gap-1 text-[13px] text-secondary">
                  <MapPin size={13} weight="fill" />
                  {service.location}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-brand-light rounded-xl p-3 flex flex-col items-center gap-1">
                  <CurrencyDollar size={18} className="text-brand-primary" />
                  <span className="text-[13px] font-semibold text-primary">KES {service.priceFrom.toLocaleString()}</span>
                  <span className="text-[11px] text-secondary">per session</span>
                </div>
                <div className="bg-[#FFF3E8] rounded-xl p-3 flex flex-col items-center gap-1">
                  <Clock size={18} className="text-brand-warm" />
                  <span className="text-[13px] font-semibold text-primary">{service.duration}</span>
                  <span className="text-[11px] text-secondary">duration</span>
                </div>
                <div className="bg-[#E8F9F3] rounded-xl p-3 flex flex-col items-center gap-1">
                  <NavigationArrow size={18} className="text-success" />
                  <span className="text-[13px] font-semibold text-success">{service.mode}</span>
                  <span className="text-[11px] text-secondary">comes to you</span>
                </div>
              </div>
            </div>

            {/* ── About this service ────────────────────────────────────── */}
            <div className="mx-4 lg:mx-0 mt-3 bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <h2 className="text-[17px] font-semibold text-primary mb-3">About this service</h2>
              <div className={`text-[15px] text-secondary leading-relaxed overflow-hidden transition-all ${descExpanded ? '' : 'line-clamp-3'}`}>
                {service.description}
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

              <div className="mt-4 grid grid-cols-2 gap-2">
                {HIGHLIGHTS.map((h) => (
                  <div key={h} className="flex items-center gap-2 bg-surface-gray rounded-lg px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                    <span className="text-[13px] text-primary">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Provider card ─────────────────────────────────────────── */}
            <div className="mx-4 lg:mx-0 mt-3 bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <h2 className="text-[17px] font-semibold text-primary mb-3">About the provider</h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center shrink-0">
                  <span className="text-[15px] font-semibold text-brand-primary">AW</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-primary">{service.provider.name}</span>
                    {service.provider.verified && (
                      <span className="inline-flex items-center gap-1 bg-success-light text-success text-[11px] font-medium px-2 py-0.5 rounded-full">
                        <CheckCircle weight="fill" size={10} />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StarRating rating={service.provider.rating} size={12} />
                    <span className="text-[13px] text-secondary">
                      {service.provider.rating} · {service.provider.reviews} reviews · Since {service.provider.memberSince}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[13px] text-secondary">
                    <Clock size={13} />
                    Responds within {service.provider.responseTime}
                  </div>
                </div>
              </div>
              <Link
                href={`/providers/${service.provider.id}`}
                className="flex items-center justify-center gap-1.5 w-full h-[44px] border border-brand-primary rounded-[10px] text-[14px] font-semibold text-brand-primary hover:bg-brand-light transition-colors"
              >
                View full profile
                <CaretRight size={14} />
              </Link>
            </div>

            {/* ── Reviews ───────────────────────────────────────────────── */}
            <div className="mx-4 lg:mx-0 mt-3 bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <h2 className="text-[17px] font-semibold text-primary mb-4">Reviews ({service.reviewCount})</h2>

              <div className="bg-gold-light rounded-xl p-4 flex gap-4 mb-4">
                <div className="flex flex-col items-center justify-center shrink-0">
                  <span className="text-[36px] font-bold text-primary leading-none">{service.rating}</span>
                  <StarRating rating={service.rating} size={14} />
                  <span className="text-[12px] text-secondary mt-1">{service.reviewCount} reviews</span>
                </div>
                <div className="flex-1 space-y-1.5">
                  {RATING_BREAKDOWN.map(({ star, pct }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-[12px] text-secondary w-3 shrink-0">{star}</span>
                      <Star size={11} weight="fill" className="text-brand-gold shrink-0" />
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-gold rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {service.reviews.map((review) => (
                  <div key={review.id} className="bg-surface-gray rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <ReviewerAvatar name={review.reviewer} colorClass="bg-brand-light" />
                        <div>
                          <p className="text-[13px] font-semibold text-primary">{review.reviewer}</p>
                          <StarRating rating={review.rating} size={11} />
                        </div>
                      </div>
                      <span className="text-[12px] text-secondary shrink-0">{review.date}</span>
                    </div>
                    <p className="text-[13px] text-secondary leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>

              <button className="mt-4 w-full h-11 border border-border rounded-[10px] text-[14px] font-medium text-brand-primary hover:bg-brand-light transition-colors">
                Show all {service.reviewCount} reviews
              </button>
            </div>

            <div className="h-24" />
          </div>

          {/* ── RIGHT COLUMN (desktop sidebar) ────────────────────────── */}
          <div className="hidden lg:block sticky top-6">
            <div className="bg-brand-primary rounded-xl p-5 mb-4">
              <p className="text-[28px] font-bold text-white leading-none">KES {service.priceFrom.toLocaleString()}</p>
              <p className="text-[13px] text-white/70 mt-1">/session · {service.duration}</p>
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
            <p className="text-[18px] font-bold text-primary">KES {service.priceFrom.toLocaleString()}</p>
            <p className="text-[12px] text-secondary">/session</p>
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
