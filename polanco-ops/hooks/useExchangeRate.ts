'use client'

import { useQuery } from '@tanstack/react-query'
import type { ExchangeRateResult } from '@/lib/exchangeRate'

export function useExchangeRate() {
  return useQuery({
    queryKey: ['exchangeRate'],
    queryFn: async (): Promise<ExchangeRateResult> => {
      const response = await fetch('/api/exchange-rate')
      if (!response.ok) throw new Error('Failed to fetch exchange rate')
      return response.json()
    },
    staleTime: 60 * 60 * 1000, // refetch client-side every 1 hour
    retry: 1,
  })
}
