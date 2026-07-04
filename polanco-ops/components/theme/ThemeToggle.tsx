'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

/**
 * Shared one-tap Light/Dark toggle, mounted in both the Ops Hub TopBar and the
 * Showcase PublicHeader. It flips between the two resolved states (the third
 * "System" option lives only in the full Settings picker).
 *
 * The visible glyph is chosen purely with CSS via the `.dark` ancestor class
 * (Sun shown in light, Moon in dark) rather than client state — so there is no
 * mounted-guard, no hydration mismatch, and no flash: next-themes' pre-paint
 * script sets `.dark` before first paint, and CSS reveals the correct icon
 * immediately. The click handler reads `resolvedTheme` (only evaluated on the
 * client, at click time) to decide which way to flip.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
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
