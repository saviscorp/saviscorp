'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Image as ImageIcon, ShieldCheck, PencilSimple } from 'phosphor-react'
import ProfileStepLayout from '@/components/onboarding/ProfileStepLayout'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { completeOnboarding } from '@/lib/onboarding'

interface ReviewRowProps {
  label: string
  value: string
  onEdit: () => void
  extraContent?: React.ReactNode
}

function ReviewRow({ label, value, onEdit, extraContent }: ReviewRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {extraContent}
        <div className="min-w-0">
          <p className="text-[12px] text-text-secondary leading-none mb-0.5">{label}</p>
          <p className="text-[14px] font-semibold text-text-primary truncate">{value || '—'}</p>
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

function SectionCard({ icon, iconBg, title, children }: { icon: React.ReactNode; iconBg: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden mb-4">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>{icon}</div>
        <span className="text-[15px] font-semibold text-text-primary">{title}</span>
      </div>
      <div className="px-4 pb-2">{children}</div>
    </div>
  )
}

interface UserData {
  profile?: { fullName?: string; phone?: string; gender?: string; dob?: string }
  photo?: { uploaded?: boolean; url?: string }
  identity?: { docType?: string; frontUploaded?: boolean; backUploaded?: boolean; skipped?: boolean }
}

export default function ProfileStep4() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) { setLoading(false); return }
    getDoc(doc(db, 'users', uid))
      .then(snap => { if (snap.exists()) setUserData(snap.data() as UserData) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit() {
    setSubmitting(true)
    const uid = auth.currentUser?.uid
    if (!uid) { router.push('/'); return }

    await completeOnboarding(uid)

    const snap = await getDoc(doc(db, 'users', uid)).catch(() => null)
    const activeRole = snap?.exists() ? (snap.data() as { activeRole?: string }).activeRole : 'customer'

    const pendingBooking = sessionStorage.getItem('savis_pending_booking')
    if (pendingBooking) {
      sessionStorage.removeItem('savis_pending_booking')
      router.push(`/services/${pendingBooking}/book`)
    } else if (activeRole === 'provider') {
      router.push('/listing/new/step1')
    } else {
      router.push('/')
    }
  }

  const fullName = userData?.profile?.fullName ?? ''
  const phone = userData?.profile?.phone ? `+254 ${userData.profile.phone}` : ''
  const gender = userData?.profile?.gender ?? ''
  const dob = userData?.profile?.dob ?? ''
  const hasPhoto = userData?.photo?.uploaded ?? false
  const photoUrl = userData?.photo?.url ?? null
  const docType = userData?.identity?.docType ?? ''
  const frontUploaded = userData?.identity?.frontUploaded ?? false
  const idSkipped = userData?.identity?.skipped ?? false

  if (loading) {
    return (
      <ProfileStepLayout currentStep={4}>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        </div>
      </ProfileStepLayout>
    )
  }

  return (
    <ProfileStepLayout currentStep={4}>
      <h1 className="text-[22px] font-bold text-text-primary leading-snug mb-1">Review your details</h1>
      <p className="text-[15px] text-text-secondary mb-6 leading-relaxed">
        Everything look right? Tap Edit on any section to make changes.
      </p>

      <SectionCard
        icon={<User size={16} className="text-brand-primary" weight="fill" />}
        iconBg="bg-brand-light"
        title="Your details"
      >
        <ReviewRow label="Full name" value={fullName} onEdit={() => router.push('/onboarding/profile/step1')} />
        <ReviewRow label="Phone number" value={phone} onEdit={() => router.push('/onboarding/profile/step1')} />
        <ReviewRow label="Gender" value={gender} onEdit={() => router.push('/onboarding/profile/step1')} />
        <ReviewRow label="Date of birth" value={dob} onEdit={() => router.push('/onboarding/profile/step1')} />
      </SectionCard>

      <SectionCard
        icon={<ImageIcon size={16} className="text-brand-action" weight="fill" />}
        iconBg="bg-action-light"
        title="Profile photo"
      >
        <ReviewRow
          label="Profile photo"
          value={hasPhoto ? 'Photo uploaded' : 'No photo added'}
          onEdit={() => router.push('/onboarding/profile/step2')}
          extraContent={
            <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-surface-gray flex items-center justify-center flex-shrink-0">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-text-secondary" />
              )}
            </div>
          }
        />
      </SectionCard>

      <SectionCard
        icon={<ShieldCheck size={16} className="text-success" weight="fill" />}
        iconBg="bg-success-light"
        title="Identity"
      >
        {idSkipped ? (
          <ReviewRow label="Identity verification" value="Skipped" onEdit={() => router.push('/onboarding/profile/step3')} />
        ) : (
          <>
            {docType && <ReviewRow label="Document type" value={docType} onEdit={() => router.push('/onboarding/profile/step3')} />}
            <ReviewRow
              label={docType === 'Passport' ? 'Photo page' : 'Front of ID'}
              value={frontUploaded ? 'Uploaded ✓' : 'Not uploaded'}
              onEdit={() => router.push('/onboarding/profile/step3')}
            />
          </>
        )}
      </SectionCard>

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
