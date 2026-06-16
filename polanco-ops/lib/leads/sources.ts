import { MessageCircle, Camera, Store, Phone, Users, type LucideIcon } from 'lucide-react'
import type { LeadSource } from '@/lib/supabase/types'

export interface LeadSourceConfig {
  value: LeadSource
  icon: LucideIcon
  /** Brand color for the icon — shared between the pipeline card and the input chips. */
  color: string
  /** Full label used by the Add Lead chips and the lead detail view. */
  label: string
  /** Compact label used on the space-constrained pipeline cards. */
  shortLabel: string
}

/**
 * Single source of truth for how each lead source is presented — icon, color
 * and labels. Consumed by the LeadCard pipeline icon, the lead detail view and
 * the Add Lead source chips so the input and display experiences stay in sync.
 */
export const LEAD_SOURCE_CONFIG: Record<LeadSource, LeadSourceConfig> = {
  whatsapp: { value: 'whatsapp', icon: MessageCircle, color: 'text-green-600', label: 'WhatsApp', shortLabel: 'WhatsApp' },
  instagram: { value: 'instagram', icon: Camera, color: 'text-pink-500', label: 'Instagram', shortLabel: 'Instagram' },
  walkin: { value: 'walkin', icon: Store, color: 'text-navy', label: 'Walk-in', shortLabel: 'Walk-in' },
  call: { value: 'call', icon: Phone, color: 'text-warning', label: 'Phone Call', shortLabel: 'Call' },
  referral: { value: 'referral', icon: Users, color: 'text-purple-500', label: 'Referral', shortLabel: 'Referral' },
}

/** Ordered list for rendering chip rows / option lists. */
export const LEAD_SOURCES: LeadSourceConfig[] = [
  LEAD_SOURCE_CONFIG.whatsapp,
  LEAD_SOURCE_CONFIG.instagram,
  LEAD_SOURCE_CONFIG.walkin,
  LEAD_SOURCE_CONFIG.call,
  LEAD_SOURCE_CONFIG.referral,
]
