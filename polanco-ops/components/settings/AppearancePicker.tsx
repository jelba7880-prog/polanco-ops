'use client'

import { useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
] as const

// Hydration-safe "have we mounted on the client yet" flag. Returns false on the
// server AND during the hydration render (so markup matches), then true once
// committed — without a setState-in-effect. next-themes only knows the stored
// preference on the client, so the active highlight is gated on this.
const noopSubscribe = () => () => {}
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

/**
 * Full Light/Dark/System control for Settings > Appearance (admin-gated screen).
 * Unlike the header toggle it exposes the third "System" choice, and it reflects
 * the stored PREFERENCE (`theme`) rather than the resolved value — so picking
 * System stays highlighted as System even though it resolves to light or dark.
 */
export function AppearancePicker() {
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()

  return (
    <div
      role="radiogroup"
      aria-label="Theme preference"
      className="flex items-center gap-1 rounded-lg bg-surface-muted p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = hydrated && theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 font-inter text-xs font-medium transition-all duration-150 ease-out active:scale-[0.97]',
              isActive
                ? 'bg-base text-ink shadow-card'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
