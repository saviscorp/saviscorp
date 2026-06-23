'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { User, PencilSimple, LockSimple, CheckCircle, WarningCircle } from 'phosphor-react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuth } from '@/lib/hooks/useAuth'

const GENDERS = ['Male', 'Female', 'Prefer not to say'] as const
type Gender = (typeof GENDERS)[number]

type ToastType = 'success' | 'neutral' | 'error'

interface Original {
  phone: string
  gender: string
  photoUrl: string
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-surface-gray">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-border">
        <div className="w-16 h-8 rounded-lg bg-surface-gray animate-pulse" />
        <div className="w-24 h-5 rounded bg-surface-gray animate-pulse" />
        <div className="w-14 h-8 rounded-lg bg-surface-gray animate-pulse" />
      </header>
      <div className="px-4 pt-8 max-w-[480px] mx-auto">
        <div className="flex justify-center mb-8">
          <div className="w-[120px] h-[120px] rounded-full bg-surface-gray animate-pulse" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="mb-5">
            <div className="w-28 h-3 rounded bg-surface-gray animate-pulse mb-2" />
            <div className="w-full h-[52px] rounded-[10px] bg-surface-gray animate-pulse" />
          </div>
        ))}
        <div className="w-full h-[52px] rounded-[10px] bg-surface-gray animate-pulse mt-2 opacity-50" />
      </div>
    </div>
  )
}

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-5">
      <label className="block text-[13px] font-medium text-text-secondary mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          readOnly
          tabIndex={-1}
          className="w-full h-[52px] px-4 pr-12 rounded-[10px] border border-border bg-surface-gray text-text-secondary text-[15px] cursor-not-allowed select-none outline-none"
        />
        <LockSimple
          size={16}
          weight="regular"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
        />
      </div>
      <p className="text-[12px] text-text-secondary mt-1">Cannot be changed</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Firestore-loaded values
  const [loading, setLoading] = useState(true)
  const [original, setOriginal] = useState<Original>({ phone: '', gender: '', photoUrl: '' })

  // Read-only display
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')

  // Editable
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [newPhotoDataUrl, setNewPhotoDataUrl] = useState<string | null>(null)

  // UI state
  const [saving, setSaving] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load Firestore data ──────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid))
      .then(snap => {
        if (!snap.exists()) return
        const data = snap.data() as {
          profile?: { fullName?: string; phone?: string; gender?: string; dob?: string }
          photo?: { url?: string }
        }
        const p = data.profile ?? {}
        const ph = data.photo ?? {}

        const savedPhone  = p.phone   ?? ''
        const savedGender = p.gender  ?? ''
        const savedPhoto  = ph.url    ?? ''

        setFullName(p.fullName ?? '')
        setDob(p.dob ?? '')
        setPhone(savedPhone)
        setGender(savedGender as Gender | '')
        setOriginal({ phone: savedPhone, gender: savedGender, photoUrl: savedPhoto })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // ── Derived ──────────────────────────────────────────────────────────────

  const hasChanges =
    phone !== original.phone ||
    gender !== original.gender ||
    newPhotoDataUrl !== null

  const displayPhotoUrl: string | null = newPhotoDataUrl ?? (original.photoUrl || null)

  // ── Toast ────────────────────────────────────────────────────────────────

  const showToast = useCallback((type: ToastType, message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ type, message })
    toastTimerRef.current = setTimeout(() => setToast(null), 2500)
  }, [])

  // ── Photo pick & compress ────────────────────────────────────────────────

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
        setNewPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = ''
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const changes: Record<string, unknown> = {}
    if (phone.trim() !== original.phone)  changes['profile.phone']  = phone.trim()
    if (gender !== original.gender)        changes['profile.gender'] = gender
    if (newPhotoDataUrl) {
      changes['photo.url']      = newPhotoDataUrl
      changes['photo.uploaded'] = true
    }

    if (Object.keys(changes).length === 0) {
      showToast('neutral', 'No changes to save')
      setTimeout(() => router.push('/profile'), 1500)
      return
    }

    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', uid), changes)
      showToast('success', 'Profile updated')
      setTimeout(() => router.push('/profile'), 1500)
    } catch {
      showToast('error', 'Something went wrong, try again')
      setSaving(false)
    }
  }

  // ── Cancel ───────────────────────────────────────────────────────────────

  function handleCancel() {
    if (hasChanges) {
      setShowDiscardDialog(true)
    } else {
      router.push('/profile')
    }
  }

  // ── Guards ───────────────────────────────────────────────────────────────

  if (authLoading || loading) return <LoadingSkeleton />

  if (!user) {
    router.push('/login')
    return null
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-gray pb-16">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileInputChange}
      />

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-border sticky top-0 z-40">
        <button
          type="button"
          onClick={handleCancel}
          className="text-[15px] font-medium text-brand-primary hover:opacity-70 transition-opacity focus:outline-none min-w-[60px]"
        >
          Cancel
        </button>

        <span className="text-[17px] font-semibold text-text-primary">Edit profile</span>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={[
            'h-9 px-5 rounded-full text-[14px] font-semibold transition-all focus:outline-none',
            hasChanges && !saving
              ? 'bg-brand-primary text-white hover:opacity-90 active:scale-95'
              : 'bg-border text-text-secondary cursor-not-allowed',
          ].join(' ')}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      {/* ── Body ── */}
      <main className="px-4 pt-8 max-w-[480px] mx-auto">

        {/* Photo circle */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change profile photo"
              className="w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-border bg-surface-gray flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            >
              {displayPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayPhotoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-text-secondary" />
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change photo"
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-md hover:bg-brand-primary/90 transition-colors focus:outline-none"
            >
              <PencilSimple size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* Full name — read-only */}
        <ReadOnlyField label="Full name" value={fullName || '—'} />

        {/* Phone */}
        <div className="mb-5">
          <label htmlFor="phone" className="block text-[13px] font-medium text-text-primary mb-1.5">
            Phone number
          </label>
          <div className="flex h-[52px] rounded-[10px] border border-border overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary/30 focus-within:border-brand-primary transition-colors">
            <div className="flex items-center gap-1.5 px-3 bg-surface-gray border-r border-border flex-shrink-0 select-none">
              <span className="text-[18px]" aria-hidden="true">🇰🇪</span>
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
          <p className="text-[12px] text-text-secondary mt-1">Used to confirm bookings</p>
        </div>

        {/* Gender */}
        <div className="mb-5">
          <p className="text-[13px] font-medium text-text-primary mb-1.5">Gender</p>
          <div className="flex gap-2">
            {GENDERS.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setGender(option)}
                className={[
                  'flex-1 h-[44px] rounded-[10px] border text-[13px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/30',
                  gender === option
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-white text-text-primary border-border hover:border-brand-primary/40',
                ].join(' ')}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Date of birth — read-only */}
        <ReadOnlyField label="Date of birth" value={dob || '—'} />

        {/* Save CTA (secondary — mirrors header Save for mobile scroll convenience) */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={[
            'w-full h-[52px] rounded-[10px] text-[15px] font-semibold mt-2 transition-all focus:outline-none active:scale-[0.98]',
            hasChanges && !saving
              ? 'bg-brand-primary text-white hover:opacity-90'
              : 'bg-border text-text-secondary cursor-not-allowed opacity-70',
          ].join(' ')}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={[
            'fixed bottom-8 inset-x-4 z-50 flex items-center gap-3 h-14 px-4 rounded-xl shadow-lg text-white text-[14px] font-medium transition-all max-w-[480px] mx-auto',
            toast.type === 'success' ? 'bg-success' :
            toast.type === 'error'   ? 'bg-error'   :
            'bg-text-primary',
          ].join(' ')}
        >
          {toast.type === 'success' && <CheckCircle size={20} weight="fill" className="flex-shrink-0" />}
          {toast.type === 'error'   && <WarningCircle size={20} weight="fill" className="flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* ── Discard confirm bottom sheet ── */}
      {showDiscardDialog && (
        <>
          <div
            className="fixed inset-0 z-50 bg-[rgba(58,7,57,0.55)]"
            onClick={() => setShowDiscardDialog(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Discard changes"
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-[20px] px-6 pt-2 pb-10"
          >
            <div className="h-1 w-9 bg-border rounded-full mx-auto mb-6 mt-2" />
            <h2 className="text-[20px] font-bold text-text-primary mb-2">Discard changes?</h2>
            <p className="text-[15px] text-text-secondary mb-6">Your edits won&apos;t be saved.</p>
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="w-full h-[52px] bg-brand-action text-white text-[15px] font-semibold rounded-[10px] mb-3 hover:opacity-90 transition-opacity focus:outline-none"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => setShowDiscardDialog(false)}
              className="w-full h-[52px] border border-border text-text-primary text-[15px] font-medium rounded-[10px] hover:bg-surface-gray transition-colors focus:outline-none"
            >
              Keep editing
            </button>
          </div>
        </>
      )}
    </div>
  )
}
