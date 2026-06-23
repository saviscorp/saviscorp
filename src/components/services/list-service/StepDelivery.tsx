'use client'

export type ServiceMode = 'mobile' | 'in_person' | 'remote' | ''
export type DurationUnit = 'minutes' | 'hours' | 'days'

export interface DeliveryFields {
  serviceMode: ServiceMode
  location: string
  serviceAddress: string
  durationMin: number
  durationMax: number
  durationUnit: DurationUnit
}

export interface DeliveryErrors {
  mode?: string
  duration?: string
}

interface Props {
  fields: DeliveryFields
  onChange: (patch: Partial<DeliveryFields>) => void
  errors: DeliveryErrors
}

const MODES = [
  { id: 'mobile' as const, label: 'Mobile', desc: 'You go to the client' },
  { id: 'in_person' as const, label: 'In-person', desc: 'Client comes to you' },
  { id: 'remote' as const, label: 'Remote / online', desc: 'Online or by phone' },
]

const NAIROBI_AREAS = [
  'Nairobi Wide', 'Westlands', 'Kilimani', 'Lavington', 'Karen', 'Kasarani',
  'Eastlands', 'CBD', 'South C', "Lang'ata", 'Runda', 'Gigiri',
  'Thika Rd', 'Mombasa Rd', 'Ngong Rd', 'Kiambu Rd',
]

const UNITS: DurationUnit[] = ['minutes', 'hours', 'days']

export default function StepDelivery({ fields, onChange, errors }: Props) {
  const showLocation = fields.serviceMode === 'mobile' || fields.serviceMode === 'in_person'

  return (
    <div className="flex flex-col gap-6">

      {/* Service mode */}
      <div>
        <p className="text-[13px] font-medium text-text-primary mb-2">How do you deliver this service?</p>
        <div className="space-y-2">
          {MODES.map((mode) => {
            const active = fields.serviceMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChange({ serviceMode: mode.id })}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-colors ${
                  active
                    ? 'border-brand-primary bg-brand-light'
                    : 'border-border bg-white hover:border-brand-primary/40'
                }`}
              >
                <div className="flex-1">
                  <p className={`text-[15px] font-medium ${active ? 'text-brand-primary' : 'text-text-primary'}`}>
                    {mode.label}
                  </p>
                  <p className="text-[13px] text-text-secondary">{mode.desc}</p>
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
        {errors.mode && <p className="text-[12px] text-error mt-1">{errors.mode}</p>}
      </div>

      {/* Location — only for mobile / in-person */}
      {showLocation && (
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">
            {fields.serviceMode === 'mobile' ? 'Areas you serve' : 'Your location'}
          </label>
          <select
            value={fields.location}
            onChange={(e) => onChange({ location: e.target.value })}
            className="w-full h-[52px] px-3 rounded-[10px] border border-border bg-white text-[15px] text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
          >
            {NAIROBI_AREAS.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          {fields.serviceMode === 'in_person' && (
            <input
              type="text"
              value={fields.serviceAddress}
              onChange={(e) => onChange({ serviceAddress: e.target.value })}
              placeholder="Street address or landmark (optional)"
              className="mt-2 w-full h-[44px] px-4 rounded-[10px] border border-border bg-white text-[14px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            />
          )}
        </div>
      )}

      {/* Duration */}
      <div>
        <p className="text-[13px] font-medium text-text-primary mb-2">Typical duration</p>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-[11px] text-text-secondary mb-1">Min</label>
            <input
              type="number"
              min={1}
              value={fields.durationMin}
              onChange={(e) =>
                onChange({ durationMin: Math.max(1, Number(e.target.value)) })
              }
              className="w-full h-[44px] px-3 rounded-[10px] border border-border bg-white text-[15px] text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            />
          </div>
          <span className="text-text-secondary pb-3">–</span>
          <div className="flex-1">
            <label className="block text-[11px] text-text-secondary mb-1">Max</label>
            <input
              type="number"
              min={fields.durationMin}
              value={fields.durationMax}
              onChange={(e) =>
                onChange({ durationMax: Math.max(fields.durationMin, Number(e.target.value)) })
              }
              className="w-full h-[44px] px-3 rounded-[10px] border border-border bg-white text-[15px] text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] text-text-secondary mb-1">Unit</label>
            <select
              value={fields.durationUnit}
              onChange={(e) => onChange({ durationUnit: e.target.value as DurationUnit })}
              className="w-full h-[44px] px-2 rounded-[10px] border border-border bg-white text-[14px] text-text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
            >
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        {errors.duration && <p className="text-[12px] text-error mt-1">{errors.duration}</p>}
      </div>

    </div>
  )
}
