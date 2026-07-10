'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PublicStatusBadge } from './PublicStatusBadge'
import { cn } from '@/lib/utils'
import { formatUSD, formatMileage, toDisplayCase } from '@/lib/formatters'
import type { PublicCar } from '@/lib/showcase/types'

interface PublicCarCardProps {
  car: PublicCar
  priority?: boolean
}

// The pointer must rest on a card this long before the page-turn fires — a
// hover-intent delay so a cursor merely passing over a card never triggers it.
const HOVER_INTENT_MS = 1000

// Shared across the cover + hover images so Next generates identical srcsets
// (and the hover preload warms the exact URL the flip later renders).
const CARD_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'

export function PublicCarCard({ car, priority = false }: PublicCarCardProps) {
  const [loaded, setLoaded] = useState(false) // cover finished loading (fade-in)
  const [canFlip, setCanFlip] = useState(false) // hover-capable, fine pointer, motion allowed
  const [armed, setArmed] = useState(false) // pointer over card → mount hover layers + preload
  const [flipped, setFlipped] = useState(false) // page-turn engaged

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverLoadedRef = useRef(false) // hover image has finished loading
  const pendingFlipRef = useRef(false) // 1s elapsed but the hover image wasn't ready yet

  const { coverImageUrl, hoverImageUrl } = car
  // The flip apparatus only exists when there is a genuinely different image to
  // reveal (null hoverImageUrl = single-photo cars, or hover === cover) AND the
  // device is a hover-capable fine pointer with motion allowed. On touch phones
  // (this site's primary traffic) and under reduced-motion this stays false, so
  // the card renders the plain cover exactly as before — no 3D layers, no
  // listeners, no timers, no artifacts.
  const showFlip = Boolean(coverImageUrl && hoverImageUrl) && canFlip

  // Resolve device capability on the client only. Touch-primary phones fail
  // (hover: hover)/(pointer: fine) and never flip; reduced-motion users opt out
  // of the animation entirely. Re-evaluated on change so a docked laptop /
  // plugged-in mouse is respected live.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setCanFlip(hoverMq.matches && !motionMq.matches)
    update()
    hoverMq.addEventListener('change', update)
    motionMq.addEventListener('change', update)
    return () => {
      hoverMq.removeEventListener('change', update)
      motionMq.removeEventListener('change', update)
    }
  }, [])

  // Clear a pending intent timer on unmount so it can't fire into an unmounted
  // card (e.g. when the grid re-filters mid-hover).
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function handlePointerEnter(e: React.PointerEvent) {
    // showFlip already gates on capability; the pointerType check is a cheap
    // extra guard against touch-generated pointer events on hybrid devices.
    if (!hoverImageUrl || e.pointerType === 'touch') return
    setArmed(true) // mounts the hover <Image>s → the browser starts fetching now
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      // Never reveal a blank frame: if the preload is still in flight after the
      // full second, defer the flip until the image's onLoad fires.
      if (hoverLoadedRef.current) setFlipped(true)
      else pendingFlipRef.current = true
    }, HOVER_INTENT_MS)
  }

  function handlePointerLeave() {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    pendingFlipRef.current = false // silently cancel a not-yet-fired flip
    setFlipped(false) // revert to the cover if the flip had already happened
  }

  function handleHoverLoad() {
    hoverLoadedRef.current = true
    if (pendingFlipRef.current) {
      pendingFlipRef.current = false
      setFlipped(true) // the 1s already elapsed while loading — flip now
    }
  }

  const title = `${car.year} ${car.make} ${car.model}`

  return (
    <Link
      href={`/cars/${car.slug}`}
      onPointerEnter={showFlip ? handlePointerEnter : undefined}
      onPointerLeave={showFlip ? handlePointerLeave : undefined}
      className="block bg-base rounded-xl border border-[var(--border)] shadow-card overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-muted">
        {coverImageUrl ? (
          showFlip && hoverImageUrl ? (
            // Flip-capable photo (desktop pointers only): cover ⇄ hover page-turn.
            // The perspective scene and the badge are siblings so the badge stays
            // flat above the 3D transform (see below).
            <div className="showcase-flip absolute inset-0">
              {/* Static hover image beneath the turning page: this is what the
                  turn reveals in place, since the page itself is hinged on its
                  left edge and sweeps off-card. Mounted only once armed, so no
                  hover image is fetched until the pointer actually rests here. */}
              {armed && (
                <Image
                  src={hoverImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes={CARD_IMAGE_SIZES}
                  quality={85}
                  loading="eager"
                  onLoad={handleHoverLoad}
                />
              )}

              {/* The turning page: front = cover, back = hover. */}
              <div className={cn('showcase-flip-page', flipped && 'is-flipped')}>
                <div className="showcase-flip-face showcase-flip-front">
                  {!loaded && (
                    <div className="absolute inset-0 bg-surface-muted animate-pulse" />
                  )}
                  <Image
                    src={coverImageUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes={CARD_IMAGE_SIZES}
                    quality={85}
                    preload={priority}
                    onLoad={() => setLoaded(true)}
                    style={{ opacity: loaded ? 1 : 0 }}
                  />
                </div>
                <div className="showcase-flip-face showcase-flip-back">
                  {armed && (
                    <Image
                      src={hoverImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes={CARD_IMAGE_SIZES}
                      quality={85}
                      loading="eager"
                    />
                  )}
                  <div className="showcase-flip-sheen" aria-hidden />
                </div>
              </div>
            </div>
          ) : (
            // Plain cover — touch devices, reduced-motion, and single-photo cars.
            // Byte-for-byte the pre-feature markup, so nothing changes for them.
            <>
              {!loaded && (
                <div className="absolute inset-0 bg-surface-muted animate-pulse" />
              )}
              <Image
                src={coverImageUrl}
                alt={title}
                fill
                className="object-cover"
                sizes={CARD_IMAGE_SIZES}
                quality={85}
                preload={priority}
                onLoad={() => setLoaded(true)}
                style={{ opacity: loaded ? 1 : 0 }}
              />
            </>
          )
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <span className="font-display text-ink-muted text-lg tracking-widest">
              POLANCO
            </span>
          </div>
        )}

        {/* Status badge sits flat above the 3D scene — a sibling of the flip
            container (never a descendant of the rotating page) with a raised
            z-index, so it is not swept up in the page turn. */}
        <div className="absolute top-3 left-3 z-10">
          <PublicStatusBadge status={car.status} />
        </div>
      </div>

      <div className="p-5">
        <p className="font-inter text-xs text-ink-muted uppercase tracking-wide mb-1">
          {car.year}
        </p>
        <h3 className="font-display text-[22px] font-semibold text-ink leading-tight mb-1">
          {car.make} {car.model}
        </h3>
        <p className="font-inter text-[13px] text-ink-soft mb-2">
          {toDisplayCase(car.condition)} · {formatMileage(car.mileage_km)}
        </p>
        <p className="font-inter text-lg font-semibold text-gold">
          {formatUSD(car.price_usd)}
        </p>
      </div>
    </Link>
  )
}
