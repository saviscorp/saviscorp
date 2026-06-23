'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ListingStepLayout from '@/components/listing/ListingStepLayout'
import { useListingForm } from '@/context/ListingFormContext'

const MODES = [
  { id: 'mobile', label: 'Mobile', emoji: '🚗', desc: 'You go to the client' },
  { id: 'in_person', label: 'In-person', emoji: '🏠', desc: 'Client comes to you' },
  { id: 'remote', label: 'Remote', emoji: '💻', desc: 'Online / by phone' },
] as const

const NAIROBI_AREAS = [
  'Nairobi Wide', 'Westlands', 'Kilimani', 'Lavington', 'Karen', 'Kasarani',
  'Eastlands', 'CBD', 'South C', 'Lang\'ata', 'Runda', 'Gigiri', 'Thika Rd',
  'Mombasa Rd', 'Ngong Rd', 'Kiambu Rd',
]

const UNITS = ['minutes', 'hours', 'days'] as const

export default function ListingStep3() {
  const router = useRouter()
  const { data, update } = useListingForm()
  const [errors, setErrors] = useState<{ mode?: string; duration?: string }>({})

  function handleContinue() {
    const errs: typeof errors = {}
    if (!data.serviceMode) errs.mode = 'Please select how you deliver this service.'
    if (data.durationMin < 1) errs.duration = 'Please enter a valid duration.'
    if (data.durationMax < data.durationMin) errs.duration = 'Max duration must be ≥ min duration.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    router.push('/listing/new/step4')
  }

  return (
    <ListingStepLayout currentStep={3} title="How do you deliver this?" subtitle="Help customers understand logistics before booking.">
      {/* Service mode */}
      <div className="mb-6">
        <p className="text-[13px] font-medium text-text-primary mb-2">Service mode</p>
        <div className="space-y-2">
          {MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => { update({ serviceMode: mode.id }); setErrors(e => ({ ...e, mode: undefined })) }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-colors ${
                data.serviceMode === mode.id
                  ? 'border-brand-primary bg-brand-light'
                  : 'border-border bg-white hover:border-brand-primary/40'
              }`}
            >
              <span className="text-xl">{mode.emoji}</span>
              <div>
                <p className={`text-[15px] font-medium ${data.serviceMode === mode.id ? 'text-brand-primary' : 'text-text-primary'}`}>{mode.label}</p>
                <p className="text-[13px] text-text-secondary">{mode.desc}</p>
              </div>
            </button>
          ))}
        </div>
        {errors.mode && <p className="text-[12px] text-error mt-1">{errors.mode}</p>}
      </div>

      {/* Location */}
      {(data.serviceMode === 'mobile' || data.serviceMode === 'in_person') && (
        <div className="mb-6">
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">
            {data.serviceMode === 'mobile' ? 'Areas you serve' : 'Your location'}
          </label>
          <select
            value={data.location}
            onChange={e => update({ location: e.target.value })}
            className="w-full h-[52px] px-3 rounded-[10px] border border-border bg-white text-[15px] text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
          >
            {NAIROBI_AREAS.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          {data.serviceMode === 'in_person' && (
            <div className="mt-2">
              <input
                type="text"
                value={data.serviceAddress}
                onChange={e => update({ serviceAddress: e.target.value })}
                placeholder="Street address or landmark (optional)"
                className="w-full h-[44px] px-4 rounded-[10px] border border-border bg-white text-[14px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
              />
            </div>
          )}
        </div>
      )}

      {/* Duration */}
      <div className="mb-7">
        <p className="text-[13px] font-medium text-text-primary mb-2">Typical duration</p>
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label className="text-[11px] text-text-secondary">Min</label>
            <input
              type="number"
              min={1}
              value={data.durationMin}
              onChange={e => update({ durationMin: Math.max(1, Number(e.target.value)) })}
              className="w-full h-[44px] px-3 rounded-[10px] border border-border bg-white text-[15px] text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            />
          </div>
          <span className="text-text-secondary mt-4">–</span>
          <div className="flex-1">
            <label className="text-[11px] text-text-secondary">Max</label>
            <input
              type="number"
              min={data.durationMin}
              value={data.durationMax}
              onChange={e => update({ durationMax: Math.max(data.durationMin, Number(e.target.value)) })}
              className="w-full h-[44px] px-3 rounded-[10px] border border-border bg-white text-[15px] text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-text-secondary">Unit</label>
            <select
              value={data.durationUnit}
              onChange={e => update({ durationUnit: e.target.value as 'minutes' | 'hours' | 'days' })}
              className="w-full h-[44px] px-2 rounded-[10px] border border-border bg-white text-[14px] text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        {errors.duration && <p className="text-[12px] text-error mt-1">{errors.duration}</p>}
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
