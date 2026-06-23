import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type OnboardingStep = 1 | 2 | 3 | 4
export type Gender = 'Male' | 'Female' | 'Prefer not to say' | ''
export type DocType = 'National ID' | 'Passport' | 'Driving licence' | ''

export interface UserDoc {
  uid: string
  email: string
  onboardingComplete: boolean
  profileComplete: boolean
  onboardingStep: OnboardingStep
  activeRole: 'customer' | 'provider'
  verificationStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected' | 'resubmitted'
  rating: null
  ratingCount: number
  ratingSum: number
  profile: {
    fullName: string
    phone: string
    gender: Gender
    dob: string
  }
  photo: {
    uploaded: boolean
    url: string
  }
  identity: {
    docType: DocType
    frontUploaded: boolean
    backUploaded: boolean
    skipped: boolean
  }
}

// Fetches the user doc; creates it with defaults if it doesn't exist yet.
// activeRole can be overridden when arriving via provider intent flow.
export async function getOrCreateUserDoc(
  uid: string,
  email: string,
  activeRole: 'customer' | 'provider' = 'customer'
): Promise<UserDoc> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    return snap.data() as UserDoc
  }
  const newDoc: UserDoc = {
    uid,
    email,
    onboardingComplete: false,
    profileComplete: false,
    onboardingStep: 1,
    activeRole,
    verificationStatus: 'not_submitted',
    rating: null,
    ratingCount: 0,
    ratingSum: 0,
    profile: { fullName: '', phone: '', gender: '', dob: '' },
    photo: { uploaded: false, url: '' },
    identity: { docType: '', frontUploaded: false, backUploaded: false, skipped: false },
  }
  // createdAt is write-only metadata — kept outside the typed interface
  await setDoc(ref, { ...newDoc, createdAt: serverTimestamp() })
  return newDoc
}

// Returns the path the user should be sent to after auth.
// Falls back to step1 on any Firestore error — never leaves user on a blank screen.
export async function getOnboardingRedirect(uid: string): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return '/onboarding/profile/step1'
    const data = snap.data() as UserDoc
    if (data.onboardingComplete) return '/'
    return `/onboarding/profile/step${data.onboardingStep}`
  } catch {
    return '/onboarding/profile/step1'
  }
}

// Advances onboardingStep in Firestore. Never writes a lower value than what's stored.
export async function updateOnboardingStep(uid: string, step: OnboardingStep): Promise<void> {
  try {
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const current = ((snap.data() as UserDoc).onboardingStep ?? 1) as OnboardingStep
    if (step <= current) return
    await updateDoc(ref, { onboardingStep: step })
  } catch {
    // Best-effort — navigation still proceeds even if the write fails
  }
}

// Marks the user's profile as fully complete.
export async function completeOnboarding(uid: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), { onboardingComplete: true, profileComplete: true })
  } catch {
    // Best-effort — navigation still proceeds
  }
}
