'use client'

import { useEffect, useRef, useState } from 'react'
import { Car, Users, FileText, Loader2 } from 'lucide-react'
import { useActivityLog } from '@/hooks/useActivityLog'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { formatRelativeDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { ActivityEntityType, ActivityLogWithActor } from '@/lib/supabase/types'

const ACTIVITY_ICONS: Record<ActivityEntityType, typeof Car> = {
  car: Car,
  lead: Users,
  deal_sheet: FileText,
}

const ACTIVITY_COLORS: Record<ActivityEntityType, string> = {
  car: 'text-ink-muted',
  lead: 'text-navy',
  deal_sheet: 'text-gold-deep',
}

// Initial/per-page size follows the same lg: breakpoint (1024px) the Dashboard
// stat grid uses: 5 rows on mobile, 10 on desktop. Read once on mount so the
// page size stays stable for the session (resizing won't re-key the query).
function getInitialPageSize(): number {
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) return 10
  return 5
}

export function ActivityFeed() {
  const [pageSize] = useState(getInitialPageSize)
  const { data: currentUser } = useCurrentUser()
  const isAdmin = currentUser?.role === 'admin'

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useActivityLog(pageSize)

  // Admin-only: which rows are expanded to reveal the actor. Keyed by row id.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Intersection observer on the bottom sentinel — fetch the next page as it
  // scrolls into view. One mechanism only; there is no "load more" button.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '120px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const items: ActivityLogWithActor[] = data?.pages.flat() ?? []

  // Nothing yet (first load or genuinely empty) — match the prior feed, which
  // simply rendered nothing rather than a skeleton.
  if (isLoading || items.length === 0) return null

  return (
    <div>
      <p className="font-inter text-xs font-medium text-ink-muted mb-3">RECENT ACTIVITY</p>
      <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
        {items.map((item, i) => {
          const Icon = ACTIVITY_ICONS[item.entity_type]
          const color = ACTIVITY_COLORS[item.entity_type]
          const isOpen = isAdmin && expanded[item.id]

          const row = (
            <>
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <Icon size={14} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-xs text-ink truncate">{item.description}</p>
                </div>
                <p className="font-inter text-[10px] text-ink-muted shrink-0">
                  {formatRelativeDate(item.created_at)}
                </p>
              </div>
              {isOpen && (
                <p className="font-inter text-[10px] text-ink-muted mt-1 pl-[26px]">
                  — by {item.profiles?.full_name ?? 'Unknown'}
                </p>
              )}
            </>
          )

          const className = cn(
            'px-4 py-3',
            i < items.length - 1 ? 'border-b border-[var(--border)]' : ''
          )

          // Admins get a tappable, expandable row. Staff get the exact same row
          // with no interactivity — no button, no chevron, nothing.
          return isAdmin ? (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
              }
              className={cn(className, 'block w-full text-left')}
            >
              {row}
            </button>
          ) : (
            <div key={item.id} className={className}>
              {row}
            </div>
          )
        })}

        {/* Sentinel + foot states. Kept inside the card so the loader/end-note
            sit flush with the list. */}
        <div ref={sentinelRef} />
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-3 border-t border-[var(--border)]">
            <Loader2 size={14} className="animate-spin text-ink-muted" />
          </div>
        )}
        {!hasNextPage && (
          <div className="py-3 text-center border-t border-[var(--border)]">
            <p className="font-inter text-[10px] text-ink-muted">No more activity</p>
          </div>
        )}
      </div>
    </div>
  )
}
