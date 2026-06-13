'use client'

import Link from 'next/link'
import { MapPin, CheckCircle } from 'phosphor-react'

export interface Service {
  id: string
  name: string
  provider: string
  location: string
  price: number
  rating: number
  reviews: number
  verified: boolean
  category: string
  imageUrl?: string
}

interface ServiceCardProps {
  service: Service
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star
        const partial = !filled && rating >= star - 0.5
        return (
          <span key={star} className="relative inline-block w-3.5 h-3.5">
            <svg viewBox="0 0 14 14" className="w-full h-full text-gray-200" fill="currentColor">
              <path d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625.59-3.44L2 4.635l3.455-.505z" />
            </svg>
            <svg
              viewBox="0 0 14 14"
              className="absolute inset-0 w-full h-full text-brand-gold"
              fill="currentColor"
              style={partial ? { clipPath: 'inset(0 50% 0 0)' } : filled ? {} : { display: 'none' }}
            >
              <path d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625.59-3.44L2 4.635l3.455-.505z" />
            </svg>
          </span>
        )
      })}
    </div>
  )
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link href={`/services/${service.id}`} className="block group">
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden border border-border hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow duration-200">
        <div className="aspect-video bg-gray-100 overflow-hidden relative">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-light to-gray-100" />
          )}
        </div>

        <div className="p-3">
          <h3 className="text-[15px] font-semibold text-primary leading-tight mb-0.5 line-clamp-1">
            {service.name}
          </h3>
          <p className="text-[13px] text-secondary mb-1.5">{service.provider}</p>

          {service.verified && (
            <div className="flex items-center gap-1 mb-1.5">
              <span className="inline-flex items-center gap-1 bg-success-light text-success text-[11px] font-medium px-2 py-0.5 rounded-full">
                <CheckCircle weight="fill" size={11} />
                Verified
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 mb-2">
            <StarRating rating={service.rating} />
            <span className="text-[13px] font-medium text-primary">{service.rating.toFixed(1)}</span>
            <span className="text-[13px] text-secondary">({service.reviews})</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-brand-action">
              From KES {service.price.toLocaleString()}
            </span>
            <span className="flex items-center gap-0.5 text-[12px] text-secondary">
              <MapPin size={11} weight="fill" />
              {service.location}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
