import { createClient } from '@/lib/supabase/server'

export interface ExchangeRateResult {
  rate: number
  source: 'cached' | 'fresh' | 'fallback'
  updatedAt: string
}

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000 // 4 hours

export async function getExchangeRate(): Promise<ExchangeRateResult> {
  const supabase = await createClient()

  // Read cached values from settings table
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['exchange_rate_usd_ngn', 'exchange_rate_updated_at'])

  const settingsMap = Object.fromEntries(
    (settings ?? []).map((s) => [s.key, s.value])
  )

  const cachedRate = Number(settingsMap.exchange_rate_usd_ngn ?? 1580)
  const cachedUpdatedAt = settingsMap.exchange_rate_updated_at ?? ''

  // Check if cache is still fresh
  if (cachedUpdatedAt) {
    const lastUpdate = new Date(cachedUpdatedAt).getTime()
    const now = Date.now()
    if (now - lastUpdate < CACHE_DURATION_MS) {
      return {
        rate: cachedRate,
        source: 'cached',
        updatedAt: cachedUpdatedAt,
      }
    }
  }

  // Cache is stale — fetch fresh rate
  try {
    const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID
    if (!appId) throw new Error('OPEN_EXCHANGE_RATES_APP_ID not set')

    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD&symbols=NGN`,
      { next: { revalidate: 0 } } // always fetch fresh
    )

    if (!response.ok) throw new Error(`API error: ${response.status}`)

    const data = await response.json()
    const freshRate = data.rates?.NGN

    if (!freshRate || typeof freshRate !== 'number') {
      throw new Error('Invalid rate in API response')
    }

    const updatedAt = new Date().toISOString()

    // Update settings table
    await supabase
      .from('settings')
      .upsert([
        { key: 'exchange_rate_usd_ngn', value: String(Math.round(freshRate)) },
        { key: 'exchange_rate_updated_at', value: updatedAt },
      ])

    return { rate: Math.round(freshRate), source: 'fresh', updatedAt }
  } catch (err) {
    console.error('Exchange rate fetch failed, using cached:', err)

    // Return cached value as fallback — never crash
    return {
      rate: cachedRate,
      source: 'fallback',
      updatedAt: cachedUpdatedAt || new Date().toISOString(),
    }
  }
}
