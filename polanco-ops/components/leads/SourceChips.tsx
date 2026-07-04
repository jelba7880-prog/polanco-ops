'use client'

import type { LeadSource } from '@/lib/supabase/types'
import { LEAD_SOURCES } from '@/lib/leads/sources'
import { cn } from '@/lib/utils'

interface SourceChipsProps {
  label?: string
  value: LeadSource
  onChange: (value: LeadSource) => void
  error?: string
}

/**
 * Single-select row of tappable icon chips for the lead Source field. Wraps to a
 * second line on narrow screens rather than scrolling. Each chip is a real
 * <button>, so it inherits the app-wide active:scale press feedback and its
 * prefers-reduced-motion handling from globals.css for free.
 */
export function SourceChips({ label, value, onChange, error }: SourceChipsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="font-inter text-sm font-medium text-ink">{label}</span>
      )}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {LEAD_SOURCES.map(({ value: source, icon: Icon, color, label: chipLabel }) => {
          const isSelected = value === source

          return (
            <button
              key={source}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(source)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 font-inter text-xs font-medium transition-all duration-150 ease-out active:scale-[0.97]',
                isSelected
                  ? 'border-gold bg-gold-tint text-gold-deep'
                  : 'border-[var(--border)] bg-base text-ink-muted hover:border-ink-soft'
              )}
            >
              <Icon size={14} className={color} />
              {chipLabel}
            </button>
          )
        })}
      </div>
      {error && <p className="font-inter text-xs text-danger">{error}</p>}
    </div>
  )
}
