export type CarStatus = 'available' | 'reserved' | 'sold' | 'in_transit'
// Lifecycle is a separate dimension from the sales-status (CarStatus) above:
// 'active' shows in main Inventory, 'archived' lives in the Archived tab and is
// restorable, 'deleted' is hidden everywhere in the app but kept in Postgres.
export type CarLifecycleStatus = 'active' | 'archived' | 'deleted'
export type CarCondition = 'New' | 'Foreign Used' | 'Locally Used'
export type UserRole = 'admin' | 'staff'
// Single source of truth for every lead source the app or DB will accept.
// Everything that needs the list of sources — the Zod enum, LEAD_SOURCE_CONFIG,
// and this LeadSource type itself — derives from this one array so a value can
// never again be added to one and silently missed in the others. Must stay in
// sync with `leads_source_check` in supabase/migrations/20260822000000_add_website_lead_source.sql
// (lib/leads/sources.ts asserts this at compile time).
export const ALL_LEAD_SOURCES = ['whatsapp', 'instagram', 'walkin', 'call', 'referral', 'website'] as const
export type LeadSource = (typeof ALL_LEAD_SOURCES)[number]
export type LeadStatus = 'new' | 'contacted' | 'test_drive' | 'negotiating' | 'closed_won' | 'closed_lost'

export interface CarImage {
  id: string
  car_id: string
  url: string
  sort_order: number
  is_cover: boolean
  created_at: string
}

// An image already uploaded to Storage but not yet attached to a car row,
// because no car exists yet (the Add Vehicle flow). Held in form state and
// turned into real car_images rows once the car is created.
export interface PendingCarImage {
  tempId: string
  url: string
  isCover: boolean
}

export interface Car {
  id: string
  slug: string
  make: string
  model: string
  year: number
  body_type: string | null
  color_exterior: string | null
  color_interior: string | null
  mileage_km: number
  condition: CarCondition
  transmission: 'Automatic' | 'Manual' | null
  fuel_type: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | null
  engine_cc: number | null
  horsepower: number | null
  price_usd: number
  status: CarStatus
  lifecycle_status: CarLifecycleStatus
  lifecycle_changed_at: string | null
  // Public showcase opt-out (see public_cars_view). Independent of status and
  // lifecycle_status; has no effect on any Ops Hub list/detail query.
  is_public: boolean
  reserved_for: string | null
  notes: string | null
  added_by: string | null
  created_at: string
  updated_at: string
  car_images?: CarImage[]
}

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
  created_at: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  car_interest: string | null
  car_id: string | null
  source: LeadSource
  status: LeadStatus
  assigned_to: string | null
  notes: string | null
  last_contacted: string | null
  created_at: string
  updated_at: string
  // Joined field from useLeads query
  profiles?: {
    id: string
    full_name: string
    role: string
  } | null
  // Joined field from useLead (detail query only) — the car this lead
  // enquired about, so staff can jump to its full spec sheet.
  cars?: {
    id: string
    slug: string
    year: number
    make: string
    model: string
    price_usd: number
    status: CarStatus
    car_images: Pick<CarImage, 'url' | 'is_cover' | 'sort_order'>[]
  } | null
}

export interface DealSheet {
  id: string
  lead_id: string | null
  car_id: string | null
  car_snapshot: Record<string, unknown>
  client_name: string
  price_usd: number
  exchange_rate: number
  price_ngn: number
  extras: Array<{ label: string; amount_usd: number }>
  total_usd: number
  total_ngn: number
  valid_hours: number
  generated_by: string | null
  created_at: string
  archived_at: string | null
  // Joined field from useDeals query
  profiles?: {
    id: string
    full_name: string
    role: string
  } | null
}

export type ActivityActionType =
  | 'car_status_changed'
  | 'car_created'
  | 'lead_created'
  | 'deal_sheet_generated'
export type ActivityEntityType = 'car' | 'lead' | 'deal_sheet'

export interface ActivityLog {
  id: string
  actor_id: string | null
  action_type: ActivityActionType
  entity_type: ActivityEntityType
  entity_id: string | null
  description: string
  created_at: string
}

// An activity_log row with the acting user's profile joined in on actor_id, as
// read by the Recent Activity feed. `profiles` is null when actor_id is null
// (a past/unattributed event) or the referenced profile no longer exists.
export interface ActivityLogWithActor extends ActivityLog {
  profiles: { full_name: string } | null
}

export type StaffStatus = 'active' | 'pending' | 'deactivated'

/**
 * A staff row enriched with Supabase Auth data (email + account status) that
 * lives only in auth.users, not in profiles. Built server-side for the Settings
 * staff list so it can show emails, "Pending" invites, and deactivated accounts.
 */
export interface StaffMember {
  id: string
  full_name: string
  role: UserRole
  email: string | null
  status: StaffStatus
  created_at: string
}

export interface Settings {
  exchange_rate_usd_ngn: number
  exchange_rate_updated_at: string
  whatsapp_number: string
  business_name: string
  business_address: string
  proforma_validity_hours: number
  twilio_notify_number: string
}
