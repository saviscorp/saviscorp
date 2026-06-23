import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface ServiceDoc {
  id: string
  providerId: string
  name: string
  category?: string
  categoryName?: string
  subcategory?: string
  subcategoryName?: string
  basePrice?: number
  price?: number
  pricingType?: string
  serviceMode?: 'mobile' | 'in_person' | 'remote'
  location?: string       // service area, e.g. "Westlands"
  serviceAddress?: string // street address for in_person
  status: 'published' | 'paused' | 'deleted'
  description?: string
  thumbnailUrl?: string
  photoUrls?: string[]
  createdAt?: { toDate: () => Date }
  updatedAt?: { toDate: () => Date }
}

type ServiceFilter = 'all' | 'published' | 'paused'

export async function getProviderServices(
  uid: string,
  filter?: ServiceFilter
): Promise<ServiceDoc[]> {
  // Use 'in' instead of '!=' to avoid composite index requirement
  const q = query(
    collection(db, 'services'),
    where('providerId', '==', uid),
    where('status', 'in', ['published', 'paused'])
  )
  const snap = await getDocs(q)
  let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceDoc))

  // Sort client-side: published first, then by createdAt desc
  docs.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'published' ? -1 : 1
    const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0
    const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0
    return bTime - aTime
  })

  if (filter === 'published') docs = docs.filter((s) => s.status === 'published')
  else if (filter === 'paused') docs = docs.filter((s) => s.status === 'paused')

  return docs
}

export async function toggleServiceStatus(
  serviceId: string,
  published: boolean
): Promise<void> {
  await updateDoc(doc(db, 'services', serviceId), {
    status: published ? 'published' : 'paused',
    updatedAt: serverTimestamp(),
  })
}

export async function hasAnyServices(uid: string): Promise<boolean> {
  // Use 'in' instead of '!=' to avoid composite index requirement
  const q = query(
    collection(db, 'services'),
    where('providerId', '==', uid),
    where('status', 'in', ['published', 'paused']),
    limit(1)
  )
  const snap = await getDocs(q)
  return !snap.empty
}

export async function getServiceById(serviceId: string): Promise<ServiceDoc | null> {
  const { getDoc } = await import('firebase/firestore')
  const snap = await getDoc(doc(db, 'services', serviceId))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ServiceDoc) : null
}
