'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { DealSheet } from '@/lib/supabase/types'

const supabase = createClient()

export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (archived: boolean) => [...dealKeys.lists(), archived] as const,
  detail: (id: string) => [...dealKeys.all, 'detail', id] as const,
}

async function fetchDeals(archived: boolean): Promise<DealSheet[]> {
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
    .filter('archived_at', archived ? 'not.is' : 'is', null)

  if (error) throw error
  return data as DealSheet[]
}

export function useDeals(archived = false) {
  return useQuery({
    queryKey: dealKeys.list(archived),
    queryFn: () => fetchDeals(archived),
  })
}

export function useSetDealArchived() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('deal_sheets')
        .update({ archived_at: archived ? new Date().toISOString() : null })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.all })
    },
  })
}
