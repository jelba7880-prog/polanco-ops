'use client'

import { useEffect, useRef, useState } from 'react'

interface UseCountUpOptions {
  /** Total count-up duration in ms. */
  duration?: number
  /** Wait this long before counting starts, so the count stays in sync with a
   *  staggered CSS entrance whose animation-delay is the same value. */
  delay?: number
}

/**
 * Animates a whole number from 0 up to `value` using requestAnimationFrame —
 * no animation library. Eases out so the count decelerates into its final
 * value. Honours prefers-reduced-motion by jumping straight to `value`.
 *
 * The `delay` keeps the count synchronised with the card's entrance stagger:
 * the RAF loop doesn't start until the card is actually fading in, so the user
 * sees it count from 0 rather than arriving nearly-finished the moment the card
 * appears.
 */
export function useCountUp(
  value: number,
  { duration = 600, delay = 0 }: UseCountUpOptions = {}
): number {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number>(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || duration <= 0) {
      // Skip straight to the final value — no counting under reduced motion.
      frameRef.current = requestAnimationFrame(() => setDisplay(value))
      return () => cancelAnimationFrame(frameRef.current)
    }

    let startTime: number | null = null

    const tick = (now: number) => {
      if (startTime === null) startTime = now
      const progress = Math.min((now - startTime) / duration, 1)
      // easeOutCubic — fast then settling, reads as a natural count-up. On the
      // first frame progress is 0, which renders 0 and resets any prior value.
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(value)
      }
    }

    timeoutRef.current = setTimeout(() => {
      frameRef.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timeoutRef.current)
      cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration, delay])

  return display
}
