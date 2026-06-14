import { formatDistanceToNow, format } from 'date-fns'

// --- Price formatting ---

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function usdToNgn(usd: number, rate: number): number {
  return Math.round(usd * rate)
}

// --- Mileage ---

export function formatMileage(km: number): string {
  if (km === 0) return '0 km'
  return `${new Intl.NumberFormat('en-US').format(km)} km`
}

// --- Dates ---

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

// --- Phone normalization ---
// Normalizes Nigerian numbers to E.164 format for Twilio
// Handles: 08012345678, +2348012345678, 2348012345678

export function normalizeNigerianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')

  if (digits.startsWith('234') && digits.length === 13) {
    return `+${digits}`
  }

  if (digits.startsWith('0') && digits.length === 11) {
    return `+234${digits.slice(1)}`
  }

  if (digits.length === 10) {
    return `+234${digits}`
  }

  // Return as-is with + if already looks international
  return raw.startsWith('+') ? raw : `+${digits}`
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizeNigerianPhone(phone)
  // Format: +234 801 234 5678
  const digits = normalized.replace('+234', '')
  if (digits.length === 10) {
    return `+234 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return normalized
}

// --- Car display helpers ---

export function formatCarTitle(make: string, model: string, year: number): string {
  return `${year} ${make} ${model}`
}

export function formatConditionLabel(condition: string): string {
  return condition // already human-readable from schema
}
