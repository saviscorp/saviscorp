'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Subcategory {
  id: string
  subcategory_name: string
  category: string
}

export function useSubcategories(categoryName?: string) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!categoryName) {
      setSubcategories([])
      setLoading(false)
      return
    }

    setLoading(true)
    const q = query(
      collection(db, 'subcategories'),
      where('category', '==', categoryName)
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        setSubcategories(
          snap.docs.map((d) => ({
            id: d.id,
            subcategory_name: (d.data().subcategory_name ?? '') as string,
            category: (d.data().category ?? '') as string,
          }))
        )
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useSubcategories:', err)
        setError(err.message)
        setLoading(false)
      }
    )

    return unsub
  }, [categoryName])

  return { subcategories, loading, error }
}
