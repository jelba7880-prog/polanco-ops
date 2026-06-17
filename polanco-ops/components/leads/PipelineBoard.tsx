'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { LeadCard } from '@/components/leads/LeadCard'
import { PIPELINE_STAGES, STAGE_COLORS } from '@/lib/leads/pipeline'
import type { Lead, LeadStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface PipelineBoardProps {
  grouped: Record<LeadStatus, Lead[]>
}

export function PipelineBoard({ grouped }: PipelineBoardProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    closed_won: true,
    closed_lost: true,
  })

  function toggleCollapse(status: string) {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {PIPELINE_STAGES.map(({ status, label, collapsible }) => {
        const stageLeads = grouped[status] ?? []
        const isCollapsed = Boolean(collapsible && collapsed[status])

        if (isCollapsed) {
          return (
            <button
              key={status}
              onClick={() => toggleCollapse(status)}
              className="shrink-0 w-20 flex flex-col items-center gap-2 pt-3 pb-4 rounded-xl border border-[var(--border)] bg-surface-muted/60 hover:bg-surface-muted transition-colors"
            >
              <span className={cn(
                'inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-inter font-semibold',
                STAGE_COLORS[status]
              )}>
                {stageLeads.length}
              </span>
              <span
                className="font-inter text-xs font-semibold text-ink whitespace-nowrap [writing-mode:vertical-rl]"
              >
                {label}
              </span>
              <ChevronRight size={14} className="text-ink-muted" />
            </button>
          )
        }

        return (
          <div key={status} className="shrink-0 w-[290px] flex flex-col">
            <button
              onClick={() => collapsible && toggleCollapse(status)}
              className={cn(
                'flex items-center justify-between w-full mb-3 px-1',
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
              {collapsible && <ChevronDown size={14} className="text-ink-muted" />}
            </button>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-220px)] px-1">
              {stageLeads.length === 0 && (
                <p className="font-inter text-xs text-ink-muted px-1">No leads</p>
              )}
              {stageLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
