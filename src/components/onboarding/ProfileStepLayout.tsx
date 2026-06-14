'use client'

import { User, Image as ImageIcon, ShieldCheck, CheckCircle } from 'phosphor-react'

interface ProfileStepLayoutProps {
  currentStep: 1 | 2 | 3 | 4
  children: React.ReactNode
}

const STEPS = [
  { label: 'Your details', icon: User },
  { label: 'Photo',        icon: ImageIcon },
  { label: 'Identity',     icon: ShieldCheck },
  { label: 'Review',       icon: CheckCircle },
]

export default function ProfileStepLayout({ currentStep, children }: ProfileStepLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top nav bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-text-primary hover:bg-surface-gray transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <span className="text-[15px] font-bold text-brand-primary tracking-wide">SAVIS</span>

        <button
          aria-label="Go forward"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-text-primary hover:bg-surface-gray transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      {/* Progress stepper */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-start justify-between max-w-sm mx-auto lg:max-w-md">
          {STEPS.map((step, index) => {
            const stepNum = index + 1
            const isCompleted = stepNum < currentStep
            const isActive = stepNum === currentStep
            const Icon = step.icon

            return (
              <div key={step.label} className="flex flex-col items-center gap-1.5 relative">
                {/* Connector line — rendered between steps */}
                {index < STEPS.length - 1 && (
                  <div
                    className={[
                      'absolute top-[18px] left-[calc(50%+18px)] w-[calc(100vw/4-36px)] lg:w-[80px] h-[2px]',
                      isCompleted ? 'bg-success' : 'bg-border',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                )}

                {/* Step dot */}
                <div
                  className={[
                    'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                    isCompleted
                      ? 'bg-success text-white'
                      : isActive
                      ? 'bg-brand-primary text-white'
                      : 'bg-white border-2 border-border text-text-secondary',
                  ].join(' ')}
                >
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={[
                    'text-[11px] font-medium text-center leading-tight',
                    isCompleted
                      ? 'text-success'
                      : isActive
                      ? 'text-brand-primary font-semibold'
                      : 'text-text-secondary',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Page content */}
      <main className="flex-1 px-5 pt-6 pb-8 max-w-sm mx-auto w-full lg:max-w-xl">
        {children}
      </main>

      {/* Step counter footer */}
      <footer className="pb-6 text-center">
        <p className="text-[13px] text-text-secondary">
          Step {currentStep} of 4 · {STEPS[currentStep - 1].label}
        </p>
      </footer>
    </div>
  )
}
