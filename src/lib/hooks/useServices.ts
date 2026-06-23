'use client'

import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Service {
  id: string
  service_name: string
  service_description: string
  price: number
  pricing_type: string
  category: string
  subcategory: string
  duration: string
  logistics: string
  service_photos: string[]
}

interface ServiceFilters {
  category?: string
  subcategory?: string
}

function normalise(id: string, raw: Record<string, unknown>): Service {
  const dMin = raw.durationMin as number | undefined
  const dMax = raw.durationMax as number | undefined
  const dUnit = raw.durationUnit as string | undefined
  const computedDuration =
    dMin !== undefined && dMax !== undefined
      ? `${dMin}–${dMax} ${dUnit ?? ''}`.trim()
      : (dUnit ?? '')

  return {
    id,
    service_name: ((raw.service_name ?? raw.name ?? '') as string).trim(),
    service_description: ((raw.service_description ?? raw.description ?? '') as string),
    price: (raw.price ?? 0) as number,
    pricing_type: ((raw.pricing_type ?? raw.pricingType ?? '') as string),
    category: ((raw.category ?? raw.categoryName ?? '') as string),
    subcategory: ((raw.subcategory ?? raw.subcategoryName ?? '') as string),
    duration: ((raw.duration as string | undefined) ?? computedDuration),
    logistics: ((raw.logistics ?? raw.serviceMode ?? '') as string),
    service_photos: ((raw.service_photos ?? raw.photoUrls ?? []) as string[]),
  }
}

export function useServices(filters?: ServiceFilters) {
  const categoryFilter = filters?.category
  const subcategoryFilter = filters?.subcategory

  const [allServices, setAllServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'services'),
      (snap) => {
        const docs = snap.docs
          .map((d) => normalise(d.id, d.data() as Record<string, unknown>))
          .filter((s) => s.service_name !== '')
        setAllServices(docs)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useServices:', err)
        setError(err.message)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  const services = useMemo(() => {
    let result = allServices
    if (categoryFilter) {
      result = result.filter((s) => s.category === categoryFilter)
    }
    if (subcategoryFilter) {
      result = result.filter((s) => s.subcategory === subcategoryFilter)
    }
    return result
  }, [allServices, categoryFilter, subcategoryFilter])

  return { services, loading, error }
}
