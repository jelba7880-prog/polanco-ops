'use client'

import { useRef, useState } from 'react'
import { Plus, X, Star } from 'lucide-react'
import { useAddCarImage, useDeleteCarImage, useSetCoverImage } from '@/hooks/useCarImages'
import { uploadCarImage, deleteCarImage } from '@/lib/supabase/storage'
import type { CarImage, PendingCarImage } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  // Persisted mode (car already exists, e.g. Edit): images live in
  // car_images and every action writes straight to the database.
  carId?: string
  images?: CarImage[]
  // Pending mode (no car yet, e.g. Add): images are already uploaded to
  // Storage but held here as plain state, controlled by the parent, until
  // the car is created and the parent turns them into real car_images rows.
  pendingImages?: PendingCarImage[]
  onPendingImagesChange?: (next: PendingCarImage[]) => void
}

const MAX_IMAGES = 8

export function ImageUploader({
  carId,
  images,
  pendingImages,
  onPendingImagesChange,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isPersisted = !!carId

  // Persisted-mode mutations — only ever used when carId is set.
  const addImage = useAddCarImage(carId ?? '')
  const deleteImage = useDeleteCarImage()
  const setCover = useSetCoverImage(carId ?? '')

  // Pending-mode local upload state (no React Query mutation backs this,
  // since there's no row to write until the car exists).
  const [pendingUploading, setPendingUploading] = useState(false)
  const [pendingError, setPendingError] = useState(false)

  const pending = pendingImages ?? []

  // One normalized list so the grid below has a single render path for
  // both modes instead of two parallel JSX blocks.
  const displayImages = isPersisted
    ? (images ?? []).map((img) => ({ id: img.id, url: img.url, isCover: img.is_cover }))
    : pending.map((img) => ({ id: img.tempId, url: img.url, isCover: img.isCover }))

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const remaining = MAX_IMAGES - displayImages.length
    const toUpload = files.slice(0, remaining)

    if (isPersisted) {
      for (const file of toUpload) {
        await addImage.mutateAsync({
          file,
          isFirst: (images ?? []).length === 0,
        })
      }
    } else {
      setPendingUploading(true)
      setPendingError(false)
      try {
        const uploaded: PendingCarImage[] = []
        for (const file of toUpload) {
          // Each photo gets its own temporary Storage folder since there's
          // no car id yet to namespace under.
          const url = await uploadCarImage(crypto.randomUUID(), file)
          uploaded.push({
            tempId: crypto.randomUUID(),
            url,
            isCover: pending.length === 0 && uploaded.length === 0,
          })
        }
        onPendingImagesChange?.([...pending, ...uploaded])
      } catch (err) {
        console.error('Pending image upload failed:', err)
        setPendingError(true)
      } finally {
        setPendingUploading(false)
      }
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSetCover(id: string) {
    if (isPersisted) {
      setCover.mutate(id)
    } else {
      onPendingImagesChange?.(pending.map((p) => ({ ...p, isCover: p.tempId === id })))
    }
  }

  async function handleDelete(id: string, url: string) {
    if (isPersisted) {
      deleteImage.mutate({ imageId: id, url })
    } else {
      try {
        await deleteCarImage(url)
        onPendingImagesChange?.(pending.filter((p) => p.tempId !== id))
      } catch (err) {
        console.error('Failed to remove pending image:', err)
      }
    }
  }

  const canAddMore = displayImages.length < MAX_IMAGES
  const isUploading = isPersisted ? addImage.isPending : pendingUploading
  const isUploadError = isPersisted ? addImage.isError : pendingError

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-inter text-sm font-medium text-ink">
          Photos
        </p>
        <p className="font-inter text-xs text-ink-muted">
          {displayImages.length}/{MAX_IMAGES}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {displayImages.map((image) => (
          <div
            key={image.id}
            className={cn(
              // 8px neutral mat (p-2), same treatment as CarCard/ImageCarousel —
              // source photos have white/light backgrounds that otherwise bleed
              // directly against the dark thumbnail chrome.
              'relative aspect-square rounded-lg overflow-hidden bg-surface-muted border-2 p-2',
              image.isCover ? 'border-gold' : 'border-transparent'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- image domain may not be in remotePatterns yet */}
            <img
              src={image.url}
              alt="Car photo"
              className="w-full h-full object-cover rounded-md"
            />

            {/* Cover indicator. The selection ring above (border-gold) marks
                *which* image is active, same role as a nav-tab indicator; this
                label is a status badge, so it's reclassified off gold in
                dark/dim per the stricter dark-mode gold rule. */}
            {image.isCover && (
              <div className="absolute bottom-1 left-1">
                <span className="bg-gold dark:bg-ink-muted text-on-accent text-[9px] font-inter font-semibold px-1.5 py-0.5 rounded-full">
                  COVER
                </span>
              </div>
            )}

            {/* Actions overlay */}
            <div className="absolute top-1 right-1 flex gap-1">
              {!image.isCover && (
                <button
                  type="button"
                  onClick={() => handleSetCover(image.id)}
                  className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center transition-all duration-150 ease-out active:scale-[0.97]"
                  title="Set as cover"
                >
                  <Star size={10} className="text-white" />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(image.id, image.url)}
                className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center transition-all duration-150 ease-out active:scale-[0.97]"
                title="Delete photo"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          </div>
        ))}

        {/* Add button */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-lg border-2 border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center gap-1 bg-base hover:bg-surface-muted transition-all duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-ink-muted border-t-ink rounded-full animate-spin" />
            ) : (
              <>
                <Plus size={20} className="text-ink-muted" />
                <span className="text-[10px] font-inter text-ink-muted">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {isUploadError && (
        <p className="text-xs text-danger font-inter mt-2">
          Upload failed. Check your connection and try again.
        </p>
      )}
    </div>
  )
}
