'use client'

import { useRef } from 'react'
import { Plus, X, Star } from 'lucide-react'
import { useAddCarImage, useDeleteCarImage, useSetCoverImage } from '@/hooks/useCarImages'
import type { CarImage } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  carId: string
  images: CarImage[]
}

const MAX_IMAGES = 8

export function ImageUploader({ carId, images }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addImage = useAddCarImage(carId)
  const deleteImage = useDeleteCarImage()
  const setCover = useSetCoverImage(carId)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const remaining = MAX_IMAGES - images.length
    const toUpload = files.slice(0, remaining)

    for (const file of toUpload) {
      await addImage.mutateAsync({
        file,
        isFirst: images.length === 0,
      })
    }

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canAddMore = images.length < MAX_IMAGES

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-inter text-sm font-medium text-ink">
          Photos
        </p>
        <p className="font-inter text-xs text-ink-muted">
          {images.length}/{MAX_IMAGES}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {images.map((image) => (
          <div
            key={image.id}
            className={cn(
              'relative aspect-square rounded-lg overflow-hidden bg-surface-muted border-2',
              image.is_cover ? 'border-gold' : 'border-transparent'
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- image domain may not be in remotePatterns yet */}
            <img
              src={image.url}
              alt="Car photo"
              className="w-full h-full object-cover"
            />

            {/* Cover indicator */}
            {image.is_cover && (
              <div className="absolute bottom-1 left-1">
                <span className="bg-gold text-ink text-[9px] font-inter font-semibold px-1.5 py-0.5 rounded-full">
                  COVER
                </span>
              </div>
            )}

            {/* Actions overlay */}
            <div className="absolute top-1 right-1 flex gap-1">
              {!image.is_cover && (
                <button
                  onClick={() => setCover.mutate(image.id)}
                  className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center transition-all duration-150 ease-out active:scale-[0.97]"
                  title="Set as cover"
                >
                  <Star size={10} className="text-white" />
                </button>
              )}
              <button
                onClick={() =>
                  deleteImage.mutate({ imageId: image.id, url: image.url })
                }
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
            onClick={() => fileInputRef.current?.click()}
            disabled={addImage.isPending}
            className="aspect-square rounded-lg border-2 border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center gap-1 bg-white hover:bg-surface-muted transition-all duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
          >
            {addImage.isPending ? (
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

      {addImage.isError && (
        <p className="text-xs text-danger font-inter mt-2">
          Upload failed. Check your connection and try again.
        </p>
      )}
    </div>
  )
}
