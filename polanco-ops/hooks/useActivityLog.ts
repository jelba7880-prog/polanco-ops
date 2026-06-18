'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ActivityLogWithActor } from '@/lib/supabase/types'

const supabase = createClient()

// --- Query keys ---
// Page size is part of the key: mobile (5) and desktop (10) feeds are paginated
// differently, so they must not share a cache entry.
export const activityKeys = {
  all: ['activity_log'] as const,
  feed: (pageSize: number) => [...activityKeys.all, 'feed', pageSize] as const,
}

// --- Fetch one page of the activity feed ---
// Joins each row to the actor's profile for `full_name` (admin-only reveal),
// newest first, using range-based pagination. `from`/`to` are inclusive row
// offsets, so a page of `pageSize` rows spans [page*pageSize, +pageSize-1].
async function fetchActivityPage(
  pageSize: number,
  page: number
): Promise<ActivityLogWithActor[]> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('activity_log')
    .select(`
      *,
      profiles:actor_id (
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return data as ActivityLogWithActor[]
}

/**
 * Recent Activity feed, powered by the activity_log table with infinite scroll.
 *
 * `pageSize` is passed in by the caller (responsive: 5 on mobile, 10 on desktop)
 * and is used for both the first page and every subsequent page. A page that
 * comes back shorter than `pageSize` means the log is exhausted, so there is no
 * next page.
 */
export function useActivityLog(pageSize: number) {
  return useInfiniteQuery({
    queryKey: activityKeys.feed(pageSize),
    queryFn: ({ pageParam }) => fetchActivityPage(pageSize, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < pageSize ? undefined : allPages.length,
  })
}
