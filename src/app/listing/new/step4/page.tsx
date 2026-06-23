'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import ListingStepLayout from '@/components/listing/ListingStepLayout'
import { useListingForm } from '@/context/ListingFormContext'

const PRICING_TYPES = [
  { id: 'fixed', label: 'Fixed price', desc: 'One set price per booking' },
  { id: 'per_hour', label: 'Per hour', desc: 'Rate × hours worked' },
  { id: 'starting_from', label: 'Starting from', desc: 'Minimum price, varies by scope' },
] as const

const PRICE_LABELS: Record<string, string> = {
  fixed: 'Price (KES)',
  per_hour: 'Hourly rate (KES)',
  starting_from: 'Starting from (KES)',
}

export default function ListingStep4() {
  const router = useRouter()
  const { data, update } = useListingForm()
  const [commissionRate, setCommissionRate] = useState(0.07)
  const [errors, setErrors] = useState<{ type?: string; price?: string }>({})

  useEffect(() => {
    getDoc(doc(db, 'appConfig', 'commission'))
      .then(snap => { if (snap.exists()) setCommissionRate(snap.data().rate ?? 0.07) })
      .catch(() => {})
  }, [])

  const commissionAmount = data.price > 0 ? Math.round(data.price * commissionRate) : 0
  const netEarnings = data.price > 0 ? data.price - commissionAmount : 0

  function handleContinue() {
    const errs: typeof errors = {}
    if (!data.pricingType) errs.type = 'Please select a pricing type.'
    if (!data.price || data.price < 50) errs.price = 'Price must be at least KES 50.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    router.push('/listing/new/step5')
  }

  return (
    <ListingStepLayout currentStep={4} title="Set your price" subtitle="You keep most of what you earn — SAVIS takes a small commission.">
      {/* Pricing type */}
      <div className="mb-6">
        <p className="text-[13px] font-medium text-text-primary mb-2">Pricing type</p>
        <div className="space-y-2">
          {PRICING_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => { update({ pricingType: type.id }); setErrors(e => ({ ...e, type: undefined })) }}
              className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-colors ${
                data.pricingType === type.id
                  ? 'border-brand-primary bg-brand-light'
                  : 'border-border bg-white hover:border-brand-primary/40'
              }`}
            >
              <div>
                <p className={`text-[15px] font-medium ${data.pricingType === type.id ? 'text-brand-primary' : 'text-text-primary'}`}>{type.label}</p>
                <p className="text-[13px] text-text-secondary">{type.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${data.pricingType === type.id ? 'border-brand-primary bg-brand-primary' : 'border-border'}`}>
                {data.pricingType === type.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>
        {errors.type && <p className="text-[12px] text-error mt-1">{errors.type}</p>}
      </div>

      {/* Price input */}
      {data.pricingType && (
        <div className="mb-5">
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">
            {PRICE_LABELS[data.pricingType]}
          </label>
          <div className="flex items-center border border-border rounded-[10px] overflow-hidden focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary">
            <span className="px-4 py-3 bg-surface-gray border-r border-border text-[15px] font-medium text-text-secondary flex-shrink-0">KES</span>
            <input
              type="number"
              min={50}
              value={data.price || ''}
              onChange={e => { update({ price: Number(e.target.value) }); setErrors(er => ({ ...er, price: undefined })) }}
              placeholder="0"
              className="flex-1 h-[52px] px-4 text-[18px] font-semibold text-text-primary bg-white outline-none"
            />
          </div>
          {errors.price && <p className="text-[12px] text-error mt-1">{errors.price}</p>}
        </div>
      )}

      {/* Price note */}
      {data.pricingType && (
        <div className="mb-6">
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">Price note <span className="text-text-secondary font-normal">(optional)</span></label>
          <input
            type="text"
            value={data.priceNote}
            onChange={e => update({ priceNote: e.target.value })}
            placeholder="e.g. Includes all cleaning products · Price varies by house size"
            className="w-full h-[44px] px-4 rounded-[10px] border border-border bg-white text-[14px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
          />
        </div>
      )}

      {/* Commission breakdown */}
      {data.price > 0 && (
        <div className="mb-6 bg-surface-gray rounded-xl p-4 space-y-2">
          <p className="text-[13px] font-medium text-text-secondary uppercase tracking-wide">Earnings breakdown</p>
          <div className="flex justify-between items-center">
            <span className="text-[14px] text-text-primary">Your price</span>
            <span className="text-[14px] font-semibold text-text-primary">KES {data.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[14px] text-text-secondary">SAVIS commission ({Math.round(commissionRate * 100)}%)</span>
            <span className="text-[14px] text-error">− KES {commissionAmount.toLocaleString()}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between items-center">
            <span className="text-[15px] font-semibold text-text-primary">You earn</span>
            <span className="text-[18px] font-bold text-success">KES {netEarnings.toLocaleString()}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleContinue}
        className="w-full h-[52px] rounded-[10px] bg-brand-primary text-white text-[15px] font-semibold hover:bg-brand-dark transition-colors"
      >
        Continue
      </button>
    </ListingStepLayout>
  )
}
