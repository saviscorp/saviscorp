'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Camera, X, UploadSimple } from 'phosphor-react'
import ListingStepLayout from '@/components/listing/ListingStepLayout'
import { useListingForm } from '@/context/ListingFormContext'

const MAX_PHOTOS = 5

export default function ListingStep5() {
  const router = useRouter()
  const { data, update } = useListingForm()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = MAX_PHOTOS - data.photoFiles.length
    const toAdd = Array.from(files).slice(0, remaining)
    const newFiles = [...data.photoFiles, ...toAdd]
    const newUrls = [...data.photoPreviewUrls]
    toAdd.forEach(file => newUrls.push(URL.createObjectURL(file)))
    update({ photoFiles: newFiles, photoPreviewUrls: newUrls })
  }

  function removePhoto(index: number) {
    const files = [...data.photoFiles]
    const urls = [...data.photoPreviewUrls]
    URL.revokeObjectURL(urls[index])
    files.splice(index, 1)
    urls.splice(index, 1)
    update({ photoFiles: files, photoPreviewUrls: urls })
  }

  const canAddMore = data.photoFiles.length < MAX_PHOTOS

  return (
    <ListingStepLayout
      currentStep={5}
      title="Add photos"
      subtitle={`Photos help you get more bookings. Add up to ${MAX_PHOTOS} photos.`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {/* Photo grid */}
      {data.photoPreviewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {data.photoPreviewUrls.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-surface-gray">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X size={12} weight="bold" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-brand-primary text-white px-1.5 py-0.5 rounded-md font-medium">
                  Cover
                </span>
              )}
            </div>
          ))}
          {canAddMore && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-brand-primary/40 transition-colors bg-surface-gray"
            >
              <Camera size={24} className="text-text-secondary" />
            </button>
          )}
        </div>
      )}

      {/* Upload button (full width when no photos) */}
      {data.photoFiles.length === 0 && (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 hover:border-brand-primary/40 transition-colors bg-surface-gray mb-4"
        >
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
            <UploadSimple size={24} className="text-brand-primary" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-medium text-text-primary">Upload photos</p>
            <p className="text-[13px] text-text-secondary">JPG, PNG up to 10 MB each</p>
          </div>
        </button>
      )}

      <p className="text-[13px] text-text-secondary text-center mb-6">
        {data.photoFiles.length}/{MAX_PHOTOS} photos added
        {data.photoFiles.length > 0 && canAddMore && (
          <button onClick={() => inputRef.current?.click()} className="ml-2 text-brand-primary underline">Add more</button>
        )}
      </p>

      <button
        onClick={() => router.push('/listing/new/step6')}
        className="w-full h-[52px] rounded-[10px] bg-brand-primary text-white text-[15px] font-semibold hover:bg-brand-dark transition-colors mb-3"
      >
        Continue
      </button>

      <button
        onClick={() => router.push('/listing/new/step6')}
        className="w-full text-center text-[14px] text-text-secondary hover:text-text-primary transition-colors py-2"
      >
        Skip for now
      </button>
    </ListingStepLayout>
  )
}
