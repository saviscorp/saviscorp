import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface UserDoc {
  name?: string
  email?: string
  role?: string
  activeRole?: 'requestor' | 'provider'
  profileComplete?: boolean
  profile?: { fullName?: string; phone?: string }
}

export interface ProviderDoc {
  status?: 'active' | 'suspended'
  bio?: string
  avatarUrl?: string
  commissionRate?: number
}

export async function getCurrentUser(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserDoc) : null
}

export async function updateActiveRole(
  uid: string,
  role: 'requestor' | 'provider'
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { activeRole: role })
}

export async function getProviderProfile(uid: string): Promise<ProviderDoc | null> {
  const snap = await getDoc(doc(db, 'providers', uid))
  return snap.exists() ? (snap.data() as ProviderDoc) : null
}

// ─── Default schedule ──────────────────────────────────────────────────────────

export const DEFAULT_WORKING_DAYS = {
  mon: { active: true,  start: '08:00', end: '17:00' },
  tue: { active: true,  start: '08:00', end: '17:00' },
  wed: { active: true,  start: '08:00', end: '17:00' },
  thu: { active: true,  start: '08:00', end: '17:00' },
  fri: { active: true,  start: '08:00', end: '17:00' },
  sat: { active: false, start: '09:00', end: '17:00' },
  sun: { active: false, start: '09:00', end: '17:00' },
}

export interface DayConfig {
  active: boolean
  start: string
  end: string
}

export interface WorkingDays {
  mon: DayConfig
  tue: DayConfig
  wed: DayConfig
  thu: DayConfig
  fri: DayConfig
  sat: DayConfig
  sun: DayConfig
}

export async function updateProviderWorkingHours(
  uid: string,
  workingDays: WorkingDays
): Promise<void> {
  const ref = doc(db, 'providers', uid, 'schedule', 'settings')
  await setDoc(
    ref,
    { workingDays, updatedAt: serverTimestamp() },
    { merge: true }
  )
}
