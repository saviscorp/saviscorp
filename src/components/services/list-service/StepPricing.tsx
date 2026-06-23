'use client'

export type PricingType = 'fixed' | 'per_hour' | 'starting_from' | ''

export interface PricingFields {
  pricingType: PricingType
  price: number
  priceNote: string
}

export interface PricingErrors {
  type?: string
  price?: string
}

interface Props {
  fields: PricingFields
  onChange: (patch: Partial<PricingFields>) => void
  errors: PricingErrors
  commissionRate: number | null
}

const PRICING_TYPES = [
  { id: 'fixed' as const, label: 'Fixed price', desc: 'One set price for the whole job' },
  { id: 'per_hour' as const, label: 'Per hour', desc: 'Billed by the hour' },
  { id: 'starting_from' as const, label: 'Starting from', desc: 'Price varies by job scope' },
]

export default function StepPricing({ fields, onChange, errors, commissionRate }: Props) {
  const priceParsed = Number(fields.price) || 0
  const commission = commissionRate !== null ? Math.round(priceParsed * commissionRate) : null
  const earnings = commission !== null ? priceParsed - commission : null

  return (
    <div className="flex flex-col gap-6">

      {/* Pricing model */}
      <div>
        <p className="text-[13px] font-medium text-text-primary mb-2">Pricing model</p>
        <div className="space-y-2">
          {PRICING_TYPES.map((type) => {
            const active = fields.pricingType === type.id
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onChange({ pricingType: type.id })}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-colors ${
                  active
                    ? 'border-brand-primary bg-brand-light'
                    : 'border-border bg-white hover:border-brand-primary/40'
                }`}
              >
                <div className="flex-1">
                  <p className={`text-[15px] font-medium ${active ? 'text-brand-primary' : 'text-text-primary'}`}>
                    {type.label}
                  </p>
                  <p className="text-[13px] text-text-secondary">{type.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  active ? 'border-brand-primary bg-brand-primary' : 'border-border'
                }`}>
                  {active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>
        {errors.type && <p className="text-[12px] text-error mt-1">{errors.type}</p>}
      </div>

      {/* Price input */}
      <div>
        <label className="block text-[13px] font-medium text-text-primary mb-1.5">
          Price (KES)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium text-text-secondary pointer-events-none">
            KES
          </span>
          <input
            type="number"
            min={50}
            value={fields.price === 0 ? '' : fields.price}
            onChange={(e) => onChange({ price: Number(e.target.value) || 0 })}
            placeholder="0"
            className={`w-full h-[52px] pl-14 pr-4 rounded-[10px] border text-[15px] text-text-primary placeholder:text-text-secondary bg-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors ${
              errors.price ? 'border-error' : 'border-border'
            }`}
          />
        </div>
        {errors.price && <p className="text-[12px] text-error mt-1">{errors.price}</p>}
      </div>

      {/* Earnings breakdown */}
      {priceParsed >= 50 && commissionRate !== null && (
        <div className="rounded-[10px] border border-border bg-surface-gray p-4 space-y-2.5">
          <div className="flex justify-between text-[14px]">
            <span className="text-text-secondary">Your listing price</span>
            <span className="font-medium text-text-primary">
              KES {priceParsed.toLocaleString('en-KE')}
            </span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-text-secondary">
              SAVIS commission ({Math.round(commissionRate * 100)}%)
            </span>
            <span className="text-text-secondary">
              − KES {commission!.toLocaleString('en-KE')}
            </span>
          </div>
          <div className="border-t border-border pt-2.5 flex justify-between">
            <span className="text-[15px] font-semibold text-text-primary">You earn</span>
            <span className="text-[15px] font-bold text-success">
              KES {earnings!.toLocaleString('en-KE')}
            </span>
          </div>
        </div>
      )}

      {/* Price note */}
      <div>
        <label className="block text-[13px] font-medium text-text-primary mb-1.5">
          Price note{' '}
          <span className="font-normal text-text-secondary">(optional)</span>
        </label>
        <input
          type="text"
          value={fields.priceNote}
          onChange={(e) => onChange({ priceNote: e.target.value.slice(0, 120) })}
          placeholder="e.g. Price varies by property size"
          className="w-full h-[44px] px-4 rounded-[10px] border border-border bg-white text-[14px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
        />
        <p className="text-[12px] text-text-secondary mt-1 text-right">
          {fields.priceNote.length}/120
        </p>
      </div>

    </div>
  )
}
