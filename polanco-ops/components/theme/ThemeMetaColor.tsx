'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

/**
 * Keeps <meta name="theme-color"> in sync with the ACTIVE theme's --bg-base so
 * the installed PWA's in-app browser chrome (iOS status bar tint, Android
 * address-bar/nav colour) updates live when the user toggles the theme. The
 * value is read from the resolved CSS variable rather than hardcoded, so it
 * always tracks the palette in globals.css.
 *
 * Note: manifest.json's static `theme_color` still only governs the initial
 * install splash screen — the OS reads the manifest once at install time and
 * won't re-read it on theme change. That's an expected platform limitation;
 * the live <meta> tag here is what actually updates the running-app chrome.
 */
export function ThemeMetaColor() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    // Read the active page background straight from the resolved CSS variable so
    // this can never drift from the palette. next-themes has already stamped the
    // .dark class (or removed it) by the time this effect runs.
    const bg = getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-base')
      .trim()
    if (!bg) return

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', bg)
  }, [resolvedTheme])

  return null
}
