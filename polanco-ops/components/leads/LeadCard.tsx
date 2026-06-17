'use client'

import Link from 'next/link'
import { differenceInDays } from 'date-fns'
import type { Lead } from '@/lib/supabase/types'
import { LEAD_SOURCE_CONFIG } from '@/lib/leads/sources'
import { formatPhoneDisplay, toDisplayCase, getInitials } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface LeadCardProps {
  lead: Lead
}

export function LeadCard({ lead }: LeadCardProps) {
  const source = LEAD_SOURCE_CONFIG[lead.source]
  const SourceIcon = source.icon

  const daysSinceContact = lead.last_contacted
    ? differenceInDays(new Date(), new Date(lead.last_contacted))
    : null

  const contactIsStale = daysSinceContact !== null && daysSinceContact >= 3

  const assignedInitials = lead.profiles?.full_name
    ? getInitials(lead.profiles.full_name)
    : null

  return (
    <Link
      href={`/leads/${lead.id}`}
      // Softer 0.98 press scale for large cards (vs 0.97 on buttons/chips); same 150ms ease-out.
      className="block bg-white rounded-xl border border-[var(--border)] shadow-card px-4 py-3.5 active:scale-[0.98] transition-transform duration-150 ease-out"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left — main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-inter font-semibold text-sm text-ink truncate">
              {lead.name}
            </p>
            {assignedInitials && (
              <span className="shrink-0 w-5 h-5 rounded-full bg-navy text-white text-[9px] font-inter font-semibold flex items-center justify-center">
                {assignedInitials}
              </span>
            )}
          </div>

          <p className="font-inter text-xs text-ink-muted mb-2">
            {formatPhoneDisplay(lead.phone)}
          </p>

          {lead.car_interest && (
            <p className="font-inter text-xs text-ink-soft truncate mb-2">
              {toDisplayCase(lead.car_interest)}
            </p>
          )}

          <div className="flex items-center gap-3">
            {/* Source */}
            <div className="flex items-center gap-1">
              <SourceIcon size={12} className={source.color} />
              <span className="font-inter text-[10px] text-ink-muted">
                {source.shortLabel}
              </span>
            </div>

            {/* Last contact */}
            {daysSinceContact !== null && (
              <span className={cn(
                'font-inter text-[10px]',
                contactIsStale ? 'text-danger font-medium' : 'text-ink-muted'
              )}>
                {daysSinceContact === 0
                  ? 'Today'
                  : daysSinceContact === 1
                  ? '1 day ago'
                  : `${daysSinceContact}d ago`}
              </span>
            )}
          </div>
        </div>

        {/* Right — chevron */}
        <div className="text-ink-muted mt-1">
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </Link>
  )
}
