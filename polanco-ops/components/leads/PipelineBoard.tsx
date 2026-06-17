'use client'

import { LeadCard } from '@/components/leads/LeadCard'
import { PIPELINE_STAGES, STAGE_COLORS } from '@/lib/leads/pipeline'
import type { Lead, LeadStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface PipelineBoardProps {
  grouped: Record<LeadStatus, Lead[]>
}

// Closed Won/Lost are historical record, not active pipeline — they stay
// out of the board and remain reachable via the mobile list / lead detail.
const BOARD_STAGES = PIPELINE_STAGES.filter((stage) => !stage.collapsible)

export function PipelineBoard({ grouped }: PipelineBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {BOARD_STAGES.map(({ status, label }) => {
        const stageLeads = grouped[status] ?? []

        return (
          <div key={status} className="flex-1 min-w-[260px] flex flex-col">
            <div className="flex items-center gap-2 mb-3 px-1">
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
