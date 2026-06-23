'use client'

import { ListingFormProvider } from '@/context/ListingFormContext'

export default function ListingNewLayout({ children }: { children: React.ReactNode }) {
  return <ListingFormProvider>{children}</ListingFormProvider>
}
