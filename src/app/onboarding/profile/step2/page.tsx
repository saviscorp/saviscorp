'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, PencilSimple } from 'phosphor-react'
import ProfileStepLayout from '@/components/onboarding/ProfileStepLayout'
import { auth, db } from '@/lib/firebase'
import { updateDoc, doc } from 'firebase/firestore'

export default function ProfileStep2() {
  const router = useRouter()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const uploadInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 800
        let { width, height } = img
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = ''
  }

  async function advanceToStep3() {
    setSubmitting(true)
    const uid = auth.currentUser?.uid
    if (uid) {
      await updateDoc(doc(db, 'users', uid), {
        'photo.uploaded': !!previewUrl,
        'photo.url': '',
        onboardingStep: 3,
      }).catch(() => {})
    }
    router.push('/onboarding/profile/step3')
  }

  return (
    <ProfileStepLayout currentStep={2}>
      {/* Hidden file inputs */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onInputChange}
      />
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={onInputChange}
      />

      {/* Headline */}
      <h1 className="text-[22px] font-bold text-text-primary leading-snug mb-1">
        Add a profile photo
      </h1>
      <p className="text-[15px] text-text-secondary mb-8 leading-relaxed">
        A photo helps build trust — providers and customers want to know who they're dealing with.
      </p>

      {/* Photo circle */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          {previewUrl ? (
            <>
              <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Your profile photo"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                aria-label="Change photo"
                onClick={() => uploadInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-md hover:bg-brand-dark transition-colors"
              >
                <PencilSimple size={14} weight="bold" />
              </button>
            </>
          ) : (
            <button
              aria-label="Choose a photo"
              onClick={() => uploadInputRef.current?.click()}
              className="w-[120px] h-[120px] rounded-full border-2 border-dashed border-border flex items-center justify-center bg-surface-gray hover:border-brand-primary/50 transition-colors group"
            >
              <Camera
                size={36}
                className="text-text-secondary group-hover:text-brand-primary/60 transition-colors"
              />
            </button>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          className="w-full h-[52px] rounded-[10px] bg-brand-action text-white text-[15px] font-semibold hover:bg-brand-action/90 transition-colors active:scale-[0.98]"
        >
          Upload a photo
        </button>

        <button
          type="button"
          onClick={() => selfieInputRef.current?.click()}
          className="md:hidden w-full h-[52px] rounded-[10px] border border-brand-primary text-brand-primary text-[15px] font-semibold hover:bg-brand-primary/5 transition-colors active:scale-[0.98]"
        >
          Take a selfie
        </button>

        <button
          type="button"
          onClick={advanceToStep3}
          disabled={submitting}
          className="text-[14px] text-text-secondary hover:text-text-primary transition-colors py-2 text-center disabled:opacity-60"
        >
          {submitting ? 'Saving…' : 'Skip for now'}
        </button>
      </div>

      {/* Continue if photo selected */}
      {previewUrl && (
        <div className="mt-5">
          <button
            type="button"
            onClick={advanceToStep3}
            disabled={submitting}
            className="w-full h-[52px] rounded-[10px] bg-brand-primary text-white text-[15px] font-semibold hover:bg-brand-dark transition-colors active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Continue'}
          </button>
        </div>
      )}
    </ProfileStepLayout>
  )
}
