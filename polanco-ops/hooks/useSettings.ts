'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Settings } from '@/lib/supabase/types'

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async (): Promise<Settings> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')

      if (error) throw error

      // Convert array of {key, value} rows to a typed Settings object
      const map = Object.fromEntries(data.map((row) => [row.key, row.value]))

      return {
        exchange_rate_usd_ngn: Number(map.exchange_rate_usd_ngn ?? 1580),
        exchange_rate_updated_at: map.exchange_rate_updated_at ?? '',
        whatsapp_number: map.whatsapp_number ?? '',
        business_name: map.business_name ?? 'Polanco Exotic Cars',
        business_address: map.business_address ?? '',
        proforma_validity_hours: Number(map.proforma_validity_hours ?? 48),
        twilio_notify_number: map.twilio_notify_number ?? '',
      }
    },
    staleTime: 4 * 60 * 60 * 1000, // 4 hours — refetch in background, matches exchange rate cache window
  })
}
