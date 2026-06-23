import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface BookingDoc {
  id: string
  providerId: string
  customerId: string
  serviceId: string
  status: 'pending_provider' | 'confirmed' | 'declined' | 'in_progress' | 'completed'
  preferredDate: string
  preferredTime: string
  location?: string
  specialInstructions?: string
  price: number
  payoutStatus: 'pending_payout' | 'paid' | null
  payoutCycleId: string | null
  completedAt: { toDate: () => Date } | null
  confirmedAt: { toDate: () => Date } | null
  declinedReason: string | null
  createdAt: { toDate: () => Date }
  // Denormalised fields written at booking creation time
  customerName?: string
  serviceName?: string
}

export async function getUpcomingBookings(uid: string): Promise<BookingDoc[]> {
  // No orderBy — sort client-side to avoid requiring a composite index
  const q = query(
    collection(db, 'bookings'),
    where('providerId', '==', uid),
    where('status', 'in', ['pending_provider', 'confirmed'])
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingDoc))
  return docs.sort((a, b) => a.preferredDate.localeCompare(b.preferredDate))
}

export async function getCompletedBookings(uid: string): Promise<BookingDoc[]> {
  // No orderBy — sort client-side to avoid requiring a composite index
  const q = query(
    collection(db, 'bookings'),
    where('providerId', '==', uid),
    where('status', '==', 'completed')
  )
  const snap = await getDocs(q)
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BookingDoc))
  return docs.sort((a, b) => {
    const aTime = a.completedAt?.toDate?.()?.getTime() ?? 0
    const bTime = b.completedAt?.toDate?.()?.getTime() ?? 0
    return bTime - aTime
  })
}

export async function acceptBooking(bookingId: string): Promise<void> {
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'confirmed',
    confirmedAt: serverTimestamp(),
  })
}

export async function declineBooking(bookingId: string, reason: string): Promise<void> {
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'declined',
    declinedReason: reason,
  })
}

export async function completeBooking(bookingId: string): Promise<void> {
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    payoutStatus: 'pending_payout',
  })
}

export interface CreateBookingPayload {
  providerId: string
  customerId: string
  serviceId: string
  preferredDate: string
  preferredTime: string
  location?: string
  specialInstructions?: string
  price: number
}

export async function createBooking(payload: CreateBookingPayload): Promise<string> {
  const ref = await addDoc(collection(db, 'bookings'), {
    ...payload,
    status: 'pending_provider',
    createdAt: serverTimestamp(),
    completedAt: null,
    confirmedAt: null,
    declinedReason: null,
    payoutStatus: null,
    payoutCycleId: null,
  })
  return ref.id
}

// ── Sprint 4: auto-confirm booking (skips provider gate) ─────────────────────

export interface CreateBookingV2Payload {
  providerId: string
  customerId: string
  serviceId: string
  serviceTitle: string   // denormalized
  providerName: string   // denormalized
  locationMode: string
  preferredDate: string
  preferredTime: string
  clientLocation?: string
  specialInstructions?: string
  serviceFee: number
  total: number          // after platform fee + VAT
  paymentDeadline: number // epoch ms — 15-min window
}

export async function createBookingAwaitingPayment(
  payload: CreateBookingV2Payload,
): Promise<{ id: string; ref: string }> {
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...payload,
    status: 'awaiting_payment',
    createdAt: serverTimestamp(),
    confirmedAt: null,
    completedAt: null,
    declinedReason: null,
    payoutStatus: null,
    payoutCycleId: null,
    // Sprint 4 payment fields
    paymentRef: null,
    meetLink: null,
    providerPhone: null,
    retryCount: 0,
  })
  // Short human-readable ref derived from the Firestore doc ID
  const ref = 'BK-' + docRef.id.substring(0, 8).toUpperCase()
  // Write ref back onto the doc so the pay + confirmation screens can display it
  await updateDoc(docRef, { ref })
  return { id: docRef.id, ref }
}
