'use client'

import { useEffect, useRef } from 'react'

// Ambient decorative texture behind the entire public showcase (mounted once
// in (public)/layout.tsx, as a viewport-fixed layer so it covers the page at
// any scroll position). A gold halftone dot field, individually breathing at
// rest, that grows/brightens near the cursor on real pointers.
//
// Rendered on a single <canvas> driven by one rAF loop rather than one DOM node
// per dot: this site's real traffic is low-end Tecno/Infinix Android over 3G,
// and hundreds of independently-animated elements would each get their own
// compositor layer — canvas keeps paint cost flat regardless of dot count, with
// no new dependency (the codebase deliberately has no animation library).
//
// --gold and --bg-base are already-established Dim/Dark tokens (app/globals.css
// + lib/theme.ts), so the colour here is read live from --gold rather than
// hardcoded, and re-read when next-themes swaps the <html> class. The canvas
// paints nothing but dots — it sits transparently on the existing token-driven
// page background.

const DOT_SPACING = 30 // px between dot centers, before the density cap below
const ROW_SPACING_RATIO = 0.87 // tighter row pitch than column = hex-ish halftone feel
const MAX_DOTS = 480 // hard cap so very wide/tall viewports can't blow up fill cost
const BASE_RADIUS = 1.7
const BREATH_RADIUS_AMPLITUDE = 0.55
// Raised from 0.07-0.2: at that range the field read as faint background noise
// rather than a deliberate texture. This band (rest average ~0.25) is tuned to
// read as fine paper/engraving texture at normal viewing distance while still
// sitting well under MAX_OPACITY so it never competes with real gold accents.
const BREATH_OPACITY_MIN = 0.16
const BREATH_OPACITY_MAX = 0.34
const BREATH_PERIOD_MIN_MS = 3200
const BREATH_PERIOD_MAX_MS = 5200
const CURSOR_RADIUS_PX = 130 // proximity falloff radius around the pointer
const CURSOR_RADIUS_BOOST = 2.2
const CURSOR_OPACITY_BOOST = 0.22
const CURSOR_LERP = 0.12 // per-frame easing toward the target influence — this is what removes any snap
const MAX_OPACITY = 0.5 // stays well under solid-fill UI so it never competes with real gold accents
const TARGET_FRAME_MS = 1000 / 30 // redraw cap — ambient motion reads fine at 30fps, half the cost of 60
const MAX_DPR = 2 // clamp so 3x/4x-DPR Android panels don't multiply the canvas fill cost
const GOLD_FALLBACK_RGB = '201, 168, 76' // light-theme --gold; used only if the live read fails

interface Dot {
  x: number
  y: number
  baseRadius: number
  phase: number
  periodMs: number
  influence: number // eased 0..1 cursor proximity, only ever moved by the lerp in drawFrame
}

/**
 * Wires up the whole effect against non-null handles and returns its teardown.
 * Lives at module scope (rather than inline in the effect) so it isn't
 * reallocated per render and so the canvas/context stay non-nullable throughout.
 */
function setupHalftone(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)')
  const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

  // Mirrors PublicCarCard's gating exactly: cursor reactivity requires a
  // hover-capable fine pointer, and reduced-motion disables everything —
  // including the idle breathing, not just the cursor reaction.
  let canReact = hoverMq.matches
  let motionEnabled = !motionMq.matches

  let dots: Dot[] = []
  let cssWidth = 0
  let cssHeight = 0
  let goldRgb = GOLD_FALLBACK_RGB

  const pointer = { x: -9999, y: -9999, active: false }

  function readGoldColor() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--gold').trim()
    const hex = raw.replace('#', '')
    if (hex.length !== 6) return
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) goldRgb = `${r}, ${g}, ${b}`
  }

  // Offset-row (hex-ish) grid. Over MAX_DOTS the spacing grows rather than dots
  // being dropped, so density thins evenly instead of leaving bald patches.
  function buildDots() {
    let spacing = DOT_SPACING
    const estimated = (cssWidth / spacing) * (cssHeight / (spacing * ROW_SPACING_RATIO))
    if (estimated > MAX_DOTS) spacing *= Math.sqrt(estimated / MAX_DOTS)
    const rowSpacing = spacing * ROW_SPACING_RATIO

    const next: Dot[] = []
    let row = 0
    for (let y = rowSpacing / 2; y < cssHeight + rowSpacing; y += rowSpacing) {
      const offsetX = row % 2 === 0 ? 0 : spacing / 2
      for (let x = offsetX; x < cssWidth + spacing; x += spacing) {
        next.push({
          x,
          y,
          baseRadius: BASE_RADIUS * (0.8 + Math.random() * 0.4),
          // Random phase + random period per dot is what keeps the field from
          // reading as one synchronised blink.
          phase: Math.random() * Math.PI * 2,
          periodMs:
            BREATH_PERIOD_MIN_MS + Math.random() * (BREATH_PERIOD_MAX_MS - BREATH_PERIOD_MIN_MS),
          influence: 0,
        })
      }
      row++
    }
    dots = next
  }

  function drawFrame(elapsedMs: number) {
    ctx.clearRect(0, 0, cssWidth, cssHeight)
    for (const dot of dots) {
      const breath01 = (Math.sin((elapsedMs / dot.periodMs) * Math.PI * 2 + dot.phase) + 1) / 2

      if (canReact) {
        const target = pointer.active
          ? Math.max(0, 1 - Math.hypot(dot.x - pointer.x, dot.y - pointer.y) / CURSOR_RADIUS_PX)
          : 0
        dot.influence += (target - dot.influence) * CURSOR_LERP
      }

      const radius =
        dot.baseRadius + breath01 * BREATH_RADIUS_AMPLITUDE + dot.influence * CURSOR_RADIUS_BOOST
      const opacity = Math.min(
        MAX_OPACITY,
        BREATH_OPACITY_MIN +
          breath01 * (BREATH_OPACITY_MAX - BREATH_OPACITY_MIN) +
          dot.influence * CURSOR_OPACITY_BOOST
      )

      ctx.beginPath()
      ctx.fillStyle = `rgba(${goldRgb}, ${opacity.toFixed(3)})`
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Reduced-motion (and pre-loop) rendering: one motionless frame at rest
  // values. Under reduced motion no rAF loop and no pointer listeners are ever
  // started, so the field is a completely static texture.
  function drawStatic() {
    ctx.clearRect(0, 0, cssWidth, cssHeight)
    const restOpacity = (BREATH_OPACITY_MIN + BREATH_OPACITY_MAX) / 2
    ctx.fillStyle = `rgba(${goldRgb}, ${restOpacity.toFixed(3)})`
    for (const dot of dots) {
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, dot.baseRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect()
    cssWidth = rect.width
    cssHeight = rect.height
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    canvas.width = Math.round(cssWidth * dpr)
    canvas.height = Math.round(cssHeight * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    buildDots()
    drawStatic() // guarantees a painted field even if the loop never runs
  }

  // --- animation loop, gated on tab visibility AND this layer's own intersection ---
  let rafId: number | null = null
  let tabVisible = document.visibilityState === 'visible'
  let inView = false
  let lastFrameTime = 0
  let startTime = 0

  function shouldRun() {
    return motionEnabled && tabVisible && inView
  }

  function loop(now: number) {
    rafId = requestAnimationFrame(loop)
    if (!startTime) startTime = now
    if (now - lastFrameTime < TARGET_FRAME_MS) return
    lastFrameTime = now
    drawFrame(now - startTime)
  }

  function startLoop() {
    if (rafId != null || !shouldRun()) return
    lastFrameTime = 0
    rafId = requestAnimationFrame(loop)
  }

  function stopLoop() {
    if (rafId != null) cancelAnimationFrame(rafId)
    rafId = null
  }

  function syncLoop() {
    if (shouldRun()) startLoop()
    else stopLoop()
  }

  // --- pointer tracking (hover-capable fine pointers only) ---
  // The canvas is pointer-events:none so real UI on top stays clickable, which
  // also means it can never receive pointer events itself — so tracking is on
  // window, where events still arrive after hit-testing the real element under
  // the cursor. Reads are throttled to one per frame.
  let trackingAttached = false
  let pointerFramePending = false

  function handlePointerMove(e: PointerEvent) {
    if (pointerFramePending) return
    pointerFramePending = true
    requestAnimationFrame(() => {
      pointerFramePending = false
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active =
        pointer.x >= -CURSOR_RADIUS_PX &&
        pointer.x <= rect.width + CURSOR_RADIUS_PX &&
        pointer.y >= -CURSOR_RADIUS_PX &&
        pointer.y <= rect.height + CURSOR_RADIUS_PX
    })
  }

  function handleWindowPointerLeave() {
    // Clearing `active` only sets each dot's TARGET to 0; the lerp still eases
    // them back down over subsequent frames, so the cursor leaving never snaps.
    pointer.active = false
  }

  function syncTracking() {
    const wantTracking = canReact && motionEnabled
    if (wantTracking && !trackingAttached) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true })
      window.addEventListener('pointerleave', handleWindowPointerLeave)
      trackingAttached = true
    } else if (!wantTracking && trackingAttached) {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handleWindowPointerLeave)
      trackingAttached = false
      pointer.active = false
    }
  }

  function handleVisibilityChange() {
    tabVisible = document.visibilityState === 'visible'
    syncLoop()
  }

  function handleHoverChange() {
    canReact = hoverMq.matches
    syncTracking()
  }

  function handleMotionChange() {
    motionEnabled = !motionMq.matches
    syncTracking()
    if (motionEnabled) {
      syncLoop()
    } else {
      stopLoop()
      drawStatic()
    }
  }

  readGoldColor()
  resize()
  syncTracking()

  const resizeObserver = new ResizeObserver(() => resize())
  resizeObserver.observe(canvas)

  // Pauses the loop once the band scrolls out of view, so scrolling down the
  // listing costs nothing.
  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting
      syncLoop()
    },
    { threshold: 0 }
  )
  intersectionObserver.observe(canvas)

  // next-themes swaps the <html> class at runtime with no reload, so re-read
  // the resolved --gold rather than leaving dots stale against a new theme.
  const themeObserver = new MutationObserver(() => {
    readGoldColor()
    if (!shouldRun()) drawStatic()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  document.addEventListener('visibilitychange', handleVisibilityChange)
  hoverMq.addEventListener('change', handleHoverChange)
  motionMq.addEventListener('change', handleMotionChange)

  syncLoop()

  return () => {
    stopLoop()
    resizeObserver.disconnect()
    intersectionObserver.disconnect()
    themeObserver.disconnect()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    hoverMq.removeEventListener('change', handleHoverChange)
    motionMq.removeEventListener('change', handleMotionChange)
    if (trackingAttached) {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handleWindowPointerLeave)
    }
  }
}

export function PublicHalftoneBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof window === 'undefined' || !window.matchMedia) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    return setupHalftone(canvas, ctx)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      // `fixed inset-0` sizes the canvas to the viewport, not the document —
      // it covers the page at any scroll position without ever needing to know
      // total page height, so it stays correct as inventory (and page length)
      // grows. w-full/h-full are NOT redundant with inset-0 here: canvas is a
      // replaced element, and replaced elements don't stretch to fill opposing
      // insets the way normal boxes do — without an explicit size, this silently
      // collapses to the browser's intrinsic canvas default (300x150) pinned at
      // the top-left instead of covering the viewport. pointer-events-none is
      // the hard guarantee that buttons, chips, cards and links above stay
      // fully clickable. -z-10 keeps the layer behind all in-flow and
      // positioned content WITHOUT wrapping children in a new stacking context
      // (fixed positioning doesn't require a positioned ancestor, and no
      // ancestor here sets transform/filter/contain to hijack it), so the
      // sticky header / Modal / Toast ordering is completely untouched: this
      // paints below content but above the page background propagated from
      // body.
      className="pointer-events-none fixed inset-0 h-full w-full -z-10"
    />
  )
}
