'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface GalleryImage {
  url: string
  sort_order: number
  is_cover: boolean
}

interface CarGalleryProps {
  images: GalleryImage[]
  carName: string
}

export function CarGallery({ images, carName }: CarGalleryProps) {
  const ordered = [...images].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1
    return a.sort_order - b.sort_order
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)

  function goTo(index: number) {
    setLoaded(false)
    setActiveIndex(index)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft' && activeIndex > 0) {
      e.preventDefault()
      goTo(activeIndex - 1)
    } else if (e.key === 'ArrowRight' && activeIndex < ordered.length - 1) {
      e.preventDefault()
      goTo(activeIndex + 1)
    }
  }

  if (ordered.length === 0) {
    return (
      <div className="relative w-full aspect-[4/3] lg:aspect-[16/10] bg-surface-muted rounded-xl flex items-center justify-center">
        <span className="font-display text-ink-muted text-lg tracking-widest">POLANCO</span>
      </div>
    )
  }

  return (
    <div tabIndex={0} onKeyDown={handleKeyDown} className="outline-none">
      <div className="relative w-full aspect-[4/3] lg:aspect-[16/10] rounded-xl overflow-hidden bg-surface-muted">
        {!loaded && <div className="absolute inset-0 bg-surface-muted animate-pulse" />}
        <Image
          src={ordered[activeIndex].url}
          alt={`${carName} — photo ${activeIndex + 1} of ${ordered.length}`}
          fill
          preload={activeIndex === 0}
          sizes="(max-width: 1024px) 100vw, 55vw"
          className="object-cover"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0 }}
        />
      </div>

      {ordered.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {ordered.map((image, i) => (
            <button
              key={`${image.url}-${i}`}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === activeIndex}
              className={cn(
                'relative shrink-0 w-[72px] h-[54px] rounded-lg overflow-hidden border-2 transition-colors duration-150 ease-out',
                i === activeIndex ? 'border-gold' : 'border-transparent'
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="72px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
