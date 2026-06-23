'use client'

import Link from 'next/link'
import { MapPin, Star, ShieldCheck } from 'phosphor-react'

export interface ServiceCardProps {
  id: string
  name: string
  providerName: string
  location: string
  price: number
  pricingType: 'fixed' | 'per_hour'
  rating: number | null
  reviewCount: number
  verified: boolean
  photoUrl: string | null
  categoryName: string
  onClick?: () => void
}

export default function ServiceCard({
  id,
  name,
  providerName,
  location,
  price,
  pricingType,
  rating,
  reviewCount,
  verified,
  photoUrl,
  categoryName,
  onClick,
}: ServiceCardProps) {
  const isNew = rating === null && reviewCount === 0

  return (
    <Link
      href={`/services/${id}`}
      onClick={onClick}
      className="block bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover rounded-t-xl"
          />
        ) : (
          <div className="w-full h-full bg-brand-light rounded-t-xl flex items-center justify-center">
            <span className="text-brand-primary text-[13px] font-medium text-center px-2">
              {categoryName}
            </span>
          </div>
        )}

        {/* New badge */}
        {isNew && (
          <span className="absolute top-2 left-2 bg-brand-warm text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
            New
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Service name */}
        <p className="text-[15px] font-bold text-primary leading-snug line-clamp-2">
          {name}
        </p>

        {/* Provider name */}
        <p className="text-[13px] text-secondary mt-0.5">{providerName}</p>

        {/* Verified badge */}
        {verified && (
          <span className="inline-flex items-center gap-1 mt-1 bg-success-light text-success text-[11px] font-medium px-2 py-0.5 rounded-full">
            <ShieldCheck size={12} weight="fill" />
            Verified
          </span>
        )}

        {/* Rating row */}
        {rating !== null && (
          <div className="mt-1 flex items-center gap-1">
            <Star size={14} weight="fill" className="text-brand-gold" />
            <span className="text-[13px] font-medium text-primary">{rating}</span>
            <span className="text-[13px] text-secondary">
              ({reviewCount} reviews)
            </span>
          </div>
        )}

        {/* Price + Location row */}
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className="text-[13px] font-medium text-brand-primary">
            {pricingType === 'fixed'
              ? `From KES ${price.toLocaleString()}`
              : `KES ${price.toLocaleString()}/hr`}
          </span>
          <div className="flex items-center gap-1 min-w-0">
            <MapPin size={12} className="text-secondary flex-shrink-0" />
            <span className="text-[12px] text-secondary truncate">{location}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
