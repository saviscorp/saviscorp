'use client'

import { useState, useRef } from 'react'
import {
  User,
  Image as ImageIcon,
  ShieldCheck,
  Check,
  Camera,
  UploadSimple,
  ArrowLeft,
  ArrowRight,
} from 'phosphor-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  fullName: string
  phone: string
  gender: 'Male' | 'Female' | 'Prefer not to say' | null
  dobDay: string
  dobMonth: string
  dobYear: string
  photoUrl: string | null
  docType: 'National ID' | 'Passport'
  frontUploaded: boolean
  backUploaded: boolean
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Your details', icon: User },
  { label: 'Photo', icon: ImageIcon },
  { label: 'Identity', icon: ShieldCheck },
  { label: 'Review', icon: Check },
]

function StepIndicator({
  current,
  completed,
}: {
  current: number
  completed: number[]
}) {
  return (
    <div className="flex items-center justify-center gap-0 px-6 py-4">
      {STEPS.map((step, i) => {
        const isDone = completed.includes(i)
        const isActive = current === i

        return (
          <div key={step.label} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDone
                    ? 'bg-success'
                    : isActive
                    ? 'bg-brand-primary'
                    : 'border-2 border-border bg-white'
                }`}
              >
                {isDone ? (
                  <Check size={18} weight="bold" className="text-white" />
                ) : (
                  <step.icon
                    size={18}
                    className={isActive ? 'text-white' : 'text-disabled'}
                  />
                )}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  isDone
                    ? 'text-success'
                    : isActive
                    ? 'text-brand-primary'
                    : 'text-disabled'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 md:w-16 mx-1 mb-5 rounded ${
                  completed.includes(i) ? 'bg-success' : 'bg-border'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Your details ─────────────────────────────────────────────────────

function StepDetails({
  data,
  onChange,
  onNext,
}: {
  data: ProfileData
  onChange: (updates: Partial<ProfileData>) => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[24px] font-bold text-primary font-jakarta">Your details</h1>
        <p className="text-[14px] text-secondary mt-1">
          Tell us a bit about yourself so providers know who they're working with.
        </p>
      </div>

      {/* Full name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-medium text-primary">Full name</label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          placeholder="e.g. Amina Wanjiku"
          className="h-[52px] rounded-[10px] border border-border px-4 text-[15px] text-primary placeholder:text-disabled focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
        />
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-medium text-primary">Phone number</label>
        <div className="flex gap-2">
          <div className="h-[52px] px-3 rounded-[10px] border border-border flex items-center gap-2 bg-white flex-shrink-0">
            <span className="text-[18px]">🇰🇪</span>
            <span className="text-[15px] font-medium text-primary">+254</span>
          </div>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="712 345 678"
            className="flex-1 h-[52px] rounded-[10px] border border-border px-4 text-[15px] text-primary placeholder:text-disabled focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        </div>
        <p className="text-[12px] text-secondary">Used to confirm bookings</p>
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-medium text-primary">Gender</label>
        <div className="flex gap-2">
          {(['Male', 'Female', 'Prefer not to say'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onChange({ gender: g })}
              className={`flex-1 h-[52px] rounded-[10px] border text-[14px] font-medium transition-colors ${
                data.gender === g
                  ? 'border-brand-primary bg-brand-light text-brand-primary'
                  : 'border-border text-primary hover:border-brand-primary/40'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Date of birth */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-medium text-primary">Date of birth</label>
        <div className="flex gap-2">
          {[
            { key: 'dobDay' as const, placeholder: 'DD' },
            { key: 'dobMonth' as const, placeholder: 'MM' },
            { key: 'dobYear' as const, placeholder: 'YYYY' },
          ].map(({ key, placeholder }) => (
            <input
              key={key}
              type="text"
              inputMode="numeric"
              maxLength={key === 'dobYear' ? 4 : 2}
              value={data[key]}
              onChange={(e) => onChange({ [key]: e.target.value })}
              placeholder={placeholder}
              className="flex-1 h-[52px] rounded-[10px] border border-border text-center text-[15px] text-primary placeholder:text-disabled focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          ))}
        </div>
        <p className="text-[12px] text-secondary">You must be 18 or older to use SAVIS</p>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        disabled={!data.fullName || !data.phone}
        className="mt-2 h-[52px] w-full bg-brand-primary text-white rounded-[10px] text-[16px] font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
      >
        Continue
      </button>

      <p className="text-center text-[13px] text-disabled">Step 1 of 4 · Your details</p>
    </div>
  )
}

// ─── Step 2: Photo ────────────────────────────────────────────────────────────

function StepPhoto({
  data,
  onChange,
  onNext,
  onSkip,
}: {
  data: ProfileData
  onChange: (updates: Partial<ProfileData>) => void
  onNext: () => void
  onSkip: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onChange({ photoUrl: url })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[24px] font-bold text-primary font-jakarta">Add a profile photo</h1>
        <p className="text-[14px] text-secondary mt-1">
          A photo helps build trust — providers and customers want to know who they're dealing with.
        </p>
      </div>

      {/* Photo circle */}
      <div className="flex items-center justify-center py-4">
        <div className="w-28 h-28 rounded-full border-2 border-dashed border-border bg-surface-gray flex items-center justify-center overflow-hidden">
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera size={32} className="text-disabled" />
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="h-[52px] w-full bg-brand-action text-white rounded-[10px] text-[16px] font-semibold hover:opacity-90 transition-opacity"
        >
          Upload a photo
        </button>
        <button
          onClick={() => console.log('open camera')}
          className="h-[52px] w-full border border-brand-action text-brand-action rounded-[10px] text-[16px] font-semibold hover:bg-brand-action/5 transition-colors"
        >
          Take a selfie
        </button>
        <button
          onClick={onSkip}
          className="text-[14px] text-secondary hover:text-primary transition-colors text-center py-1"
        >
          Skip for now
        </button>
      </div>

      <p className="text-center text-[13px] text-disabled">Step 2 of 4 · Photo</p>

      {/* Auto-advance if photo selected */}
      {data.photoUrl && (
        <button
          onClick={onNext}
          className="h-[52px] w-full bg-brand-primary text-white rounded-[10px] text-[16px] font-semibold hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      )}
    </div>
  )
}

// ─── Step 3: Identity ─────────────────────────────────────────────────────────

function StepIdentity({
  data,
  onChange,
  onNext,
  onSkip,
}: {
  data: ProfileData
  onChange: (updates: Partial<ProfileData>) => void
  onNext: () => void
  onSkip: () => void
}) {
  const isNationalID = data.docType === 'National ID'

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[24px] font-bold text-primary font-jakarta">Verify your identity</h1>
        <p className="text-[14px] text-secondary mt-1">
          Your ID is used only for verification by the SAVIS team and is never shared.
        </p>
      </div>

      {/* Document type toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[14px] font-medium text-primary">Document type</label>
        <div className="flex gap-2">
          {(['National ID', 'Passport'] as const).map((type) => (
            <button
              key={type}
              onClick={() => onChange({ docType: type, frontUploaded: false, backUploaded: false })}
              className={`flex-1 h-[52px] rounded-[10px] border text-[15px] font-medium transition-colors ${
                data.docType === type
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'border-border text-primary hover:border-brand-primary/40'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Upload zones */}
      <div className="flex flex-col gap-3">
        {/* Front */}
        <UploadZone
          label={isNationalID ? 'Front of ID' : 'Front of ID'}
          uploaded={data.frontUploaded}
          onUpload={() => onChange({ frontUploaded: true })}
        />

        {/* Back — only for National ID */}
        {isNationalID && (
          <UploadZone
            label="Back of ID"
            uploaded={data.backUploaded}
            onUpload={() => onChange({ backUploaded: true })}
          />
        )}
      </div>

      {/* Privacy note */}
      <p className="text-[12px] text-secondary text-center">
        Stored securely · used only for verification ·{' '}
        <span className="text-brand-primary cursor-pointer hover:underline">Privacy Policy</span>
      </p>

      {/* CTA */}
      <button
        onClick={onNext}
        className="h-[52px] w-full bg-brand-primary text-white rounded-[10px] text-[16px] font-semibold hover:opacity-90 transition-opacity"
      >
        Review my profile
      </button>

      <button
        onClick={onSkip}
        className="text-[14px] text-secondary hover:text-primary transition-colors text-center py-1"
      >
        Skip for now
      </button>

      <p className="text-center text-[13px] text-disabled">Step 3 of 4 · Identity</p>
    </div>
  )
}

function UploadZone({
  label,
  uploaded,
  onUpload,
}: {
  label: string
  uploaded: boolean
  onUpload: () => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[14px] font-medium text-primary">{label}</label>
      <button
        onClick={onUpload}
        className={`w-full h-[88px] rounded-[10px] border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
          uploaded
            ? 'border-success bg-success-light'
            : 'border-border bg-surface-gray hover:border-brand-primary/40'
        }`}
      >
        {uploaded ? (
          <div className="flex items-center gap-2 text-success">
            <Check size={16} weight="bold" />
            <span className="text-[14px] font-medium">Uploaded</span>
          </div>
        ) : (
          <>
            <UploadSimple size={22} className="text-secondary" />
            <span className="text-[13px] text-secondary">Tap to upload or take photo</span>
          </>
        )}
      </button>
    </div>
  )
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function StepReview({
  data,
  onEdit,
  onSubmit,
}: {
  data: ProfileData
  onEdit: (step: number) => void
  onSubmit: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[24px] font-bold text-primary font-jakarta">Review your details</h1>
        <p className="text-[14px] text-secondary mt-1">
          Everything look right? Tap Edit on any section to make changes.
        </p>
      </div>

      {/* Your details card */}
      <ReviewSection
        title="Your details"
        icon={User}
        iconBg="bg-brand-light"
        iconColor="text-brand-primary"
        onEdit={() => onEdit(0)}
      >
        <ReviewRow label="Full name" value={data.fullName || '—'} onEdit={() => onEdit(0)} />
        <ReviewRow
          label="Phone number"
          value={data.phone ? `+254 ${data.phone}` : '—'}
          onEdit={() => onEdit(0)}
        />
        <ReviewRow label="Gender" value={data.gender || '—'} onEdit={() => onEdit(0)} />
        <ReviewRow
          label="Date of birth"
          value={
            data.dobDay && data.dobMonth && data.dobYear
              ? `${data.dobDay} ${getMonthName(data.dobMonth)} ${data.dobYear}`
              : '—'
          }
          onEdit={() => onEdit(0)}
          noBorder
        />
      </ReviewSection>

      {/* Profile photo card */}
      <ReviewSection
        title="Profile photo"
        icon={ImageIcon}
        iconBg="bg-pink-50"
        iconColor="text-brand-action"
        onEdit={() => onEdit(1)}
      >
        <div className="flex items-center gap-3 py-2">
          <div className="w-12 h-12 rounded-full bg-surface-gray overflow-hidden flex-shrink-0">
            {data.photoUrl ? (
              <img src={data.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={20} className="text-disabled" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-[12px] text-secondary">Profile photo</p>
            <p className="text-[14px] font-medium text-primary">
              {data.photoUrl ? 'Photo uploaded' : 'No photo added'}
            </p>
          </div>
          <EditButton onClick={() => onEdit(1)} />
        </div>
      </ReviewSection>

      {/* Identity card */}
      <ReviewSection
        title="Identity"
        icon={ShieldCheck}
        iconBg="bg-success-light"
        iconColor="text-success"
        onEdit={() => onEdit(2)}
      >
        <ReviewRow label="Document type" value={data.docType} onEdit={() => onEdit(2)} />
        <ReviewRow
          label="Front of ID"
          value={data.frontUploaded ? 'Uploaded ✓' : 'Not uploaded'}
          onEdit={() => onEdit(2)}
          noBorder
        />
      </ReviewSection>

      {/* Submit */}
      <button
        onClick={onSubmit}
        className="h-[52px] w-full bg-brand-action text-white rounded-[10px] text-[16px] font-semibold hover:opacity-90 transition-opacity"
      >
        Save & submit profile
      </button>

      <p className="text-center text-[12px] text-secondary">
        You can update your profile at any time from settings.
      </p>
      <p className="text-center text-[13px] text-disabled">Step 4 of 4 · Review</p>
    </div>
  )
}

function ReviewSection({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  children,
  onEdit,
}: {
  title: string
  icon: any
  iconBg: string
  iconColor: string
  children: React.ReactNode
  onEdit: () => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className={`flex items-center gap-3 px-4 py-3 ${iconBg}`}>
        <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon size={18} className={iconColor} weight="fill" />
        </div>
        <span className="text-[15px] font-semibold text-primary">{title}</span>
      </div>
      <div className="px-4">{children}</div>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  onEdit,
  noBorder = false,
}: {
  label: string
  value: string
  onEdit: () => void
  noBorder?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${
        !noBorder ? 'border-b border-border' : ''
      }`}
    >
      <div>
        <p className="text-[12px] text-secondary">{label}</p>
        <p className="text-[14px] font-medium text-primary mt-0.5">{value}</p>
      </div>
      <EditButton onClick={onEdit} />
    </div>
  )
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-light text-brand-primary text-[13px] font-medium hover:bg-brand-primary/10 transition-colors flex-shrink-0"
    >
      <span className="text-[12px]">✎</span> Edit
    </button>
  )
}

function getMonthName(month: string): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const m = parseInt(month, 10)
  return months[m - 1] || month
}

// ─── Main ProfileOnboarding component ────────────────────────────────────────

export default function ProfileOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    phone: '',
    gender: null,
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    photoUrl: null,
    docType: 'National ID',
    frontUploaded: false,
    backUploaded: false,
  })

  const updateData = (updates: Partial<ProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...updates }))
  }

  const advance = () => {
    setCompletedSteps((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep]
    )
    setCurrentStep((s) => Math.min(s + 1, 3))
  }

  const goTo = (step: number) => {
    setCurrentStep(step)
  }

  const handleSubmit = () => {
    setCompletedSteps([0, 1, 2, 3])
    setSubmitted(true)
    console.log('Profile submitted', profileData)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-gray flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} weight="bold" className="text-success" />
          </div>
          <h2 className="text-[22px] font-bold text-primary font-jakarta">Profile submitted!</h2>
          <p className="text-[14px] text-secondary mt-2">
            Your profile is under review. We'll notify you once it's verified.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 h-[52px] w-full bg-brand-primary text-white rounded-[10px] text-[16px] font-semibold hover:opacity-90 transition-opacity"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
          disabled={currentStep === 0}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center disabled:opacity-30 hover:bg-surface-gray transition-colors"
        >
          <ArrowLeft size={18} className="text-primary" />
        </button>

        <span className="text-[17px] font-semibold text-brand-primary font-jakarta">SAVIS</span>

        <button
          onClick={() => setCurrentStep((s) => Math.min(s + 1, 3))}
          disabled={currentStep === 3}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center disabled:opacity-30 hover:bg-surface-gray transition-colors"
        >
          <ArrowRight size={18} className="text-primary" />
        </button>
      </div>

      {/* Step indicator */}
      <StepIndicator current={currentStep} completed={completedSteps} />

      {/* Step content */}
      <div className="px-4 pb-12 max-w-lg mx-auto">
        {currentStep === 0 && (
          <StepDetails data={profileData} onChange={updateData} onNext={advance} />
        )}
        {currentStep === 1 && (
          <StepPhoto
            data={profileData}
            onChange={updateData}
            onNext={advance}
            onSkip={advance}
          />
        )}
        {currentStep === 2 && (
          <StepIdentity
            data={profileData}
            onChange={updateData}
            onNext={advance}
            onSkip={advance}
          />
        )}
        {currentStep === 3 && (
          <StepReview data={profileData} onEdit={goTo} onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  )
}
