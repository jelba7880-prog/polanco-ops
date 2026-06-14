export type CarStatus = 'available' | 'reserved' | 'sold' | 'in_transit'
export type CarCondition = 'New' | 'Foreign Used' | 'Locally Used'
export type UserRole = 'admin' | 'staff'
export type LeadSource = 'whatsapp' | 'instagram' | 'walkin' | 'call' | 'referral'
export type LeadStatus = 'new' | 'contacted' | 'test_drive' | 'negotiating' | 'closed_won' | 'closed_lost'

export interface CarImage {
  id: string
  car_id: string
  url: string
  sort_order: number
  is_cover: boolean
  created_at: string
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
