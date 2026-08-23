// Pure validation for the USD→NGN exchange rate, shared between the client
// (SettingsClient's save form, useSettings' read of the cached value) and the
// server (getExchangeRate's read of the cache and of the live API response).
// Deliberately dependency-free so it's safe to import from a 'use client' file.

// Below ₦100 or above ₦10,000 per $1 is outside anything the naira has
// plausibly traded at — a value outside this band is almost certainly a typo
// or a bad API response, not a real rate.
export const EXCHANGE_RATE_MIN = 100
export const EXCHANGE_RATE_MAX = 10000

// Used when no valid rate is available from any source (cache, live fetch)
// so a broken value is never surfaced instead.
export const EXCHANGE_RATE_DEFAULT = 1580

export function isValidExchangeRate(value: number): boolean {
  return Number.isFinite(value) && value >= EXCHANGE_RATE_MIN && value <= EXCHANGE_RATE_MAX
}

/** Parses and validates a rate from user input or a stored/API value. Returns null, never NaN or 0, if invalid. */
export function parseExchangeRate(raw: string | number | null | undefined): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw)
  return isValidExchangeRate(n) ? n : null
}
