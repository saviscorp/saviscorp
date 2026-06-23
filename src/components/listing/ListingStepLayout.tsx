'use client'

import { useRouter } from 'next/navigation'

const STEPS = ['Category', 'Details', 'Logistics', 'Pricing', 'Photos', 'Review']

interface ListingStepLayoutProps {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  title: string
  subtitle?: string
}

export default function ListingStepLayout({ currentStep, children, title, subtitle }: ListingStepLayoutProps) {
  const router = useRouter()
  const progress = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100)

  function goBack() {
    if (currentStep === 1) router.push('/')
    else router.push(`/listing/new/step${currentStep - 1}`)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-white z-10">
        <button
          onClick={goBack}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-text-primary hover:bg-surface-gray transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[15px] font-bold text-brand-primary tracking-wide">List a service</span>
        <span className="text-[13px] text-text-secondary">{currentStep}/{STEPS.length}</span>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-border">
        <div
          className="h-full bg-brand-action transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step chips */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide border-b border-border">
        {STEPS.map((step, i) => {
          const stepNum = i + 1
          const isActive = stepNum === currentStep
          const isDone = stepNum < currentStep
          return (
            <span
              key={step}
              className={`text-[12px] px-3 py-1 rounded-full flex-shrink-0 ${
                isActive ? 'bg-brand-primary text-white'
                : isDone ? 'bg-success-light text-success'
                : 'bg-surface-gray text-text-secondary'
              }`}
            >
              {isDone ? '✓ ' : ''}{step}
            </span>
          )
        })}
      </div>

      {/* Page content */}
      <main className="flex-1 px-5 pt-6 pb-8 max-w-[480px] mx-auto w-full lg:max-w-xl">
        <h1 className="text-[22px] font-bold text-text-primary mb-1">{title}</h1>
        {subtitle && <p className="text-[15px] text-text-secondary mb-6">{subtitle}</p>}
        {children}
      </main>
    </div>
  )
}
