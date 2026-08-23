import { MessageCircle, Camera, Store, Phone, Users, Globe, type LucideIcon } from 'lucide-react'
import type { LeadSource } from '@/lib/supabase/types'

// Compile-time guard: fails the build if ALL_LEAD_SOURCES (lib/supabase/types.ts)
// and leads_source_check (supabase/migrations/20260822000000_add_website_lead_source.sql)
// have drifted apart. If this line stops compiling, update whichever one is
// stale — never widen this hardcoded list without also widening the migration.
// Wrapped in tuples so the check doesn't distribute over the union members
// (a bare `A extends B` would silently pass here even when they diverge).
type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
type _LeadSourcesMatchDbConstraint = AssertEqual<
  LeadSource,
  'whatsapp' | 'instagram' | 'walkin' | 'call' | 'referral' | 'website'
>
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- never read; exists solely to force the compile-time check above
const _assertLeadSourcesMatchDbConstraint: _LeadSourcesMatchDbConstraint = true

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
  // Created only by the automated showcase enquiry flow (create-from-showcase),
  // never manually — so it's in the config for display but left out of
  // LEAD_SOURCES below, which powers the manual Add Lead chip picker.
  website: { value: 'website', icon: Globe, color: 'text-gold-text', label: 'Website', shortLabel: 'Website' },
}

/** Ordered list for rendering chip rows / option lists. */
export const LEAD_SOURCES: LeadSourceConfig[] = [
  LEAD_SOURCE_CONFIG.whatsapp,
  LEAD_SOURCE_CONFIG.instagram,
  LEAD_SOURCE_CONFIG.walkin,
  LEAD_SOURCE_CONFIG.call,
  LEAD_SOURCE_CONFIG.referral,
]
