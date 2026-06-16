'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DealSheet } from '@/lib/supabase/types'

const supabase = createClient()

export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  detail: (id: string) => [...dealKeys.all, 'detail', id] as const,
}

async function fetchDeals(): Promise<DealSheet[]> {
  const { data, error } = await supabase
    .from('deal_sheets')
    .select(`
      *,
      profiles:generated_by (
        id,
        full_name,
        role
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as DealSheet[]
}

export function useDeals() {
  return useQuery({
    queryKey: dealKeys.lists(),
    queryFn: fetchDeals,
  })
}
