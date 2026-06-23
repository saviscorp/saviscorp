'use client'

import { useState, useEffect, useCallback } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { SquaresFour } from 'phosphor-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategoryItem {
  id: string
  name: string
  iconUrl: string
}

export interface SubcategoryItem {
  id: string
  name: string
}

export interface CategorySelection {
  category: CategoryItem | null
  subcategory: SubcategoryItem | null
}

interface StepCategoryProps {
  onSelectionChange: (sel: CategorySelection) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveIconUrl(iconValue: string): Promise<string> {
  if (!iconValue) return ''
  // Already a full download URL
  if (iconValue.startsWith('http')) return iconValue
  // Storage path — fetch the download URL
  try {
    return await getDownloadURL(ref(storage, iconValue))
  } catch {
    return ''
  }
}

// ─── Skeleton components ──────────────────────────────────────────────────────

function CategorySkeletons() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-surface-gray rounded-xl h-28" />
      ))}
    </div>
  )
}

function SubcategorySkeletons() {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse bg-surface-gray rounded-full h-9 w-24 flex-shrink-0" />
      ))}
    </div>
  )
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({
  cat,
  selected,
  onSelect,
}: {
  cat: CategoryItem
  selected: boolean
  onSelect: () => void
}) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <button
      onClick={onSelect}
      className={`rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all w-full ${
        selected
          ? 'border-2 border-brand-primary bg-brand-light'
          : 'border border-border bg-white hover:border-brand-primary/40'
      }`}
    >
      <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
        {cat.iconUrl && !imgFailed ? (
          <img
            src={cat.iconUrl}
            alt={cat.name}
            className="w-12 h-12 object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <SquaresFour
            size={40}
            weight="duotone"
            className={selected ? 'text-brand-primary' : 'text-disabled'}
          />
        )}
      </div>
      <span
        className={`text-[12px] font-medium text-center leading-tight ${
          selected ? 'text-brand-primary' : 'text-text-primary'
        }`}
      >
        {cat.name}
      </span>
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StepCategory({ onSelectionChange }: StepCategoryProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [catLoading, setCatLoading] = useState(true)
  const [catError, setCatError] = useState(false)

  const [selectedCat, setSelectedCat] = useState<CategoryItem | null>(null)
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([])
  const [subLoading, setSubLoading] = useState(false)
  const [subError, setSubError] = useState(false)
  const [selectedSub, setSelectedSub] = useState<SubcategoryItem | null>(null)

  // ── Load categories ─────────────────────────────────────────────────────────

  const loadCategories = useCallback(async () => {
    setCatLoading(true)
    setCatError(false)
    try {
      const snap = await getDocs(collection(db, 'categories'))
      const cats = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data()
          // Support both field naming conventions
          const name = (data.category_name ?? data.name ?? '') as string
          const iconVal = (data.category_icon ?? data.icon ?? '') as string
          const iconUrl = await resolveIconUrl(iconVal)
          return { id: d.id, name, iconUrl }
        })
      )
      setCategories(cats)
    } catch (err) {
      console.error('StepCategory: failed to load categories', err)
      setCatError(true)
    } finally {
      setCatLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // ── Load subcategories (retryable) ──────────────────────────────────────────

  const loadSubcategories = useCallback(async (cat: CategoryItem) => {
    setSubLoading(true)
    setSubError(false)
    try {
      const snap = await getDocs(
        collection(db, 'categories', cat.id, 'subcategories')
      )
      const subs = snap.docs.map((d) => ({
        id: d.id,
        name: ((d.data().subcategory_name ?? d.data().name ?? '') as string),
      }))
      setSubcategories(subs)
    } catch (err) {
      console.error('StepCategory: failed to load subcategories', err)
      setSubError(true)
    } finally {
      setSubLoading(false)
    }
  }, [])

  // ── Select category → trigger subcategory fetch ──────────────────────────────

  const handleSelectCategory = (cat: CategoryItem) => {
    const isDeselect = selectedCat?.id === cat.id
    const next = isDeselect ? null : cat

    setSelectedCat(next)
    setSelectedSub(null)
    setSubcategories([])
    setSubError(false)
    onSelectionChange({ category: next, subcategory: null })

    if (next) {
      loadSubcategories(next)
    }
  }

  // ── Select subcategory ───────────────────────────────────────────────────────

  const handleSelectSub = (sub: SubcategoryItem) => {
    const next = selectedSub?.id === sub.id ? null : sub
    setSelectedSub(next)
    onSelectionChange({ category: selectedCat, subcategory: next })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Category grid */}
      {catLoading ? (
        <CategorySkeletons />
      ) : catError ? (
        <div className="flex flex-col items-center py-10 gap-4">
          <p className="text-[14px] text-text-secondary text-center">
            Could not load categories. Please try again.
          </p>
          <button
            onClick={loadCategories}
            className="px-5 py-2 bg-brand-primary text-white text-[14px] rounded-lg font-medium hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              selected={selectedCat?.id === cat.id}
              onSelect={() => handleSelectCategory(cat)}
            />
          ))}
        </div>
      )}

      {/* Subcategory chips */}
      {selectedCat && (
        <div>
          <p className="text-[13px] font-semibold text-text-primary mb-3">
            Subcategory
          </p>
          {subLoading ? (
            <SubcategorySkeletons />
          ) : subError ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-[13px] text-text-secondary">
                Could not load subcategories. Please try again.
              </p>
              <button
                onClick={() => selectedCat && loadSubcategories(selectedCat)}
                className="px-4 py-2 bg-brand-primary text-white text-[13px] rounded-lg font-medium hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Retry
              </button>
            </div>
          ) : subcategories.length === 0 ? (
            <p className="text-[13px] text-text-secondary">
              No subcategories found for this category.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {subcategories.map((sub) => {
                const isSelected = selectedSub?.id === sub.id
                return (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSub(sub)}
                    className={`h-9 px-4 rounded-full border text-[13px] font-medium flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-brand-primary text-white border-brand-primary'
                        : 'bg-white border-border text-text-primary hover:border-brand-primary/40'
                    }`}
                  >
                    {sub.name}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
