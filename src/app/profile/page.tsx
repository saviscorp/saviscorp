'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Gear,
  Star,
  ShieldCheck,
  Clock,
  Info,
  XCircle,
  Eye,
  EyeSlash,
  CheckCircle,
  CircleNotch,
  ArrowsLeftRight,
  EnvelopeSimple,
} from 'phosphor-react'
import { signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { clearAuthCookies } from '@/lib/session'
import { useAuth } from '@/lib/hooks/useAuth'
import ProfileRow from '@/components/profile/ProfileRow'
import { RoleToggle } from '@/components/ui'
import { updateActiveRole } from '@/lib/firebase/providers'
import { hasAnyServices } from '@/lib/firebase/services'

type VerificationStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected' | 'resubmitted'

interface FirestoreUser {
  profile?: { fullName?: string; phone?: string; gender?: string; dob?: string }
  photo?: { uploaded?: boolean; url?: string }
  identity?: { docType?: string }
  verificationStatus?: VerificationStatus
  verificationNote?: string
  activeRole?: 'customer' | 'requestor' | 'provider'
  rating?: number | null
  ratingCount?: number
  createdAt?: { toDate?: () => Date }
}

function formatMemberSince(createdAt: FirestoreUser['createdAt']): string {
  if (!createdAt?.toDate) return ''
  try {
    return createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

function getPasswordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length === 0) return 0
  if (password.length < 8) return 1
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  if (hasUpper && hasNumber) return 3
  return 2
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password)
  const segments = [
    strength >= 1 ? (strength === 1 ? 'bg-error' : strength === 2 ? 'bg-brand-warm' : 'bg-success') : 'bg-border',
    strength >= 2 ? (strength === 2 ? 'bg-brand-warm' : 'bg-success') : 'bg-border',
    strength >= 3 ? 'bg-success' : 'bg-border',
    strength >= 3 ? 'bg-success' : 'bg-border',
  ]
  return (
    <div className="flex gap-1 mt-2">
      {segments.map((cls, i) => (
        <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${cls}`} />
      ))}
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  showStrength,
  confirmValue,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  showStrength?: boolean
  confirmValue?: string
}) {
  const [visible, setVisible] = useState(false)
  const isConfirm = confirmValue !== undefined
  const matches = isConfirm && value.length > 0 && value === confirmValue

  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-secondary block">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[52px] px-4 pr-12 rounded-[10px] border border-border bg-white text-[15px] text-primary focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {isConfirm && matches && (
            <CheckCircle size={16} className="text-success" weight="fill" />
          )}
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-secondary hover:text-primary transition-colors focus:outline-none"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeSlash size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      {showStrength && <PasswordStrengthBar password={value} />}
    </div>
  )
}

function ChangePasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) { setCurrent(''); setNext(''); setConfirm(''); setSaving(false) }
  }, [open])

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => { setSaving(false); onClose() }, 1500)
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-[rgba(58,7,57,0.55)] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Change password"
        className={`fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-[20px] px-6 pt-2 pb-10 transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="h-1 w-9 bg-border rounded-full mx-auto mb-6 mt-2" />
        <h2 className="text-[20px] font-bold text-primary mb-6">Change password</h2>
        <div className="space-y-4">
          <PasswordField label="Current password" value={current} onChange={setCurrent} />
          <PasswordField label="New password" value={next} onChange={setNext} showStrength />
          <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} confirmValue={next} />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full h-[52px] bg-brand-action text-white text-[15px] font-medium rounded-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
        >
          {saving ? <><CircleNotch size={16} className="animate-spin" />Saving…</> : 'Save changes'}
        </button>
        <p onClick={onClose} className="text-[14px] text-secondary text-center mt-3 cursor-pointer hover:text-primary transition-colors">
          Cancel
        </p>
      </div>
    </>
  )
}

function VerificationCard({ status, docType, note }: { status: VerificationStatus; docType: string; note?: string }) {
  const router = useRouter()

  if (status === 'verified') {
    return (
      <>
        <ProfileRow label="Status" valueNode={
          <span className="inline-flex items-center gap-1 bg-success-light text-success text-[13px] font-medium px-2 py-0.5 rounded-full">
            <ShieldCheck size={14} />Verified
          </span>
        } />
        <ProfileRow label="Document" value={docType || 'National ID'} isLast />
      </>
    )
  }

  if (status === 'pending' || status === 'resubmitted') {
    return (
      <div className="mx-4 my-3 bg-gold-light rounded-xl p-3 flex items-start gap-2">
        <Clock size={16} className="text-warning mt-0.5 flex-shrink-0" />
        <p className="text-[13px] text-warning leading-snug">Your documents are under review. Usually within 24 hours.</p>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <>
        <ProfileRow label="Status" valueNode={
          <span className="inline-flex items-center gap-1 bg-error-light text-error text-[13px] font-medium px-2 py-0.5 rounded-full">
            Unsuccessful
          </span>
        } />
        <ProfileRow label="Document" value={docType || 'National ID'} />
        {note && (
          <div className="mx-4 my-3 bg-error-light rounded-xl p-3 flex items-start gap-2">
            <XCircle size={16} className="text-error mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-error leading-snug">{note}</p>
          </div>
        )}
        <div className="px-4 pb-4">
          <button
            onClick={() => router.push('/onboarding/profile/step3')}
            className="w-full h-10 bg-brand-action text-white text-[14px] rounded-[10px] hover:opacity-90 transition-opacity"
          >
            Resubmit documents
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mx-4 my-3 bg-brand-light rounded-xl p-3 flex items-start gap-2">
        <Info size={16} className="text-brand-primary mt-0.5 flex-shrink-0" />
        <p className="text-[13px] text-brand-primary leading-snug">
          Add your ID to get verified — it builds trust with providers and customers.
        </p>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={() => router.push('/onboarding/profile/step3')}
          className="w-full h-10 border border-brand-primary text-brand-primary text-[14px] rounded-[10px] hover:bg-brand-light transition-colors"
        >
          Verify your identity
        </button>
      </div>
    </>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-secondary">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [firestoreUser, setFirestoreUser] = useState<FirestoreUser | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [showPasswordSheet, setShowPasswordSheet] = useState(false)
  const [roleToggleLoading, setRoleToggleLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid))
      .then(snap => { if (snap.exists()) setFirestoreUser(snap.data() as FirestoreUser) })
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [user])

  const handleRoleChange = async (role: 'requestor' | 'provider') => {
    if (!user || roleToggleLoading) return
    setRoleToggleLoading(true)
    try {
      await updateActiveRole(user.uid, role)
      setFirestoreUser((prev) => prev ? { ...prev, activeRole: role } : prev)
      if (role === 'provider') {
        const servicesExist = await hasAnyServices(user.uid)
        if (!servicesExist) {
          sessionStorage.setItem('savis_provider_intent', 'true')
        }
        router.push('/provider/dashboard')
      }
    } catch (err) {
      console.error('updateActiveRole error:', err)
    } finally {
      setRoleToggleLoading(false)
    }
  }

  async function handleSignOut() {
    await signOut(auth)
    clearAuthCookies()
    router.push('/')
  }

  if (authLoading || loadingProfile) {
    return <div className="min-h-screen bg-surface-gray flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
    </div>
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const fullName = firestoreUser?.profile?.fullName || user.displayName || ''
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || (user.email?.[0] ?? 'U').toUpperCase()

  const email = user.email ?? ''
  const phone = firestoreUser?.profile?.phone ?? ''
  const gender = firestoreUser?.profile?.gender ?? ''
  const dob = firestoreUser?.profile?.dob ?? ''
  const photoUrl = firestoreUser?.photo?.url || user.photoURL || null
  const verificationStatus: VerificationStatus = firestoreUser?.verificationStatus ?? 'not_submitted'
  const docType = firestoreUser?.identity?.docType ?? ''
  const verificationNote = firestoreUser?.verificationNote
  const rawRole = firestoreUser?.activeRole ?? 'customer'
  const activeRole: 'requestor' | 'provider' =
    rawRole === 'provider' ? 'provider' : 'requestor'
  const rating = firestoreUser?.rating ?? null
  const ratingCount = firestoreUser?.ratingCount ?? 0
  const memberSince = formatMemberSince(firestoreUser?.createdAt)
  const isVerified = verificationStatus === 'verified'

  return (
    <div className="min-h-screen bg-surface-gray pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-border sticky top-0 z-40">
        <div className="w-6" />
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[17px] font-medium text-primary">My Profile</span>
          <span className="inline-flex items-center gap-1 bg-brand-primary text-white text-[11px] font-medium px-3 py-1 rounded-full">
            <ArrowsLeftRight size={12} />
            {activeRole === 'provider' ? 'Provider mode' : 'Requestor mode'}
          </span>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="text-secondary hover:text-primary transition-colors focus:outline-none"
          aria-label="Settings"
        >
          <Gear size={24} />
        </button>
      </header>

      {/* Role toggle */}
      <div className="px-4 pt-4 max-w-[600px] mx-auto">
        <RoleToggle
          value={activeRole}
          onChange={handleRoleChange}
        />
        {roleToggleLoading && (
          <p className="text-[12px] text-center text-gray-400 mt-1">Switching mode…</p>
        )}
      </div>

      <div className="max-w-[600px] mx-auto lg:max-w-[960px]">
        <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-6 lg:px-6 lg:pt-6">
          {/* LEFT COLUMN */}
          <div className="lg:space-y-4">
            {/* Profile Hero */}
            <div className="bg-brand-light px-8 py-6 lg:rounded-xl lg:shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <div className="lg:flex lg:items-center lg:gap-5 lg:text-left">
                <div className={`h-20 w-20 rounded-full flex-shrink-0 mx-auto lg:mx-0 relative flex items-center justify-center bg-brand-primary ${isVerified ? 'ring-2 ring-success ring-offset-2' : ''}`}>
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt={fullName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-[22px] font-bold">{initials}</span>
                  )}
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <p className="text-[20px] font-bold text-primary mt-3 lg:mt-0">{fullName || 'Your Name'}</p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-2">
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 bg-success-light text-success text-[13px] font-medium px-3 py-1 rounded-full">
                        <ShieldCheck size={14} />Verified
                      </span>
                    )}
                    {ratingCount >= 3 && rating ? (
                      <span className="flex items-center gap-1.5">
                        <Star size={16} className="text-yellow-500" weight="fill" />
                        <span className="text-[15px] font-medium text-primary">{rating}</span>
                        <span className="text-secondary">·</span>
                        <span className="text-[15px] text-secondary">{ratingCount} reviews</span>
                      </span>
                    ) : (
                      <span className="text-[15px] text-secondary italic">New member</span>
                    )}
                  </div>
                  {memberSince && <p className="text-[13px] text-secondary mt-1">Member since {memberSince}</p>}
                  <button
                    onClick={() => router.push('/profile/edit')}
                    className="mt-3 h-9 px-6 border border-brand-primary text-brand-primary text-[14px] rounded-[10px] hover:bg-white transition-colors"
                  >
                    Edit profile
                  </button>
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="mx-4 lg:mx-0 mt-4 lg:mt-0">
              <p className="px-1 pt-1 pb-2 text-[11px] font-medium text-secondary uppercase tracking-[0.08em]">Personal details</p>
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <ProfileRow label="Email" value={email} />
                {phone && <ProfileRow label="Phone" value={phone} tappable onClick={() => router.push('/profile/edit')} />}
                {gender && <ProfileRow label="Gender" value={gender} />}
                {dob && <ProfileRow label="Date of birth" value={dob} />}
                <ProfileRow label="Change password" isAction tappable onClick={() => setShowPasswordSheet(true)} isLast />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-0 lg:space-y-4">
            {/* Identity Verification */}
            <div className="mx-4 lg:mx-0 mt-3 lg:mt-0">
              <p className="px-1 pt-1 pb-2 text-[11px] font-medium text-secondary uppercase tracking-[0.08em]">Identity verification</p>
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <VerificationCard status={verificationStatus} docType={docType} note={verificationNote} />
              </div>
            </div>

            {/* Legal */}
            <div className="mx-4 lg:mx-0 mt-3 lg:mt-0">
              <p className="px-1 pt-1 pb-2 text-[11px] font-medium text-secondary uppercase tracking-[0.08em]">Legal</p>
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <ProfileRow label="Terms of Service" externalLink tappable onClick={() => window.open('/terms', '_blank')} />
                <ProfileRow label="Privacy Policy" externalLink tappable onClick={() => window.open('/privacy', '_blank')} isLast />
              </div>
            </div>

            {/* Help & Support */}
            <div className="mx-4 lg:mx-0 mt-3 lg:mt-0">
              <p className="px-1 pt-1 pb-2 text-[11px] font-medium text-secondary uppercase tracking-[0.08em]">Help &amp; Support</p>
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push('/help')}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push('/help') } }}
                  className="h-[52px] flex items-center justify-between px-4 cursor-pointer hover:bg-surface-gray transition-colors focus:outline-none focus:bg-surface-gray"
                >
                  <div className="flex items-center gap-3">
                    <EnvelopeSimple size={18} className="text-secondary" />
                    <span className="text-[15px] text-primary">Contact support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-secondary">support@savis.co.ke</span>
                    <ChevronRightIcon />
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div className="mx-4 lg:mx-0 mt-3 lg:mt-0 pb-4 lg:pb-0">
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleSignOut}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSignOut() } }}
                  className="px-4 h-[52px] flex items-center cursor-pointer hover:bg-error-light transition-colors focus:outline-none focus:bg-error-light"
                >
                  <span className="text-[15px] font-medium text-error">Sign out</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordSheet open={showPasswordSheet} onClose={() => setShowPasswordSheet(false)} />
    </div>
  )
}
