'use client'

import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Category {
  id: string
  category_name: string
  category_icon: string
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        setCategories(
          snap.docs.map((d) => ({
            id: d.id,
            category_name: (d.data().category_name ?? '') as string,
            category_icon: (d.data().category_icon ?? '') as string,
          }))
        )
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('useCategories:', err)
        setError(err.message)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  return { categories, loading, error }
}
