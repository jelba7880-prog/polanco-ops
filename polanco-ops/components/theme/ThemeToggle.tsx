'use client'

import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeToggle } from './useThemeToggle'

interface ThemeToggleProps {
  className?: string
}

/**
 * Shared one-tap Light ⇄ dark-family toggle, mounted in both the Ops Hub TopBar
 * and the Showcase PublicHeader. Binary only — the full Light/Dim/Dark/System
 * picker lives in Settings. See useThemeToggle for the direction logic.
 *
 * The visible glyph is chosen purely with CSS via the dark-family ancestor
 * class — the `dark:` variant matches both `.dark` and `.dim` (see globals.css),
 * so Sun shows in Light and Moon shows in either dark-family variant — rather
 * than client state. That means no mounted-guard, no hydration mismatch, and no
 * flash: next-themes' pre-paint script sets the class before first paint and CSS
 * reveals the correct icon immediately. The click handler reads the resolved
 * theme (client-only, at click time) to decide direction.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { toggle } = useThemeToggle()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted transition-all duration-150 ease-out active:scale-[0.97]',
        className
      )}
    >
      <Sun size={18} className="dark:hidden" />
      <Moon size={18} className="hidden dark:block" />
    </button>
  )
}
