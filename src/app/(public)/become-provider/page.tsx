'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ProfileOnboarding from '@/components/onboarding/ProfileOnboarding'

function BecomeProviderInner() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/become-provider/list-service'
  return <ProfileOnboarding redirectUrl={redirect} />
}

export default function BecomeProviderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-gray flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <BecomeProviderInner />
    </Suspense>
  )
}
