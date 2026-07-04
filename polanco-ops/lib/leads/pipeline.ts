import type { LeadStatus } from '@/lib/supabase/types'

export interface PipelineStage {
  status: LeadStatus
  label: string
  collapsible?: boolean
}

/**
 * Single source of truth for stage order/labels — shared by the mobile
 * grouped list and the desktop Kanban board so they never drift apart.
 */
export const PIPELINE_STAGES: PipelineStage[] = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'test_drive', label: 'Test Drive' },
  { status: 'negotiating', label: 'Negotiating' },
  { status: 'closed_won', label: 'Closed Won ✓', collapsible: true },
  { status: 'closed_lost', label: 'Closed Lost ✗', collapsible: true },
]

export const STAGE_COLORS: Record<LeadStatus, string> = {
  new: 'bg-navy-tint text-navy',
  contacted: 'bg-gold-tint text-gold-deep',
  // Test Drive has no semantic token in the palette, so it keeps a purple accent
  // via Tailwind's scale with an explicit dark-mode pairing (the light lavender
  // fill would otherwise stay bright on the dark surface).
  test_drive: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
  negotiating: 'bg-warning-tint text-warning',
  closed_won: 'bg-success-tint text-success',
  closed_lost: 'bg-neutral-tint text-neutral-tag',
}
