'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileStepLayout from '@/components/onboarding/ProfileStepLayout'
import { auth, db } from '@/lib/firebase'
import { updateDoc, doc } from 'firebase/firestore'

type Gender = 'Male' | 'Female' | 'Prefer not to say'

export default function ProfileStep1() {
  const router = useRouter()

  const [fullName, setFullName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [gender, setGender]       = useState<Gender | null>(null)
  const [day, setDay]             = useState('')
  const [month, setMonth]         = useState('')
  const [year, setYear]           = useState('')
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ]
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 18 - i)

  function validate(): boolean {
    const next: Record<string, string> = {}

    if (fullName.trim().length < 2)
      next.fullName = 'Please enter your full name (at least 2 characters).'

    if (!/^\d{9,10}$/.test(phone.replace(/\s/g, '')))
      next.phone = 'Enter a valid Kenyan mobile number.'

    if (!gender)
      next.gender = 'Please select your gender.'

    if (!day || !month || !year)
      next.dob = 'Please complete your date of birth.'
    else {
      const dob = new Date(Number(year), months.indexOf(month), Number(day))
      const minAge = new Date()
      minAge.setFullYear(minAge.getFullYear() - 18)
      if (dob > minAge)
        next.dob = 'You must be 18 or older to use SAVIS.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleContinue() {
    if (!validate()) return
    setSubmitting(true)
    const uid = auth.currentUser?.uid
    if (uid) {
      const mm = String(months.indexOf(month) + 1).padStart(2, '0')
      const dd = String(Number(day)).padStart(2, '0')
      await updateDoc(doc(db, 'users', uid), {
        'profile.fullName': fullName.trim(),
        'profile.phone': phone.trim(),
        'profile.gender': gender,
        'profile.dob': `${year}-${mm}-${dd}`,
        onboardingStep: 2,
      }).catch(() => {})
    }
    router.push('/onboarding/profile/step2')
  }

  const genderOptions: Gender[] = ['Male', 'Female', 'Prefer not to say']

  return (
    <ProfileStepLayout currentStep={1}>
      {/* Headline */}
      <h1 className="text-[22px] font-bold text-text-primary leading-snug mb-1">
        Your details
      </h1>
      <p className="text-[15px] text-text-secondary mb-6 leading-relaxed">
        Tell us a bit about yourself so providers know who they're working with.
      </p>

      {/* Full name */}
      <div className="mb-5">
        <label htmlFor="fullName" className="block text-[13px] font-medium text-text-primary mb-1.5">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="e.g. Amina Wanjiku"
          minLength={2}
          className={[
            'w-full h-[52px] px-4 rounded-[10px] border text-[15px] text-text-primary',
            'placeholder:text-text-secondary bg-white outline-none',
            'focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors',
            errors.fullName ? 'border-error' : 'border-border',
          ].join(' ')}
        />
        {errors.fullName && (
          <p className="text-[12px] text-error mt-1">{errors.fullName}</p>
        )}
      </div>

      {/* Phone number */}
      <div className="mb-5">
        <label htmlFor="phone" className="block text-[13px] font-medium text-text-primary mb-1.5">
          Phone number
        </label>
        <div
          className={[
            'flex h-[52px] rounded-[10px] border overflow-hidden',
            'focus-within:ring-2 focus-within:ring-brand-primary/30 focus-within:border-brand-primary transition-colors',
            errors.phone ? 'border-error' : 'border-border',
          ].join(' ')}
        >
          <div className="flex items-center gap-1.5 px-3 bg-surface-gray border-r border-border flex-shrink-0 select-none">
            <span className="text-[18px]" aria-label="Kenya flag">🇰🇪</span>
            <span className="text-[14px] font-medium text-text-primary">+254</span>
          </div>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/[^0-9\s]/g, ''))}
            placeholder="712 345 678"
            className="flex-1 h-full px-3 text-[15px] text-text-primary placeholder:text-text-secondary bg-white outline-none"
          />
        </div>
        {errors.phone ? (
          <p className="text-[12px] text-error mt-1">{errors.phone}</p>
        ) : (
          <p className="text-[12px] text-text-secondary mt-1">Used to confirm bookings</p>
        )}
      </div>

      {/* Gender */}
      <div className="mb-5">
        <p className="text-[13px] font-medium text-text-primary mb-1.5">Gender</p>
        <div className="flex gap-2">
          {genderOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setGender(option)}
              className={[
                'flex-1 h-[44px] rounded-[10px] border text-[13px] font-medium transition-colors',
                gender === option
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-white text-text-primary border-border hover:border-brand-primary/40',
              ].join(' ')}
            >
              {option}
            </button>
          ))}
        </div>
        {errors.gender && (
          <p className="text-[12px] text-error mt-1">{errors.gender}</p>
        )}
      </div>

      {/* Date of birth */}
      <div className="mb-7">
        <p className="text-[13px] font-medium text-text-primary mb-1.5">Date of birth</p>
        <div className="flex gap-2">
          <select
            aria-label="Day"
            value={day}
            onChange={e => setDay(e.target.value)}
            className={[
              'flex-1 h-[52px] px-2 rounded-[10px] border text-[14px] text-text-primary bg-white outline-none',
              'focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors',
              errors.dob ? 'border-error' : 'border-border',
            ].join(' ')}
          >
            <option value="" disabled>Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            aria-label="Month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className={[
              'flex-[2] h-[52px] px-2 rounded-[10px] border text-[14px] text-text-primary bg-white outline-none',
              'focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors',
              errors.dob ? 'border-error' : 'border-border',
            ].join(' ')}
          >
            <option value="" disabled>Month</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            aria-label="Year"
            value={year}
            onChange={e => setYear(e.target.value)}
            className={[
              'flex-[1.2] h-[52px] px-2 rounded-[10px] border text-[14px] text-text-primary bg-white outline-none',
              'focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-colors',
              errors.dob ? 'border-error' : 'border-border',
            ].join(' ')}
          >
            <option value="" disabled>Year</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {errors.dob ? (
          <p className="text-[12px] text-error mt-1">{errors.dob}</p>
        ) : (
          <p className="text-[12px] text-text-secondary mt-1">You must be 18 or older to use SAVIS</p>
        )}
      </div>

      {/* Continue CTA */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={submitting}
        className="w-full h-[52px] rounded-[10px] bg-brand-primary text-white text-[15px] font-semibold hover:bg-brand-dark transition-colors active:scale-[0.98] disabled:opacity-60"
      >
        {submitting ? 'Saving…' : 'Continue'}
      </button>
    </ProfileStepLayout>
  )
}
