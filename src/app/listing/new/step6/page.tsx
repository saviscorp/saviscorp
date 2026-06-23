'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { PencilSimple, CheckCircle } from 'phosphor-react'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '@/lib/firebase'
import ListingStepLayout from '@/components/listing/ListingStepLayout'
import { useListingForm } from '@/context/ListingFormContext'

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-[12px] text-text-secondary">{label}</p>
        <p className="text-[14px] text-text-primary font-medium mt-0.5">{value || '—'}</p>
      </div>
      <button onClick={onEdit} className="flex items-center gap-1 text-[12px] text-brand-primary px-2 py-1 rounded-lg hover:bg-brand-light transition-colors flex-shrink-0 ml-3">
        <PencilSimple size={12} />Edit
      </button>
    </div>
  )
}

export default function ListingStep6() {
  const router = useRouter()
  const { data, reset } = useListingForm()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [commissionRate, setCommissionRate] = useState(0.07)

  useEffect(() => {
    getDoc(doc(db, 'appConfig', 'commission'))
      .then(snap => { if (snap.exists()) setCommissionRate(snap.data().rate ?? 0.07) })
      .catch(() => {})
  }, [])

  const netEarnings = data.price > 0 ? Math.round(data.price * (1 - commissionRate)) : 0

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    const uid = auth.currentUser?.uid
    if (!uid) { setError('You must be signed in to publish.'); setSubmitting(false); return }

    try {
      // Upload photos to Firebase Storage
      const photoUrls: string[] = []
      for (let i = 0; i < data.photoFiles.length; i++) {
        const file = data.photoFiles[i]
        const storageRef = ref(storage, `services/temp_${uid}_${Date.now()}/photos/${i}_${file.name}`)
        const snap = await uploadBytes(storageRef, file)
        const url = await getDownloadURL(snap.ref)
        photoUrls.push(url)
      }

      // Write service document
      await addDoc(collection(db, 'services'), {
        providerId: uid,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        subcategoryId: data.subcategoryId,
        subcategoryName: data.subcategoryName,
        name: data.name,
        description: data.description,
        serviceMode: data.serviceMode,
        location: data.location,
        serviceAddress: data.serviceAddress,
        durationMin: data.durationMin,
        durationMax: data.durationMax,
        durationUnit: data.durationUnit,
        pricingType: data.pricingType,
        price: data.price,
        priceNote: data.priceNote,
        commissionRate,
        photoUrls,
        status: 'published',
        rating: null,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      reset()
      setSubmitted(true)
    } catch (err) {
      console.error('[Listing step6] publish failed:', err)
      setError('Failed to publish your listing. Please try again.')
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <ListingStepLayout currentStep={6} title="Your listing is live! 🎉">
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center mb-6">
            <CheckCircle size={48} className="text-success" weight="fill" />
          </div>
          <p className="text-[17px] text-text-secondary max-w-xs">
            Customers can now find and book your service on SAVIS.
          </p>
          <button
            onClick={() => router.push('/provider/dashboard')}
            className="mt-8 w-full h-[52px] rounded-[10px] bg-brand-primary text-white text-[15px] font-semibold hover:bg-brand-dark transition-colors"
          >
            Go to my dashboard
          </button>
        </div>
      </ListingStepLayout>
    )
  }

  const modeLabels: Record<string, string> = { mobile: 'Mobile — provider comes to you', in_person: 'In-person — client comes to provider', remote: 'Remote / online' }
  const pricingLabels: Record<string, string> = { fixed: 'Fixed price', per_hour: 'Per hour', starting_from: 'Starting from' }

  return (
    <ListingStepLayout currentStep={6} title="Review your listing" subtitle="Check everything looks right before publishing.">
      {/* Cover photo preview */}
      {data.photoPreviewUrls[0] && (
        <div className="mb-4 rounded-xl overflow-hidden aspect-video bg-surface-gray">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.photoPreviewUrls[0]} alt="Cover photo" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Review sections */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <p className="px-4 pt-4 pb-2 text-[11px] font-medium text-text-secondary uppercase tracking-wide">Service</p>
        <div className="px-4">
          <ReviewRow label="Category" value={`${data.categoryName} › ${data.subcategoryName}`} onEdit={() => router.push('/listing/new/step1')} />
          <ReviewRow label="Title" value={data.name} onEdit={() => router.push('/listing/new/step2')} />
          <ReviewRow label="Description" value={data.description.slice(0, 100) + (data.description.length > 100 ? '…' : '')} onEdit={() => router.push('/listing/new/step2')} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <p className="px-4 pt-4 pb-2 text-[11px] font-medium text-text-secondary uppercase tracking-wide">Logistics</p>
        <div className="px-4">
          <ReviewRow label="Mode" value={modeLabels[data.serviceMode] ?? data.serviceMode} onEdit={() => router.push('/listing/new/step3')} />
          <ReviewRow label="Location" value={data.location} onEdit={() => router.push('/listing/new/step3')} />
          <ReviewRow label="Duration" value={`${data.durationMin}–${data.durationMax} ${data.durationUnit}`} onEdit={() => router.push('/listing/new/step3')} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden mb-4">
        <p className="px-4 pt-4 pb-2 text-[11px] font-medium text-text-secondary uppercase tracking-wide">Pricing</p>
        <div className="px-4">
          <ReviewRow label="Pricing type" value={pricingLabels[data.pricingType] ?? data.pricingType} onEdit={() => router.push('/listing/new/step4')} />
          <ReviewRow label="Price" value={`KES ${data.price.toLocaleString()}`} onEdit={() => router.push('/listing/new/step4')} />
          {data.priceNote && <ReviewRow label="Price note" value={data.priceNote} onEdit={() => router.push('/listing/new/step4')} />}
        </div>
        <div className="mx-4 mb-4 mt-2 bg-success-light rounded-xl p-3 flex justify-between items-center">
          <span className="text-[13px] text-success">You earn per booking</span>
          <span className="text-[16px] font-bold text-success">KES {netEarnings.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
        <p className="px-4 pt-4 pb-2 text-[11px] font-medium text-text-secondary uppercase tracking-wide">Photos</p>
        <div className="px-4 pb-4">
          {data.photoFiles.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
              {data.photoPreviewUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt={`Photo ${i + 1}`} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-text-secondary py-2">No photos added</p>
          )}
        </div>
      </div>

      {error && <p className="text-[13px] text-error bg-error-light px-3 py-2 rounded-lg mb-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-[52px] rounded-[10px] bg-brand-action text-white text-[15px] font-semibold hover:bg-brand-action/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Publishing…</>
        ) : (
          'Publish listing'
        )}
      </button>

      <p className="text-[12px] text-text-secondary text-center mt-3">
        You can edit or unpublish your listing from the dashboard at any time.
      </p>
    </ListingStepLayout>
  )
}
