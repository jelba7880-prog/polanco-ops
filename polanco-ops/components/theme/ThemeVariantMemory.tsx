'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { DARK_VARIANT_STORAGE_KEY, isDarkVariant } from '@/lib/theme'

/**
 * Remembers the user's last explicitly-chosen dark-family variant ('dim' or
 * 'black') so the binary quick toggle can return to it when flipping back from
 * Light. Mounted once under the ThemeProvider; the effect only writes
 * localStorage (no setState) so it stays lint-clean. Choosing Light or System
 * intentionally does NOT overwrite the remembered variant.
 */
export function ThemeVariantMemory() {
  const { theme } = useTheme()

  useEffect(() => {
    if (isDarkVariant(theme)) {
      try {
        localStorage.setItem(DARK_VARIANT_STORAGE_KEY, theme)
      } catch {
        // localStorage unavailable (private mode / blocked) — the toggle just
        // falls back to the default variant, which is acceptable.
      }
    }
  }, [theme])

  return null
}
