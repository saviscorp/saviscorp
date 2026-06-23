'use client'

export interface StepDetailsErrors {
  name?: string
  description?: string
}

interface StepDetailsProps {
  name: string
  description: string
  onChange: (field: 'name' | 'description', value: string) => void
  errors: StepDetailsErrors
}

export default function StepDetails({ name, description, onChange, errors }: StepDetailsProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Service title */}
      <div>
        <label className="block text-[13px] font-medium text-text-primary mb-1.5">
          Service title{' '}
          <span className="font-normal text-text-secondary">(5–80 characters)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange('name', e.target.value.slice(0, 80))}
          placeholder="e.g. Professional Home Deep Cleaning"
          className={`w-full h-[52px] px-4 rounded-[10px] border text-[15px] text-text-primary placeholder:text-text-secondary bg-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors ${
            errors.name ? 'border-error' : 'border-border'
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.name ? (
            <p className="text-[12px] text-error">{errors.name}</p>
          ) : (
            <span />
          )}
          <p className="text-[12px] text-text-secondary">{name.length}/80</p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-[13px] font-medium text-text-primary mb-1.5">
          Description{' '}
          <span className="font-normal text-text-secondary">(30–800 characters)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onChange('description', e.target.value.slice(0, 800))}
          placeholder="Describe what you do, what's included, your experience, and anything clients should know before booking."
          rows={6}
          className={`w-full px-4 py-3 rounded-[10px] border text-[15px] text-text-primary placeholder:text-text-secondary bg-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors resize-none ${
            errors.description ? 'border-error' : 'border-border'
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-[12px] text-error">{errors.description}</p>
          ) : (
            <span />
          )}
          <p className="text-[12px] text-text-secondary">{description.length}/800</p>
        </div>
      </div>
    </div>
  )
}
