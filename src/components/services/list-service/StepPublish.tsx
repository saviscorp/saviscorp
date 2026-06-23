'use client'

import { useRef } from 'react'

export interface ReviewData {
  categoryName: string
  subcategoryName: string
  name: string
  description: string
  serviceMode: string
  location: string
  serviceAddress: string
  durationMin: number
  durationMax: number
  durationUnit: string
  pricingType: string
  price: number
  priceNote: string
}

interface Props {
  review: ReviewData
  photoFiles: File[]
  photoPreviewUrls: string[]
  onPhotosChange: (files: File[], urls: string[]) => void
  publishError: string
}

const MAX_PHOTOS = 5

const MODE_LABELS: Record<string, string> = {
  mobile: 'Mobile (you go to client)',
  in_person: 'In-person (client comes to you)',
  remote: 'Remote / online',
}

const PRICING_LABELS: Record<string, string> = {
  fixed: 'Fixed price',
  per_hour: 'Per hour',
  starting_from: 'Starting from',
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      <span className="text-[13px] text-text-secondary w-28 flex-shrink-0">{label}</span>
      <span className="text-[14px] text-text-primary font-medium flex-1 break-words">{value}</span>
    </div>
  )
}

export default function StepPublish({
  review,
  photoFiles,
  photoPreviewUrls,
  onPhotosChange,
  publishError,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? [])
    if (!incoming.length) return
    const slots = MAX_PHOTOS - photoFiles.length
    const accepted = incoming.slice(0, slots)
    const newUrls = accepted.map((f) => URL.createObjectURL(f))
    onPhotosChange([...photoFiles, ...accepted], [...photoPreviewUrls, ...newUrls])
    // Reset input so the same file can be added after removal
    e.target.value = ''
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photoPreviewUrls[i])
    const newFiles = photoFiles.filter((_, idx) => idx !== i)
    const newUrls = photoPreviewUrls.filter((_, idx) => idx !== i)
    onPhotosChange(newFiles, newUrls)
  }

  const duration = `${review.durationMin}–${review.durationMax} ${review.durationUnit}`
  const location = [
    review.serviceMode ? (MODE_LABELS[review.serviceMode] ?? review.serviceMode) : '',
    review.location && review.serviceMode !== 'remote' ? review.location : '',
    review.serviceAddress || '',
  ]
    .filter(Boolean)
    .join(' · ')

  const pricing = [
    review.pricingType ? (PRICING_LABELS[review.pricingType] ?? review.pricingType) : '',
    review.price ? `KES ${review.price.toLocaleString('en-KE')}` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col gap-6">

      {/* Photo upload */}
      <div>
        <p className="text-[13px] font-medium text-text-primary mb-2">
          Photos{' '}
          <span className="font-normal text-text-secondary">(optional — up to {MAX_PHOTOS})</span>
        </p>

        {photoPreviewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photoPreviewUrls.map((url, i) => (
              <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-surface-gray">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-brand-primary text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={`Remove photo ${i + 1}`}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                    <path d="M1 1l10 10M11 1L1 11" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {photoFiles.length < MAX_PHOTOS && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-[52px] rounded-[10px] border-2 border-dashed border-border text-[14px] font-medium text-text-secondary hover:border-brand-primary/60 hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <path strokeLinecap="round" d="M10 4v12M4 10h12" />
              </svg>
              {photoFiles.length === 0 ? 'Add photos' : 'Add more photos'}
            </button>
          </>
        )}
      </div>

      {/* Review summary */}
      <div>
        <p className="text-[13px] font-medium text-text-primary mb-3">Review your listing</p>
        <div className="bg-white rounded-[10px] border border-border px-4">
          <ReviewRow label="Category" value={[review.categoryName, review.subcategoryName].filter(Boolean).join(' › ')} />
          <ReviewRow label="Service" value={review.name} />
          <ReviewRow label="Description" value={review.description.length > 100 ? review.description.slice(0, 100) + '…' : review.description} />
          <ReviewRow label="Delivery" value={location} />
          <ReviewRow label="Duration" value={duration} />
          <ReviewRow label="Pricing" value={pricing} />
          {review.priceNote && <ReviewRow label="Price note" value={review.priceNote} />}
        </div>
      </div>

      {/* Publish error */}
      {publishError && (
        <div className="rounded-[10px] bg-error-light border border-error/30 px-4 py-3">
          <p className="text-[14px] text-error font-medium">{publishError}</p>
        </div>
      )}

    </div>
  )
}
