import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEFAULT_WORKING_DAYS, type WorkingDays } from './providers'

export interface ScheduleSettings {
  workingDays: WorkingDays
  vacationDates: string[]
  unavailableDates: string[]
}

export async function getProviderSchedule(uid: string): Promise<ScheduleSettings> {
  const snap = await getDoc(doc(db, 'providers', uid, 'schedule', 'settings'))
  if (!snap.exists()) {
    return {
      workingDays: DEFAULT_WORKING_DAYS,
      vacationDates: [],
      unavailableDates: [],
    }
  }
  const data = snap.data()
  return {
    workingDays: data.workingDays ?? DEFAULT_WORKING_DAYS,
    vacationDates: data.vacationDates ?? [],
    unavailableDates: data.unavailableDates ?? [],
  }
}

export async function setVacationDay(
  uid: string,
  isoDate: string,
  add: boolean
): Promise<void> {
  const ref = doc(db, 'providers', uid, 'schedule', 'settings')
  if (add) {
    await setDoc(ref, {
      vacationDates: arrayUnion(isoDate),
      unavailableDates: arrayRemove(isoDate),
    }, { merge: true })
  } else {
    await setDoc(ref, { vacationDates: arrayRemove(isoDate) }, { merge: true })
  }
}

export async function setUnavailableDay(
  uid: string,
  isoDate: string,
  add: boolean
): Promise<void> {
  const ref = doc(db, 'providers', uid, 'schedule', 'settings')
  if (add) {
    await setDoc(ref, {
      unavailableDates: arrayUnion(isoDate),
      vacationDates: arrayRemove(isoDate),
    }, { merge: true })
  } else {
    await setDoc(ref, { unavailableDates: arrayRemove(isoDate) }, { merge: true })
  }
}

export async function getBookedSlotsForDate(
  providerId: string,
  isoDate: string
): Promise<string[]> {
  const q = query(
    collection(db, 'bookings'),
    where('providerId', '==', providerId),
    where('preferredDate', '==', isoDate),
    where('status', 'in', ['confirmed', 'pending_provider'])
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data().preferredTime as string).filter(Boolean)
}
