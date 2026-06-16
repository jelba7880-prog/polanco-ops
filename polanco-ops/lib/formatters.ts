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

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return ''
  if (phone.includes(' ')) return phone
  const ngMatch = phone.match(/^\+234(\d{3})(\d{3})(\d{4})$/)
  if (ngMatch) return `+234 ${ngMatch[1]} ${ngMatch[2]} ${ngMatch[3]}`
  const usMatch = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/)
  if (usMatch) return `+1 (${usMatch[1]}) ${usMatch[2]}-${usMatch[3]}`
  return phone
}

// --- Car display helpers ---

const AUTOMOTIVE_CASE_MAP: Record<string, string> = {
  // Brands
  'bmw': 'BMW',
  'amg': 'AMG',
  // Drivetrain acronyms
  'awd': 'AWD',
  'rwd': 'RWD',
  'fwd': 'FWD',
  'suv': 'SUV',
  // Ferrari body suffixes
  'gtb': 'GTB',
  'gts': 'GTS',
  'gtr': 'GTR',
  // Mercedes model lines
  'gle': 'GLE',
  'glc': 'GLC',
  'gls': 'GLS',
  'gla': 'GLA',
  'glb': 'GLB',
  'slk': 'SLK',
  'sls': 'SLS',
  'cls': 'CLS',
  'cla': 'CLA',
  'slc': 'SLC',
  // Fuel / powertrain
  'phev': 'PHEV',
  'ev': 'EV',
  'hev': 'HEV',
  // Transmission / all-wheel systems
  '4matic+': '4Matic+',
  '4matic': '4Matic',
  'xdrive': 'xDrive',
  'quattro': 'Quattro',
  // Engine designations
  'v6': 'V6',
  'v8': 'V8',
  'v10': 'V10',
  'v12': 'V12',
}

// Sorted longest-first so prefix matching prefers the most specific key
// (e.g. "4matic+" before "4matic").
const SORTED_PREFIX_KEYS = Object.keys(AUTOMOTIVE_CASE_MAP).sort(
  (a, b) => b.length - a.length
)

function applyAutomotiveCase(titleCasedWord: string): string {
  const lower = titleCasedWord.toLowerCase()

  // Exact match
  if (lower in AUTOMOTIVE_CASE_MAP) return AUTOMOTIVE_CASE_MAP[lower]

  // Prefix match: e.g. "gle43" → "GLE" + "43", "xdrive40i" → "xDrive" + "40i"
  for (const key of SORTED_PREFIX_KEYS) {
    if (lower.startsWith(key) && lower.length > key.length) {
      return AUTOMOTIVE_CASE_MAP[key] + titleCasedWord.slice(key.length)
    }
  }

  return titleCasedWord
}

export function toDisplayCase(input: string | null | undefined): string {
  if (!input) return ''

  // Base title case
  const titleCased = input
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Second pass: fix known automotive tokens
  return titleCased
    .split(' ')
    .map(applyAutomotiveCase)
    .join(' ')
}

export function formatCarTitle(make: string, model: string, year: number): string {
  return `${year} ${toDisplayCase(make)} ${toDisplayCase(model)}`
}

export function formatConditionLabel(condition: string): string {
  return condition // already human-readable from schema
}
