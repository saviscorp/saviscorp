'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface ListingFormData {
  categoryId: string
  categoryName: string
  subcategoryId: string
  subcategoryName: string
  name: string
  description: string
  serviceMode: 'mobile' | 'in_person' | 'remote' | ''
  location: string
  serviceAddress: string
  durationMin: number
  durationMax: number
  durationUnit: 'minutes' | 'hours' | 'days'
  pricingType: 'fixed' | 'per_hour' | 'starting_from' | ''
  price: number
  priceNote: string
  photoFiles: File[]
  photoPreviewUrls: string[]
}

const DEFAULT: ListingFormData = {
  categoryId: '', categoryName: '', subcategoryId: '', subcategoryName: '',
  name: '', description: '',
  serviceMode: '', location: 'Nairobi', serviceAddress: '',
  durationMin: 1, durationMax: 2, durationUnit: 'hours',
  pricingType: '', price: 0, priceNote: '',
  photoFiles: [], photoPreviewUrls: [],
}

type CtxType = {
  data: ListingFormData
  update: (patch: Partial<ListingFormData>) => void
  reset: () => void
}

const ListingFormContext = createContext<CtxType | null>(null)

export function ListingFormProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ListingFormData>(DEFAULT)

  function update(patch: Partial<ListingFormData>) {
    setData(d => ({ ...d, ...patch }))
  }

  function reset() { setData(DEFAULT) }

  return (
    <ListingFormContext.Provider value={{ data, update, reset }}>
      {children}
    </ListingFormContext.Provider>
  )
}

export function useListingForm() {
  const ctx = useContext(ListingFormContext)
  if (!ctx) throw new Error('useListingForm must be used inside ListingFormProvider')
  return ctx
}
