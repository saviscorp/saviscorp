'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, auth } from '@/lib/firebase'

import StepCategory, {
  type CategoryItem,
  type SubcategoryItem,
  type CategorySelection,
} from '@/components/services/list-service/StepCategory'
import StepDetails, {
  type StepDetailsErrors,
} from '@/components/services/list-service/StepDetails'
import StepDelivery, {
  type DeliveryFields,
  type DeliveryErrors,
} from '@/components/services/list-service/StepDelivery'
import StepPricing, {
  type PricingFields,
  type PricingErrors,
} from '@/components/services/list-service/StepPricing'
import StepPublish, {
  type ReviewData,
} from '@/components/services/list-service/StepPublish'

// ─── Form shape ────────────────────────────────────────────────────────────────

interface FormData {
  category: CategoryItem | null
  subcategory: SubcategoryItem | null
  name: string
  description: string
  serviceMode: DeliveryFields['serviceMode']
  location: string
  serviceAddress: string
  durationMin: number
  durationMax: number
  durationUnit: DeliveryFields['durationUnit']
  pricingType: PricingFields['pricingType']
  price: number
  priceNote: string
  photoFiles: File[]
  photoPreviewUrls: string[]
}

const DEFAULT_FORM: FormData = {
  category: null,
  subcategory: null,
  name: '',
  description: '',
  serviceMode: '',
  location: 'Nairobi Wide',
  serviceAddress: '',
  durationMin: 1,
  durationMax: 2,
  durationUnit: 'hours',
  pricingType: '',
  price: 0,
  priceNote: '',
  photoFiles: [],
  photoPreviewUrls: [],
}

const TOTAL_STEPS = 5

const STEP_META: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: 'What service do you offer?',
    subtitle: 'Choose the category that best fits your service.',
  },
  2: {
    title: 'Name your service',
    subtitle: 'Give your service a clear, specific title.',
  },
  3: {
    title: 'How do you deliver this?',
    subtitle: 'Help customers understand logistics before booking.',
  },
  4: {
    title: 'Set your price',
    subtitle: 'You keep most of what you earn — SAVIS takes a small commission.',
  },
  5: {
    title: 'Almost there',
    subtitle: 'Add photos and review your listing before publishing.',
  },
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
    >
      <path d="M12 4l-6 6 6 6" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListServicePage() {
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM)

  // Per-step validation errors
  const [detailErrors, setDetailErrors] = useState<StepDetailsErrors>({})
  const [deliveryErrors, setDeliveryErrors] = useState<DeliveryErrors>({})
  const [pricingErrors, setPricingErrors] = useState<PricingErrors>({})

  // Commission rate fetched from Firestore once (used in Step 4 preview + publish write)
  const [commissionRate, setCommissionRate] = useState<number | null>(null)

  // Publish state
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [published, setPublished] = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'appConfig', 'commission'))
      .then((snap) => {
        setCommissionRate(snap.exists() ? ((snap.data().rate as number) ?? 0.15) : 0.15)
      })
      .catch(() => setCommissionRate(0.15))
  }, [])

  // ── can continue ──────────────────────────────────────────────────────────────

  function canContinue(): boolean {
    if (step === 1) return !!formData.category && !!formData.subcategory
    if (step === 2) return formData.name.trim().length >= 5 && formData.description.trim().length >= 30
    if (step === 3) return formData.serviceMode !== '' && formData.durationMin >= 1
    if (step === 4) return formData.pricingType !== '' && formData.price >= 50
    if (step === 5) return true
    return false
  }

  // ── back ─────────────────────────────────────────────────────────────────────

  function handleBack() {
    if (step === 1) router.push('/dashboard/provider')
    else setStep((s) => s - 1)
  }

  // ── continue / publish ────────────────────────────────────────────────────────

  function handleContinue() {
    if (step === 1) { setStep(2); return }

    if (step === 2) {
      const errs: StepDetailsErrors = {}
      if (formData.name.trim().length < 5) errs.name = 'Service name must be at least 5 characters.'
      if (formData.description.trim().length < 30) errs.description = 'Description must be at least 30 characters.'
      setDetailErrors(errs)
      if (Object.keys(errs).length) return
      setStep(3)
      return
    }

    if (step === 3) {
      const errs: DeliveryErrors = {}
      if (!formData.serviceMode) errs.mode = 'Please select how you deliver this service.'
      if (formData.durationMin < 1) errs.duration = 'Duration must be at least 1.'
      setDeliveryErrors(errs)
      if (Object.keys(errs).length) return
      setStep(4)
      return
    }

    if (step === 4) {
      const errs: PricingErrors = {}
      if (!formData.pricingType) errs.type = 'Please select a pricing model.'
      if (formData.price < 50) errs.price = 'Minimum price is KES 50.'
      setPricingErrors(errs)
      if (Object.keys(errs).length) return
      setStep(5)
      return
    }

    if (step === 5) { void handlePublish() }
  }

  // ── publish ───────────────────────────────────────────────────────────────────

  async function handlePublish() {
    const uid = auth.currentUser?.uid
    if (!uid) {
      setPublishError('You must be signed in to publish a listing.')
      return
    }
    setPublishing(true)
    setPublishError('')
    try {
      // Upload photos sequentially; no photos is fine
      const photoUrls: string[] = []
      for (let i = 0; i < formData.photoFiles.length; i++) {
        const file = formData.photoFiles[i]
        const storageRef = ref(
          storage,
          `services/temp_${uid}_${Date.now()}/photos/${i}_${file.name}`
        )
        const snap = await uploadBytes(storageRef, file)
        photoUrls.push(await getDownloadURL(snap.ref))
      }

      await addDoc(collection(db, 'services'), {
        providerId: uid,
        categoryId: formData.category?.id ?? '',
        categoryName: formData.category?.name ?? '',
        subcategoryId: formData.subcategory?.id ?? '',
        subcategoryName: formData.subcategory?.name ?? '',
        name: formData.name,
        description: formData.description,
        serviceMode: formData.serviceMode,
        location: formData.location,
        serviceAddress: formData.serviceAddress,
        durationMin: formData.durationMin,
        durationMax: formData.durationMax,
        durationUnit: formData.durationUnit,
        pricingType: formData.pricingType,
        price: formData.price,
        priceNote: formData.priceNote,
        commissionRate: commissionRate ?? 0.15,
        photoUrls,
        status: 'published',
        rating: null,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setPublished(true)
    } catch (err) {
      console.error('[list-service] publish failed:', err)
      setPublishError('Failed to publish. Please try again.')
      setPublishing(false)
    }
  }

  // ── field update helpers ──────────────────────────────────────────────────────

  function handleCategorySelection(sel: CategorySelection) {
    setFormData((p) => ({ ...p, category: sel.category, subcategory: sel.subcategory }))
  }

  function handleDetailChange(field: 'name' | 'description', value: string) {
    setFormData((p) => ({ ...p, [field]: value }))
    if (detailErrors[field]) setDetailErrors((p) => ({ ...p, [field]: undefined }))
  }

  function handleDeliveryChange(patch: Partial<DeliveryFields>) {
    setFormData((p) => ({ ...p, ...patch }))
    if ('serviceMode' in patch && deliveryErrors.mode)
      setDeliveryErrors((p) => ({ ...p, mode: undefined }))
    if (('durationMin' in patch || 'durationMax' in patch) && deliveryErrors.duration)
      setDeliveryErrors((p) => ({ ...p, duration: undefined }))
  }

  function handlePricingChange(patch: Partial<PricingFields>) {
    setFormData((p) => ({ ...p, ...patch }))
    if ('pricingType' in patch && pricingErrors.type)
      setPricingErrors((p) => ({ ...p, type: undefined }))
    if ('price' in patch && pricingErrors.price)
      setPricingErrors((p) => ({ ...p, price: undefined }))
  }

  function handlePhotosChange(files: File[], urls: string[]) {
    setFormData((p) => ({ ...p, photoFiles: files, photoPreviewUrls: urls }))
  }

  // ── success screen ────────────────────────────────────────────────────────────

  if (published) {
    return (
      <div className="min-h-screen bg-surface-gray flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center mb-6">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-success"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-[24px] font-bold text-text-primary mb-2">Listing published!</h1>
        <p className="text-[15px] text-text-secondary mb-8 max-w-xs leading-relaxed">
          <span className="font-semibold text-text-primary">{formData.name}</span> is now live and
          visible to customers.
        </p>
        <button
          onClick={() => router.push('/dashboard/provider')}
          className="w-full max-w-xs h-[52px] rounded-[10px] bg-brand-action text-white text-[15px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          View my services
        </button>
        <button
          onClick={() => {
            setPublished(false)
            setStep(1)
            setFormData(DEFAULT_FORM)
          }}
          className="mt-4 text-[14px] text-text-secondary hover:text-brand-primary transition-colors"
        >
          List another service
        </button>
      </div>
    )
  }

  const meta = STEP_META[step] ?? { title: '', subtitle: '' }

  const reviewData: ReviewData = {
    categoryName: formData.category?.name ?? '',
    subcategoryName: formData.subcategory?.name ?? '',
    name: formData.name,
    description: formData.description,
    serviceMode: formData.serviceMode,
    location: formData.location,
    serviceAddress: formData.serviceAddress,
    durationMin: formData.durationMin,
    durationMax: formData.durationMax,
    durationUnit: formData.durationUnit,
    pricingType: formData.pricingType,
    price: formData.price,
    priceNote: formData.priceNote,
  }

  return (
    <div className="min-h-screen bg-surface-gray flex flex-col">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-border sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-border text-text-primary hover:bg-surface-gray transition-colors flex-shrink-0"
        >
          <BackIcon />
        </button>
        <span className="text-[16px] font-bold text-brand-primary tracking-wide">
          List a service
        </span>
        <span className="text-[13px] font-medium text-text-secondary">
          Step {step} of {TOTAL_STEPS}
        </span>
      </header>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-border">
        <div
          className="h-full bg-brand-action transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 px-4 pt-6 pb-32 max-w-2xl mx-auto w-full">
        <h1 className="text-[22px] font-bold text-text-primary mb-1">{meta.title}</h1>
        <p className="text-[15px] text-text-secondary mb-6">{meta.subtitle}</p>

        {/* Step 1 — always mounted to preserve Firestore data and selection state */}
        <div className={step !== 1 ? 'hidden' : ''}>
          <StepCategory onSelectionChange={handleCategorySelection} />
        </div>

        {step === 2 && (
          <StepDetails
            name={formData.name}
            description={formData.description}
            onChange={handleDetailChange}
            errors={detailErrors}
          />
        )}

        {step === 3 && (
          <StepDelivery
            fields={{
              serviceMode: formData.serviceMode,
              location: formData.location,
              serviceAddress: formData.serviceAddress,
              durationMin: formData.durationMin,
              durationMax: formData.durationMax,
              durationUnit: formData.durationUnit,
            }}
            onChange={handleDeliveryChange}
            errors={deliveryErrors}
          />
        )}

        {step === 4 && (
          <StepPricing
            fields={{
              pricingType: formData.pricingType,
              price: formData.price,
              priceNote: formData.priceNote,
            }}
            onChange={handlePricingChange}
            errors={pricingErrors}
            commissionRate={commissionRate}
          />
        )}

        {step === 5 && (
          <StepPublish
            review={reviewData}
            photoFiles={formData.photoFiles}
            photoPreviewUrls={formData.photoPreviewUrls}
            onPhotosChange={handlePhotosChange}
            publishError={publishError}
          />
        )}
      </main>

      {/* ── Continue / Publish button ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleContinue}
            disabled={!canContinue() || publishing}
            className={`w-full h-[52px] rounded-[10px] bg-brand-action text-white text-[15px] font-semibold transition-all flex items-center justify-center gap-2 ${
              canContinue() && !publishing
                ? 'hover:opacity-90 active:scale-[0.98]'
                : 'opacity-40 cursor-not-allowed'
            }`}
          >
            {publishing && <Spinner />}
            {step === 5 ? (publishing ? 'Publishing…' : 'Publish listing') : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
