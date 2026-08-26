'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import type { EmblaCarouselType } from 'embla-carousel'
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
// Only used by the fullscreen lightbox, which isn't Embla-driven.
const SWIPE_THRESHOLD = 50

// Frames at Embla's internal 60fps tick rate. ~12 frames keeps the slide
// scroll within the app's 200ms ease-out motion spec instead of Embla's
// floatier ~420ms default.
const SCROLL_DURATION = 12

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

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    duration: SCROLL_DURATION,
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [loaded, setLoaded] = useState<Record<number, boolean>>({})
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Touch start coordinates live in refs so the lightbox's swipe handling
  // never triggers a render. The inline carousel's swipe is now Embla's job.
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  // Tracks whether the last lightbox gesture was a swipe, so the synthetic
  // click that follows a touch swipe doesn't also close the lightbox.
  const didSwipe = useRef(false)

  const syncFromEmbla = useCallback((api: EmblaCarouselType) => {
    setActiveIndex(api.selectedScrollSnap())
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    // Embla has already finished initializing by the time this effect runs
    // (emblaApi is only ever non-null after that), so this is the one chance
    // to read its starting position before subscribing to future changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncFromEmbla(emblaApi)
    emblaApi.on('select', syncFromEmbla)
    emblaApi.on('reInit', syncFromEmbla)
    return () => {
      emblaApi.off('select', syncFromEmbla)
      emblaApi.off('reInit', syncFromEmbla)
    }
  }, [emblaApi, syncFromEmbla])

  // --- Empty state ---
  if (count === 0) {
    return (
      <div className="relative w-full aspect-[16/9] bg-surface-muted rounded-lg overflow-hidden mb-6 flex flex-col items-center justify-center gap-2">
        <Car size={56} className="text-ink-muted opacity-20" />
        <p className="font-inter text-sm text-ink-muted">No photos uploaded</p>
      </div>
    )
  }

  const goTo = (index: number) => emblaApi?.scrollTo(index)
  const goPrev = () => emblaApi?.scrollPrev()
  const goNext = () => emblaApi?.scrollNext()

  function handleTouchStart(e: React.TouchEvent) {
    didSwipe.current = false
    touchStartX.current = e.changedTouches[0].clientX
    touchStartY.current = e.changedTouches[0].clientY
  }

  // Tap (not swipe) on the photo opens the fullscreen viewer. Embla already
  // suppresses the click that follows a real drag, so no swipe-tracking
  // needed here — only the (non-Embla) lightbox needs the didSwipe guard.
  function handleImageClick() {
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

  function handleLightboxTouchEnd(e: React.TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current

    if (Math.abs(deltaX) < Math.abs(deltaY)) return
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return

    didSwipe.current = true
    if (deltaX < 0) goNext()
    else goPrev()
  }

  return (
    <>
      <div className="mb-6">
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label={`${carName} photos`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          // 8px neutral mat (p-2) between the photo and the card chrome, same
          // treatment as the Inventory list card — source photos have
          // white/light backgrounds that otherwise bleed directly against the
          // dark surface. Consistent in both themes.
          className="relative w-full aspect-[16/9] bg-surface-muted rounded-lg overflow-hidden outline-none p-2"
        >
          <div
            ref={emblaRef}
            onClick={handleImageClick}
            className="h-full w-full overflow-hidden rounded-md touch-pan-y select-none cursor-zoom-in"
          >
            <div className="flex h-full">
              {ordered.map((image, i) => (
                <div key={`${image.url}-${i}`} className="relative h-full w-full flex-[0_0_100%]">
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
              ))}
            </div>
          </div>

          {/* Image counter badge */}
          {count > 1 && (
            <div className="absolute top-3 right-3 z-10 rounded-full bg-black/55 px-2.5 py-1">
              <span className="font-inter text-xs font-medium tabular-nums text-white">
                {activeIndex + 1} / {count}
              </span>
            </div>
          )}

          {/* Tap-to-navigate arrow buttons — overlaid, scoped hit area, in sync with swipe */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goPrev()
                }}
                disabled={!canScrollPrev}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition-all duration-200 ease-out hover:bg-black/55 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                disabled={!canScrollNext}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition-all duration-200 ease-out hover:bg-black/55 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-0"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators — tappable to jump directly to a photo */}
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
                  // Theme tokens so the inactive dot doesn't stay bright grey on
                  // the dark surface: gold for the active dot, the strong border
                  // token (which flips per theme) for the rest.
                  backgroundColor:
                    i === activeIndex ? 'var(--gold)' : 'var(--border-strong)',
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
          onTouchEnd={handleLightboxTouchEnd}
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
            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-150 ease-out active:scale-[0.97]"
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
                disabled={!canScrollPrev}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goNext()
                }}
                disabled={!canScrollNext}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-30"
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
