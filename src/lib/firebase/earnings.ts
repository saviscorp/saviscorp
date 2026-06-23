import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from 'firebase/firestore'
// orderBy kept for getPendingPayoutBookings
import { db } from '@/lib/firebase'
import type { BookingDoc } from './bookings'

export interface EarningsSummary {
  totalEarned: number
  pendingPayout: number
  pendingPayoutCount: number
  servicesCompleted: number
  avgPerService: number
}

export interface PayoutConfig {
  cycleStartDate: string
  cycleDays: number
}

export interface TransactionRow {
  id: string
  serviceName: string
  customerName: string
  completedAt: Date
  grossKes: number
  commissionRate: number
  netKes: number
  payoutStatus: 'pending_payout' | 'paid'
  bookingRef: string
}

export async function getEarningsSummary(
  uid: string,
  commissionRate: number
): Promise<EarningsSummary> {
  const q = query(
    collection(db, 'bookings'),
    where('providerId', '==', uid),
    where('status', '==', 'completed')
  )
  const snap = await getDocs(q)
  const bookings = snap.docs.map((d) => d.data() as BookingDoc)

  let totalEarned = 0
  let pendingPayout = 0
  let pendingPayoutCount = 0
  const servicesCompleted = bookings.length

  for (const b of bookings) {
    const net = b.price * (1 - commissionRate)
    if (b.payoutStatus === 'paid') totalEarned += net
    else if (b.payoutStatus === 'pending_payout') {
      pendingPayout += net
      pendingPayoutCount++
    }
  }

  const avgPerService =
    servicesCompleted > 0 ? totalEarned / servicesCompleted : 0

  return { totalEarned, pendingPayout, pendingPayoutCount, servicesCompleted, avgPerService }
}

export async function getPendingPayoutBookings(
  uid: string,
  commissionRate: number
): Promise<TransactionRow[]> {
  const q = query(
    collection(db, 'bookings'),
    where('providerId', '==', uid),
    where('status', '==', 'completed'),
    where('payoutStatus', '==', 'pending_payout'),
    orderBy('completedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const b = d.data() as BookingDoc
    return bookingToTransaction(d.id, b, commissionRate)
  })
}

type FilterPeriod =
  | 'all-time'
  | 'this-month'
  | 'last-month'
  | 'last-3-months'
  | 'this-year'

export async function getTransactionHistory(
  uid: string,
  commissionRate: number,
  filter: FilterPeriod
): Promise<TransactionRow[]> {
  // Use 'in' to avoid composite index on payoutStatus != null
  const q = query(
    collection(db, 'bookings'),
    where('providerId', '==', uid),
    where('status', '==', 'completed'),
    where('payoutStatus', 'in', ['pending_payout', 'paid'])
  )
  const snap = await getDocs(q)
  const rows = snap.docs.map((d) => {
    const b = d.data() as BookingDoc
    return bookingToTransaction(d.id, b, commissionRate)
  })
  rows.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())

  const now = new Date()
  return rows.filter((r) => {
    const d = r.completedAt
    switch (filter) {
      case 'this-month':
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      case 'last-month': {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth()
      }
      case 'last-3-months': {
        const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        return d >= cutoff
      }
      case 'this-year':
        return d.getFullYear() === now.getFullYear()
      default:
        return true
    }
  })
}

export async function getPayoutConfig(): Promise<PayoutConfig> {
  const snap = await getDoc(doc(db, 'appConfig', 'payout'))
  if (!snap.exists()) {
    const today = new Date()
    return {
      cycleStartDate: today.toISOString().slice(0, 10),
      cycleDays: 14,
    }
  }
  const data = snap.data()
  return { cycleStartDate: data.cycleStartDate, cycleDays: data.cycleDays ?? 14 }
}

export function calculateNextPayoutDate(
  cycleStartDate: string,
  cycleDays: number
): string {
  const start = new Date(cycleStartDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let n = 1
  while (true) {
    const candidate = new Date(start)
    candidate.setDate(candidate.getDate() + n * cycleDays)
    if (candidate > today) {
      return candidate.toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
    n++
  }
}

function bookingToTransaction(
  id: string,
  b: BookingDoc,
  commissionRate: number
): TransactionRow {
  const net = b.price * (1 - commissionRate)
  const completedAt = b.completedAt?.toDate?.() ?? new Date()
  return {
    id,
    serviceName: b.serviceName ?? '',
    customerName: b.customerName ?? '',
    completedAt,
    grossKes: b.price,
    commissionRate,
    netKes: net,
    payoutStatus: b.payoutStatus as 'pending_payout' | 'paid',
    bookingRef: `BK-${id.slice(0, 8).toUpperCase()}`,
  }
}
