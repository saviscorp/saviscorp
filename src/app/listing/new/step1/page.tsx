'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ListingStepLayout from '@/components/listing/ListingStepLayout'
import { useListingForm } from '@/context/ListingFormContext'

const CATEGORIES = [
  { id: 'cleaning', name: 'Cleaning', emoji: '🧹' },
  { id: 'beauty', name: 'Beauty & Wellness', emoji: '💅' },
  { id: 'repairs', name: 'Home Repairs', emoji: '🔧' },
  { id: 'tutoring', name: 'Tutoring', emoji: '📚' },
  { id: 'transport', name: 'Transport', emoji: '🚐' },
  { id: 'catering', name: 'Catering', emoji: '🍱' },
  { id: 'security', name: 'Security', emoji: '🛡️' },
  { id: 'tech', name: 'Tech Support', emoji: '💻' },
  { id: 'gardening', name: 'Gardening', emoji: '🌱' },
]

const SUBCATEGORIES: Record<string, { id: string; name: string }[]> = {
  cleaning: [
    { id: 'deep_clean', name: 'Deep Cleaning' },
    { id: 'carpet', name: 'Carpet Cleaning' },
    { id: 'office_clean', name: 'Office Cleaning' },
    { id: 'post_construction', name: 'Post-Construction' },
    { id: 'laundry', name: 'Laundry & Ironing' },
  ],
  beauty: [
    { id: 'hair_braiding', name: 'Hair Braiding' },
    { id: 'nail_art', name: 'Nail Art' },
    { id: 'makeup', name: 'Makeup' },
    { id: 'massage', name: 'Massage' },
    { id: 'skincare', name: 'Skincare' },
  ],
  repairs: [
    { id: 'plumbing', name: 'Plumbing' },
    { id: 'electrical', name: 'Electrical' },
    { id: 'painting', name: 'Painting' },
    { id: 'tiling', name: 'Tiling' },
    { id: 'carpentry', name: 'Carpentry' },
  ],
  tutoring: [
    { id: 'maths', name: 'Mathematics' },
    { id: 'english', name: 'English' },
    { id: 'science', name: 'Science' },
    { id: 'music', name: 'Music' },
    { id: 'languages', name: 'Languages' },
  ],
  transport: [
    { id: 'moving', name: 'Furniture Moving' },
    { id: 'delivery', name: 'Goods Delivery' },
    { id: 'airport', name: 'Airport Pickup' },
  ],
  catering: [
    { id: 'event_catering', name: 'Event Catering' },
    { id: 'meal_prep', name: 'Meal Prep' },
    { id: 'pastry', name: 'Pastry & Baking' },
  ],
  security: [
    { id: 'guard', name: 'Security Guard' },
    { id: 'cctv', name: 'CCTV Installation' },
    { id: 'access_control', name: 'Access Control' },
  ],
  tech: [
    { id: 'laptop_repair', name: 'Laptop Repair' },
    { id: 'phone_repair', name: 'Phone Repair' },
    { id: 'wifi_setup', name: 'WiFi Setup' },
    { id: 'software', name: 'Software Help' },
  ],
  gardening: [
    { id: 'lawn_mowing', name: 'Lawn Mowing' },
    { id: 'landscaping', name: 'Landscaping' },
    { id: 'tree_pruning', name: 'Tree Pruning' },
  ],
}

export default function ListingStep1() {
  const router = useRouter()
  const { data, update } = useListingForm()
  const [error, setError] = useState('')

  function selectCategory(id: string, name: string) {
    update({ categoryId: id, categoryName: name, subcategoryId: '', subcategoryName: '' })
    setError('')
  }

  function selectSubcategory(id: string, name: string) {
    update({ subcategoryId: id, subcategoryName: name })
    setError('')
  }

  function handleContinue() {
    if (!data.categoryId) { setError('Please select a category.'); return }
    if (!data.subcategoryId) { setError('Please select a subcategory.'); return }
    router.push('/listing/new/step2')
  }

  const subs = data.categoryId ? SUBCATEGORIES[data.categoryId] ?? [] : []

  return (
    <ListingStepLayout currentStep={1} title="What service do you offer?" subtitle="Choose the category that best fits your service.">
      <div className="grid grid-cols-2 gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => selectCategory(cat.id, cat.name)}
            className={`flex items-center gap-2 px-3 py-3.5 rounded-xl border text-left transition-colors ${
              data.categoryId === cat.id
                ? 'border-brand-primary bg-brand-light'
                : 'border-border bg-white hover:border-brand-primary/40'
            }`}
          >
            <span className="text-xl">{cat.emoji}</span>
            <span className={`text-[13px] font-medium leading-tight ${data.categoryId === cat.id ? 'text-brand-primary' : 'text-text-primary'}`}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {subs.length > 0 && (
        <div className="mb-6">
          <p className="text-[13px] font-medium text-text-primary mb-2">Subcategory</p>
          <div className="flex flex-wrap gap-2">
            {subs.map(sub => (
              <button
                key={sub.id}
                onClick={() => selectSubcategory(sub.id, sub.name)}
                className={`h-9 px-4 rounded-full border text-[13px] transition-colors ${
                  data.subcategoryId === sub.id
                    ? 'bg-brand-primary text-white border-brand-primary'
                    : 'bg-white border-border text-text-primary hover:border-brand-primary/40'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-[13px] text-error mb-4">{error}</p>}

      <button
        onClick={handleContinue}
        disabled={!data.categoryId || !data.subcategoryId}
        className="w-full h-[52px] rounded-[10px] bg-brand-primary text-white text-[15px] font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50"
      >
        Continue
      </button>
    </ListingStepLayout>
  )
}
