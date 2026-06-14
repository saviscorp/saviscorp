'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Image as ImageIcon, ShieldCheck, PencilSimple } from 'phosphor-react'
import ProfileStepLayout from '@/components/onboarding/ProfileStepLayout'
import { auth } from '@/lib/firebase'
import { completeOnboarding } from '@/lib/onboarding'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReviewRowProps {
  label: string
  value: string
  onEdit: () => void
  extraContent?: React.ReactNode
}

// ─── Review row ──────────────────────────────────────────────────────────────

function ReviewRow({ label, value, onEdit, extraContent }: ReviewRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {extraContent}
        <div className="min-w-0">
          <p className="text-[12px] text-text-secondary leading-none mb-0.5">{label}</p>
          <p className="text-[14px] font-semibold text-text-primary truncate">{value}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1 ml-3 px-3 py-1.5 rounded-lg bg-brand-light text-brand-primary text-[12px] font-medium hover:bg-brand-primary/10 transition-colors flex-shrink-0"
      >
        <PencilSimple size={12} />
        Edit
      </button>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  icon: React.ReactNode
  iconBg: string
  title: string
  children: React.ReactNode
}

function SectionCard({ icon, iconBg, title, children }: SectionCardProps) {
  return (
    <div className="rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <span className="text-[15px] font-semibold text-text-primary">{title}</span>
      </div>
      <div className="px-4 pb-2">
        {children}
      </div>
    </div>
  )
}

// ─── Step 4 page ─────────────────────────────────────────────────────────────

export default function ProfileStep4() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // In real implementation these would come from a context/store
  const mockData = {
    fullName:    'Faith Mumbua',
    phone:       '+254 23456789',
    gender:      'Female',
    dob:         '2 Feb 2005',
    hasPhoto:    true,
    photoUrl:    null as string | null,
    docType:     'Passport',
    frontStatus: 'Uploaded ✓',
  }

  async function handleSubmit() {
    setSubmitting(true)
    const uid = auth.currentUser?.uid
    if (uid) await completeOnboarding(uid)
    router.push('/')
  }

  return (
    <ProfileStepLayout currentStep={4}>
      {/* Headline */}
      <h1 className="text-[22px] font-bold text-text-primary leading-snug mb-1">
        Review your details
      </h1>
      <p className="text-[15px] text-text-secondary mb-6 leading-relaxed">
        Everything look right? Tap Edit on any section to make changes.
      </p>

      {/* ── Your details card ── */}
      <SectionCard
        icon={<User size={16} className="text-brand-primary" weight="fill" />}
        iconBg="bg-brand-light"
        title="Your details"
      >
        <ReviewRow
          label="Full name"
          value={mockData.fullName}
          onEdit={() => router.push('/onboarding/profile/step1')}
        />
        <ReviewRow
          label="Phone number"
          value={mockData.phone}
          onEdit={() => router.push('/onboarding/profile/step1')}
        />
        <ReviewRow
          label="Gender"
          value={mockData.gender}
          onEdit={() => router.push('/onboarding/profile/step1')}
        />
        <ReviewRow
          label="Date of birth"
          value={mockData.dob}
          onEdit={() => router.push('/onboarding/profile/step1')}
        />
      </SectionCard>

      {/* ── Profile photo card ── */}
      <SectionCard
        icon={<ImageIcon size={16} className="text-brand-action" weight="fill" />}
        iconBg="bg-action-light"
        title="Profile photo"
      >
        <ReviewRow
          label="Profile photo"
          value="Photo uploaded"
          onEdit={() => router.push('/onboarding/profile/step2')}
          extraContent={
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-surface-gray flex items-center justify-center flex-shrink-0">
              {mockData.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mockData.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-text-secondary" />
              )}
            </div>
          }
        />
      </SectionCard>

      {/* ── Identity card ── */}
      <SectionCard
        icon={<ShieldCheck size={16} className="text-success" weight="fill" />}
        iconBg="bg-success-light"
        title="Identity"
      >
        <ReviewRow
          label="Document type"
          value={mockData.docType}
          onEdit={() => router.push('/onboarding/profile/step3')}
        />
        <ReviewRow
          label="Front of ID"
          value={mockData.frontStatus}
          onEdit={() => router.push('/onboarding/profile/step3')}
        />
      </SectionCard>

      {/* Submit CTA */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-[52px] rounded-[10px] bg-brand-action text-white text-[15px] font-semibold hover:bg-brand-action/90 transition-colors active:scale-[0.98] disabled:opacity-60 mt-2 mb-3"
      >
        {submitting ? 'Submitting…' : 'Save & submit profile'}
      </button>

      <p className="text-center text-[12px] text-text-secondary mb-4">
        You can update your profile at any time from settings.
      </p>
    </ProfileStepLayout>
  )
}
