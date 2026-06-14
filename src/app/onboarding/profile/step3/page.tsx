'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadSimple, CheckCircle } from 'phosphor-react'
import ProfileStepLayout from '@/components/onboarding/ProfileStepLayout'
import { auth, db } from '@/lib/firebase'
import { updateDoc, doc } from 'firebase/firestore'

type DocType = 'National ID' | 'Passport' | 'Driving licence'

interface UploadBoxProps {
  label: string
  helperText?: string
  uploaded: boolean
  onSelect: (file: File) => void
}

function UploadBox({ label, helperText, uploaded, onSelect }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onSelect(file)
    e.target.value = ''
  }

  return (
    <div className="mb-4">
      <label className="block text-[13px] font-medium text-text-primary mb-1.5">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={[
          'w-full aspect-video rounded-[10px] border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
          uploaded
            ? 'bg-success-light border-success/30'
            : 'bg-surface-gray border-border hover:border-brand-primary/40',
        ].join(' ')}
      >
        {uploaded ? (
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-success" weight="fill" />
            <span className="text-[14px] font-medium text-success">Uploaded</span>
          </div>
        ) : (
          <>
            <UploadSimple size={24} className="text-text-secondary" />
            <span className="text-[13px] text-text-secondary">Tap to upload or take photo</span>
          </>
        )}
      </button>
      {helperText && (
        <p className="text-[12px] text-text-secondary mt-1">{helperText}</p>
      )}
    </div>
  )
}

export default function ProfileStep3() {
  const router = useRouter()
  const [docType, setDocType] = useState<DocType>('National ID')
  const [frontUploaded, setFrontUploaded] = useState(false)
  const [backUploaded, setBackUploaded]   = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const docTypes: DocType[] = ['National ID', 'Passport']

  async function handleReview() {
    setSubmitting(true)
    const uid = auth.currentUser?.uid
    if (uid) {
      await updateDoc(doc(db, 'users', uid), {
        'identity.docType': docType,
        'identity.frontUploaded': frontUploaded,
        'identity.backUploaded': backUploaded,
        'identity.skipped': false,
        onboardingStep: 4,
      }).catch(() => {})
    }
    router.push('/onboarding/profile/step4')
  }

  async function handleSkip() {
    setSubmitting(true)
    const uid = auth.currentUser?.uid
    if (uid) {
      await updateDoc(doc(db, 'users', uid), {
        'identity.skipped': true,
        onboardingStep: 4,
      }).catch(() => {})
    }
    router.push('/')
  }

  return (
    <ProfileStepLayout currentStep={3}>
      {/* Headline */}
      <h1 className="text-[22px] font-bold text-text-primary leading-snug mb-1">
        Verify your identity
      </h1>
      <p className="text-[15px] text-text-secondary mb-6 leading-relaxed">
        Your ID is used only for verification by the SAVIS team and is never shared.
      </p>

      {/* Document type selector */}
      <div className="mb-5">
        <p className="text-[13px] font-medium text-text-primary mb-2">Document type</p>
        <div className="flex gap-2">
          {docTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setDocType(type)}
              className={[
                'flex-1 h-[44px] rounded-[10px] border text-[13px] font-medium transition-colors',
                docType === type
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-white text-text-primary border-border hover:border-brand-primary/40',
              ].join(' ')}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Front of ID */}
      <UploadBox
        label={docType === 'Passport' ? 'Photo page' : 'Front of ID'}
        uploaded={frontUploaded}
        onSelect={() => setFrontUploaded(true)}
      />

      {/* Back of ID — hidden when Passport selected */}
      {docType !== 'Passport' && (
        <UploadBox
          label="Back of ID"
          uploaded={backUploaded}
          onSelect={() => setBackUploaded(true)}
          helperText="Not required for passport"
        />
      )}

      {/* Consent + privacy link */}
      <p className="text-[12px] text-text-secondary text-center mt-2 mb-6 leading-relaxed">
        Stored securely · used only for verification ·{' '}
        <a href="/privacy" className="text-brand-primary hover:underline font-medium">
          Privacy Policy
        </a>
      </p>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={handleReview}
        disabled={submitting}
        className="w-full h-[52px] rounded-[10px] bg-brand-primary text-white text-[15px] font-semibold hover:bg-brand-dark transition-colors active:scale-[0.98] disabled:opacity-60 mb-3"
      >
        {submitting ? 'Saving…' : 'Review my profile'}
      </button>

      {/* Skip */}
      <button
        type="button"
        onClick={handleSkip}
        disabled={submitting}
        className="w-full text-center text-[14px] text-text-secondary hover:text-text-primary transition-colors py-2 disabled:opacity-60"
      >
        Skip for now
      </button>
    </ProfileStepLayout>
  )
}
