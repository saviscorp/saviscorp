'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ListingStepLayout from '@/components/listing/ListingStepLayout'
import { useListingForm } from '@/context/ListingFormContext'

export default function ListingStep2() {
  const router = useRouter()
  const { data, update } = useListingForm()
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})

  function handleContinue() {
    const errs: typeof errors = {}
    if (data.name.trim().length < 5) errs.name = 'Service name must be at least 5 characters.'
    if (data.description.trim().length < 30) errs.description = 'Description must be at least 30 characters.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    router.push('/listing/new/step3')
  }

  return (
    <ListingStepLayout currentStep={2} title="Name your service" subtitle="Give your service a clear, specific title.">
      <div className="mb-5">
        <label className="block text-[13px] font-medium text-text-primary mb-1.5">
          Service title <span className="text-text-secondary font-normal">(5–80 characters)</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={e => update({ name: e.target.value.slice(0, 80) })}
          placeholder="e.g. Professional Home Deep Cleaning"
          className={`w-full h-[52px] px-4 rounded-[10px] border text-[15px] text-text-primary placeholder:text-text-secondary bg-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors ${errors.name ? 'border-error' : 'border-border'}`}
        />
        <div className="flex justify-between mt-1">
          {errors.name ? <p className="text-[12px] text-error">{errors.name}</p> : <span />}
          <p className="text-[12px] text-text-secondary">{data.name.length}/80</p>
        </div>
      </div>

      <div className="mb-7">
        <label className="block text-[13px] font-medium text-text-primary mb-1.5">
          Description <span className="text-text-secondary font-normal">(30–800 characters)</span>
        </label>
        <textarea
          value={data.description}
          onChange={e => update({ description: e.target.value.slice(0, 800) })}
          placeholder="Describe what you do, what's included, your experience, and anything clients should know before booking."
          rows={6}
          className={`w-full px-4 py-3 rounded-[10px] border text-[15px] text-text-primary placeholder:text-text-secondary bg-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors resize-none ${errors.description ? 'border-error' : 'border-border'}`}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? <p className="text-[12px] text-error">{errors.description}</p> : <span />}
          <p className="text-[12px] text-text-secondary">{data.description.length}/800</p>
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full h-[52px] rounded-[10px] bg-brand-primary text-white text-[15px] font-semibold hover:bg-brand-dark transition-colors"
      >
        Continue
      </button>
    </ListingStepLayout>
  )
}
