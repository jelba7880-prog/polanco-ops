'use client'

import { useCallback } from 'react'
import { useTheme } from 'next-themes'
import {
  DARK_VARIANT_STORAGE_KEY,
  DEFAULT_DARK_VARIANT,
  THEME,
  isDarkFamily,
  isDarkVariant,
} from '@/lib/theme'

/**
 * Shared logic for the one-tap quick toggle mounted in both the TopBar and the
 * PublicHeader — kept here so the binary behaviour lives in one place, not
 * duplicated per header.
 *
 * The toggle is strictly binary: Light ⇄ dark-family. It never cycles into the
 * three/four discrete options (that's the Settings picker's job) and never
 * lands on true-black 'dark' unless the user last chose it there:
 *  - If a dark-family variant is showing (Dim, true-black, or System→OS-dark),
 *    tap → Light.
 *  - If Light is showing, tap → the user's last-chosen dark variant, defaulting
 *    to Dim when none has been set (so new users get the softer Dim, never the
 *    harsh true-black, from the quick toggle).
 */
export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = isDarkFamily(resolvedTheme)

  const toggle = useCallback(() => {
    if (isDarkFamily(resolvedTheme)) {
      setTheme(THEME.light)
      return
    }
    let variant = DEFAULT_DARK_VARIANT
    try {
      const stored = localStorage.getItem(DARK_VARIANT_STORAGE_KEY)
      if (isDarkVariant(stored)) variant = stored
    } catch {
      // localStorage unavailable — fall back to the default Dim variant.
    }
    setTheme(variant)
  }, [resolvedTheme, setTheme])

  return { isDark, toggle }
}
