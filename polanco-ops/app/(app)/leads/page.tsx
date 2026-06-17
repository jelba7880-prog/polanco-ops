'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import { useLeads } from '@/hooks/useLeads'
import { LeadCard } from '@/components/leads/LeadCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { FAB } from '@/components/ui/FAB'
import type { Lead, LeadStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const PIPELINE_STAGES: {
  status: LeadStatus
  label: string
  collapsible?: boolean
}[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'test_drive', label: 'Test Drive' },
  { status: 'negotiating', label: 'Negotiating' },
  { status: 'closed_won', label: 'Closed Won ✓', collapsible: true },
  { status: 'closed_lost', label: 'Closed Lost ✗', collapsible: true },
]

const STAGE_COLORS: Record<LeadStatus, string> = {
  new: 'bg-navy-tint text-navy',
  contacted: 'bg-gold-tint text-gold-deep',
  test_drive: 'bg-purple-50 text-purple-600',
  negotiating: 'bg-warning-tint text-warning',
  closed_won: 'bg-success-tint text-success',
  closed_lost: 'bg-neutral-tint text-neutral-tag',
}

export default function LeadsPage() {
  const { data: leads, isLoading, error } = useLeads()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    closed_won: true,
    closed_lost: true,
  })

  const grouped = useMemo(() => {
    if (!leads) return {} as Record<LeadStatus, Lead[]>
    return leads.reduce<Record<LeadStatus, Lead[]>>((acc, lead) => {
      if (!acc[lead.status]) acc[lead.status] = []
      acc[lead.status].push(lead)
      return acc
    }, {} as Record<LeadStatus, Lead[]>)
  }, [leads])

  const totalActive = useMemo(() => {
    if (!leads) return 0
    return leads.filter(
      (l) => l.status !== 'closed_won' && l.status !== 'closed_lost'
    ).length
  }, [leads])

  function toggleCollapse(status: string) {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-surface-muted rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-danger font-inter">Failed to load leads.</p>
      </div>
    )
  }

  const hasAnyLeads = leads && leads.length > 0

  return (
    <div className="px-4 py-6 pb-8">
      {/* Summary */}
      {hasAnyLeads && (
        <p className="font-inter text-xs text-ink-muted mb-5">
          {totalActive} active lead{totalActive !== 1 ? 's' : ''}
        </p>
      )}

      {!hasAnyLeads && (
        <EmptyState
          icon={Users}
          title="No leads yet"
          description="Add your first lead to start tracking enquiries."
        />
      )}

      {/* Pipeline stages */}
      {hasAnyLeads && (
        <div className="flex flex-col gap-6">
          {PIPELINE_STAGES.map(({ status, label, collapsible }) => {
            const stageLeads = grouped[status] ?? []
            if (stageLeads.length === 0) return null

            const isCollapsed = collapsible && collapsed[status]

            return (
              <div key={status}>
                {/* Stage header */}
                <button
                  onClick={() => collapsible && toggleCollapse(status)}
                  className={cn(
                    'flex items-center justify-between w-full mb-3',
                    // Only the collapsible headers actually do anything on tap, so
                    // press feedback is scoped to them (matches buttons elsewhere).
                    collapsible
                      ? 'cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]'
                      : 'cursor-default'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-inter font-semibold',
                      STAGE_COLORS[status]
                    )}>
                      {stageLeads.length}
                    </span>
                    <h2 className="font-inter text-sm font-semibold text-ink">
                      {label}
                    </h2>
                  </div>
                  {collapsible && (
                    isCollapsed
                      ? <ChevronRight size={14} className="text-ink-muted" />
                      : <ChevronDown size={14} className="text-ink-muted" />
                  )}
                </button>

                {/* Lead cards */}
                {!isCollapsed && (
                  <div className="flex flex-col gap-2">
                    {stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* FAB */}
      <FAB href="/leads/add" label="Add Lead" />
    </div>
  )
}
