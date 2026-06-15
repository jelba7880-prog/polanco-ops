'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Car, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface CarouselImage {
  url: string
  sort_order: number
  is_cover: boolean
}

interface ImageCarouselProps {
  images: CarouselImage[]
  /** Used as alt text: "2024 Lamborghini Urus S — photo 1 of 5" */
  carName: string
}

// Minimum horizontal travel (px) before a touch gesture counts as a swipe.
const SWIPE_THRESHOLD = 50

// Sort so the cover image is always first, then by ascending sort_order.
function orderImages(images: CarouselImage[]): CarouselImage[] {
  return [...images].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1
    return a.sort_order - b.sort_order
  })
}

export function ImageCarousel({ images, carName }: ImageCarouselProps) {
  const ordered = orderImages(images)
  const count = ordered.length

  const [activeIndex, setActiveIndex] = useState(0)
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Touch start coordinates live in refs so swipe handling never triggers a render.
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  // Tracks whether the last gesture was a swipe, so the synthetic click that
  // follows a touch swipe doesn't also open the lightbox.
  const didSwipe = useRef(false)

  // --- Empty state ---
  if (count === 0) {
    return (
      <div className="relative w-full aspect-[16/9] bg-surface-muted rounded-lg overflow-hidden mb-6 flex flex-col items-center justify-center gap-2">
        <Car size={56} className="text-ink-muted opacity-20" />
        <p className="font-inter text-sm text-ink-muted">No photos uploaded</p>
      </div>
    )
  }

  const goTo = (index: number) => {
    if (index < 0 || index > count - 1) return
    setActiveIndex(index)
  }
  const goPrev = () => goTo(activeIndex - 1)
  const goNext = () => goTo(activeIndex + 1)

  function handleTouchStart(e: React.TouchEvent) {
    didSwipe.current = false
    touchStartX.current = e.changedTouches[0].clientX
    touchStartY.current = e.changedTouches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current

    // Only hijack predominantly-horizontal gestures so vertical scroll still works.
    if (Math.abs(deltaX) < Math.abs(deltaY)) return
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return

    didSwipe.current = true
    if (deltaX < 0) goNext()
    else goPrev()
  }

  // Tap (not swipe) on the photo opens the fullscreen viewer.
  function handleImageClick() {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    setLightboxOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      goNext()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setLightboxOpen(true)
    }
  }

  function handleLightboxKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setLightboxOpen(false)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      goNext()
    }
  }

  const hasPrev = activeIndex > 0
  const hasNext = activeIndex < count - 1

  return (
    <>
      <div className="mb-6">
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label={`${carName} photos`}
          tabIndex={0}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          onClick={handleImageClick}
          className="group relative w-full aspect-[16/9] bg-surface-muted rounded-lg overflow-hidden touch-pan-y select-none outline-none cursor-zoom-in"
        >
          {ordered.map((image, i) => {
            const isActive = i === activeIndex
            return (
              <div
                key={`${image.url}-${i}`}
                aria-hidden={!isActive}
                className="absolute inset-0 transition-opacity duration-300 ease-out"
                style={{ opacity: isActive ? 1 : 0 }}
              >
                {/* Skeleton placeholder until this image has loaded. */}
                {!loaded[i] && (
                  <div className="absolute inset-0 bg-surface-muted animate-pulse" />
                )}
                <Image
                  src={image.url}
                  alt={`${carName} — photo ${i + 1} of ${count}`}
                  fill
                  // Next.js 16 deprecated `priority` in favour of `preload`.
                  // Eagerly fetch the hero (cover) image; lazy-load the rest.
                  preload={i === 0}
                  loading={i === 0 ? undefined : 'lazy'}
                  sizes="(max-width: 768px) 100vw, 768px"
                  draggable={false}
                  onLoad={() => setLoaded((prev) => ({ ...prev, [i]: true }))}
                  className="object-cover"
                  style={{ opacity: loaded[i] ? 1 : 0 }}
                />
              </div>
            )
          })}

          {/* Image counter badge */}
          {count > 1 && (
            <div className="absolute top-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1">
              <span className="font-inter text-xs font-medium tabular-nums text-white">
                {activeIndex + 1} / {count}
              </span>
            </div>
          )}

          {/* Mobile swipe-affordance hints: subtle nudging chevrons at the edges */}
          {hasPrev && (
            <div className="pointer-events-none absolute inset-y-0 left-0 z-[5] flex w-12 items-center justify-start bg-gradient-to-r from-black/25 to-transparent pl-1 md:hidden">
              <ChevronLeft
                size={22}
                className="animate-nudge-left text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
              />
            </div>
          )}
          {hasNext && (
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[5] flex w-12 items-center justify-end bg-gradient-to-l from-black/25 to-transparent pr-1 md:hidden">
              <ChevronRight
                size={22}
                className="animate-nudge-right text-white/85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
              />
            </div>
          )}

          {/* Desktop arrow buttons: subtly visible at rest, fully opaque on hover */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                disabled={!hasPrev}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-50 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/65 disabled:pointer-events-none disabled:opacity-0 md:flex"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                disabled={!hasNext}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white opacity-50 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/65 disabled:pointer-events-none disabled:opacity-0 md:flex"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {count > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {ordered.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === activeIndex}
                className="h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: i === activeIndex ? 18 : 6,
                  backgroundColor: i === activeIndex ? '#C9A84C' : '#E5E5E5',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen photo viewer (lightbox) */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${carName} photo viewer`}
          tabIndex={-1}
          ref={(el) => el?.focus()}
          onKeyDown={handleLightboxKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none outline-none pt-safe pb-safe"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxOpen(false)
            }}
            aria-label="Close photo viewer"
            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X size={22} />
          </button>

          {/* Counter */}
          {count > 1 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 rounded-full bg-white/10 px-3 py-1">
              <span className="font-inter text-xs font-medium tabular-nums text-white">
                {activeIndex + 1} / {count}
              </span>
            </div>
          )}

          {/* Full photo (contained, never cropped) */}
          <div
            className="relative h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={ordered[activeIndex].url}
              alt={`${carName} — photo ${activeIndex + 1} of ${count}`}
              fill
              sizes="100vw"
              draggable={false}
              className="object-contain"
            />
          </div>

          {/* Navigation arrows */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                disabled={!hasPrev}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                disabled={!hasNext}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
