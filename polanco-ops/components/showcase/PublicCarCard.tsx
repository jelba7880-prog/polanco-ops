'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

// The pointer must rest on a card this long before the cycle starts — a
// hover-intent delay so a cursor merely crossing a card never triggers it.
const HOVER_INTENT_MS = 1000

// Safety net: if a target image's load event is somehow never observed, engage
// its turn anyway after this long rather than stalling the cycle. The preloader
// gives every image a big head start, so this effectively never fires.
const LOAD_FALLBACK_MS = 1200

// Shared across every card image so Next generates identical srcsets — the
// hidden preloader then warms the exact optimized URLs the cycle later renders.
const CARD_IMAGE_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'

type Phase = 'idle' | 'intent' | 'cycling' | 'reverting'

export function PublicCarCard({ car, priority = false }: PublicCarCardProps) {
  const [loaded, setLoaded] = useState(false) // cover finished loading (fade-in)
  const [canFlip, setCanFlip] = useState(false) // hover-capable, fine pointer, motion allowed
  const [armed, setArmed] = useState(false) // first hover happened → mount flip scene + preloader

  const { coverImageUrl, hoverSequence } = car
  // The cycle plays through the cover then each hover photo, wrapping back to
  // the cover. Empty (length < 2) whenever there is nothing to reveal, so the
  // card stays a plain cover with no hover behaviour at all.
  const displayCycle = useMemo(
    () => (coverImageUrl ? [coverImageUrl, ...hoverSequence] : []),
    [coverImageUrl, hoverSequence]
  )
  const cycleLen = displayCycle.length

  // Gate on capability AND on there being at least 2 photos (cover + ≥1 hover).
  // On touch phones (this site's primary traffic) and under reduced-motion this
  // stays false, so the card renders the plain cover exactly as before — no 3D
  // layers, no listeners, no timers, no artifacts.
  const showFlip = canFlip && cycleLen > 1

  // What the two swappable image slots currently show. `frontSrc` is the resting
  // face; `revealSrc` is the static layer + the page's back face — i.e. the
  // photo the current turn is uncovering. At rest the two are equal.
  const [frontSrc, setFrontSrc] = useState(() => coverImageUrl ?? '')
  const [revealSrc, setRevealSrc] = useState(() => coverImageUrl ?? '')
  const [flipping, setFlipping] = useState(false)

  const phaseRef = useRef<Phase>('idle')
  const displayIndexRef = useRef(0) // index into displayCycle currently settled/targeted
  const intentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null) // pending double-rAF that arms the next turn
  const flippingRef = useRef(false) // mirror of `flipping` for synchronous reads
  const revertQueuedRef = useRef(false) // pointer left mid-flip: revert after this step commits
  const pendingTargetRef = useRef('') // image the in-flight turn is settling to
  const awaitingLoadRef = useRef(false) // a turn is deferred until its target image loads
  const loadFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedSrcsRef = useRef<Set<string>>(new Set()) // image URLs known to have loaded

  // Resolve device capability on the client only. Touch-primary phones fail
  // (hover: hover)/(pointer: fine) and never cycle; reduced-motion users opt out
  // of the whole feature. Re-evaluated on change so a docked laptop / plugged-in
  // mouse is respected live.
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

  // Cancel every pending async handle — the intent timer, the armed turn's
  // double-rAF, and the load fallback. Called on every enter/leave, on capability
  // loss, and on unmount, so no turn can advance a card that is no longer hovered.
  function clearScheduled() {
    if (intentTimerRef.current) {
      clearTimeout(intentTimerRef.current)
      intentTimerRef.current = null
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (loadFallbackRef.current) {
      clearTimeout(loadFallbackRef.current)
      loadFallbackRef.current = null
    }
  }

  // Tear everything down if capability is lost mid-cycle (mouse unplugged) or the
  // card unmounts (grid re-filters).
  useEffect(() => {
    if (!showFlip) {
      clearScheduled()
      phaseRef.current = 'idle'
      flippingRef.current = false
      revertQueuedRef.current = false
      awaitingLoadRef.current = false
      displayIndexRef.current = 0
    }
  }, [showFlip])

  useEffect(() => {
    return () => clearScheduled()
  }, [])

  // Record a loaded image and, if a turn was waiting on exactly this one, arm it
  // now. Fed by both the preloader and the reveal layer's onLoad.
  function markLoaded(src: string) {
    loadedSrcsRef.current.add(src)
    if (awaitingLoadRef.current && src === pendingTargetRef.current) {
      awaitingLoadRef.current = false
      if (loadFallbackRef.current) {
        clearTimeout(loadFallbackRef.current)
        loadFallbackRef.current = null
      }
      engageFlip()
    }
  }

  // Add .is-flipping — but only after the page's current 0° state has actually
  // painted. The double rAF guarantees that committed frame, which is what makes
  // the turn animate (rather than snap) every single time: on the very first turn
  // AND after each flip-clock reset, where the reset-to-0° and the next 0→-180°
  // would otherwise collapse into one paint with nothing to transition from.
  function engageFlip() {
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        flippingRef.current = true
        setFlipping(true)
      })
    })
  }

  // Begin a turn toward `target`: point the reveal layer (static + back face) at
  // it, then arm the turn — but wait until the target has actually loaded so the
  // turn never uncovers a blank/decoding frame (the first step's failure mode,
  // since its image is the earliest to still be in flight after the intent).
  function beginFlipTo(target: string) {
    pendingTargetRef.current = target
    setRevealSrc(target) // occluded behind the opaque front / hidden back face
    if (loadedSrcsRef.current.has(target)) {
      engageFlip()
    } else {
      awaitingLoadRef.current = true
      loadFallbackRef.current = setTimeout(() => {
        loadFallbackRef.current = null
        if (awaitingLoadRef.current && pendingTargetRef.current === target) {
          awaitingLoadRef.current = false
          engageFlip()
        }
      }, LOAD_FALLBACK_MS)
    }
  }

  // Advance one step, wrapping cover → 2 → … → last → cover → … indefinitely.
  function flipToNext() {
    const next = (displayIndexRef.current + 1) % cycleLen
    displayIndexRef.current = next
    beginFlipTo(displayCycle[next])
  }

  // Turn back to the cover (index 0), then rest. Only called when not mid-flip.
  function beginRevert() {
    if (displayIndexRef.current === 0) {
      phaseRef.current = 'idle'
      return
    }
    phaseRef.current = 'reverting'
    displayIndexRef.current = 0
    beginFlipTo(displayCycle[0])
  }

  function handleFlipEnd(e: React.TransitionEvent) {
    // The page fires this for transform; the sheen fires its own for opacity —
    // ignore that one. Removing .is-flipping resets to 0° with no transition, so
    // it does not fire a second transform event.
    if (e.propertyName !== 'transform') return
    if (!flippingRef.current) return // a hard reset already invalidated this turn

    // Commit (flip-clock): the uncovered photo becomes the new resting front.
    // Removing .is-flipping snaps the page back to 0° instantly, invisibly,
    // because front now equals the static reveal layer.
    flippingRef.current = false
    setFlipping(false)
    setFrontSrc(pendingTargetRef.current)

    if (revertQueuedRef.current) {
      revertQueuedRef.current = false
      beginRevert() // pointer left mid-flip — that step settled, now turn to cover
      return
    }
    if (phaseRef.current === 'cycling') {
      flipToNext() // continuous: straight into the next turn, no static hold
      return
    }
    if (phaseRef.current === 'reverting') {
      phaseRef.current = 'idle' // the committed turn WAS the revert-to-cover
    }
  }

  function handlePointerEnter(e: React.PointerEvent) {
    // showFlip already gates on capability; the pointerType check is a cheap
    // extra guard against touch-generated pointer events on hybrid devices.
    if (e.pointerType === 'touch') return
    clearScheduled()

    // Settle immediately to the cover baseline (do NOT reverse an in-flight
    // revert) and start a fresh intent timer, per the re-enter rule. Clearing
    // flippingRef makes any pending transitionEnd commit a no-op.
    revertQueuedRef.current = false
    awaitingLoadRef.current = false
    flippingRef.current = false
    displayIndexRef.current = 0
    setFlipping(false)
    setFrontSrc(displayCycle[0])
    setRevealSrc(displayCycle[0])
    setArmed(true) // mounts the flip scene + preloader on the first hover

    phaseRef.current = 'intent'
    intentTimerRef.current = setTimeout(() => {
      intentTimerRef.current = null
      phaseRef.current = 'cycling'
      flipToNext() // first turn now (cover → photo 2), then continuously
    }, HOVER_INTENT_MS)
  }

  function handlePointerLeave() {
    clearScheduled()
    awaitingLoadRef.current = false
    if (phaseRef.current === 'intent') {
      phaseRef.current = 'idle' // left during intent — nothing ever turned
      return
    }
    if (flippingRef.current) {
      // Mid-flip: let this step finish (no snap), then turn back to the cover.
      revertQueuedRef.current = true
      phaseRef.current = 'reverting'
      return
    }
    if (phaseRef.current === 'cycling') beginRevert()
  }

  const title = `${car.year} ${car.make} ${car.model}`

  return (
    <Link
      href={`/cars/${car.slug}`}
      onPointerEnter={showFlip ? handlePointerEnter : undefined}
      onPointerLeave={showFlip ? handlePointerLeave : undefined}
      className="showcase-car-card active:scale-[0.98] block bg-base rounded-xl border border-[var(--border)] overflow-hidden"
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-muted">
        {coverImageUrl ? (
          showFlip && armed ? (
            // Continuous hover cycle (desktop pointers only). The perspective
            // scene and the badge are siblings so the badge stays flat above the
            // 3D transform (see below).
            <div className="showcase-flip absolute inset-0">
              {/* Preloader: warm the entire hover sequence at the exact optimized
                  URLs the cycle renders, so no turn ever waits on the network. Its
                  onLoad also feeds the load-gate that holds each turn until its
                  target has decoded. opacity-0 (not display:none) so images fetch. */}
              <div
                className="absolute inset-0 opacity-0 pointer-events-none"
                aria-hidden
              >
                {hoverSequence.map((src) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes={CARD_IMAGE_SIZES}
                    quality={85}
                    loading="eager"
                    onLoad={() => markLoaded(src)}
                  />
                ))}
              </div>

              {/* Static reveal layer: the photo the current turn uncovers, in
                  place beneath the page (which is hinged on its left edge and
                  sweeps off-card). Its onLoad also confirms the target decoded. */}
              <Image
                src={revealSrc}
                alt=""
                fill
                className="object-cover"
                sizes={CARD_IMAGE_SIZES}
                quality={85}
                loading="eager"
                onLoad={() => markLoaded(revealSrc)}
              />

              {/* The turning page: front = resting photo, back = reveal photo. */}
              <div
                className={cn('showcase-flip-page', flipping && 'is-flipping')}
                onTransitionEnd={handleFlipEnd}
              >
                <div className="showcase-flip-face showcase-flip-front">
                  <Image
                    src={frontSrc}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes={CARD_IMAGE_SIZES}
                    quality={85}
                    preload={priority}
                  />
                  <div className="showcase-flip-sheen" aria-hidden />
                </div>
                <div className="showcase-flip-face showcase-flip-back">
                  <Image
                    src={revealSrc}
                    alt=""
                    fill
                    className="object-cover"
                    sizes={CARD_IMAGE_SIZES}
                    quality={85}
                    loading="eager"
                  />
                  <div className="showcase-flip-sheen" aria-hidden />
                </div>
              </div>
            </div>
          ) : (
            // Plain cover — touch devices, reduced-motion, single-photo cars, and
            // the pre-first-hover state. Byte-for-byte the pre-feature markup.
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
            z-index, so it is never swept up in a turn, on any step of the cycle. */}
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
        <p className="font-inter text-lg font-semibold text-gold-text tabular-nums">
          {formatUSD(car.price_usd)}
        </p>
      </div>
    </Link>
  )
}
