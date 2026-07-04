'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { useDeals } from '@/hooks/useDeals'
import { DealCard } from '@/components/deals/DealCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { FAB } from '@/components/ui/FAB'

const ARCHIVE_FILTERS: { label: string; value: boolean }[] = [
  { label: 'Active', value: false },
  { label: 'Archived', value: true },
]

export default function DealsPage() {
  const [archived, setArchived] = useState(false)
  const { data: deals, isLoading } = useDeals(archived)

  return (
    <div className="px-4 py-6 pb-8">
      {/* Archived filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
        {ARCHIVE_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setArchived(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium font-inter border active:scale-[0.97] motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out ${
              archived === f.value
                ? 'bg-ink text-base border-ink'
                : 'bg-base text-ink-muted border-[var(--border)] hover:border-ink-soft'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !deals || deals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={archived ? 'No archived deal sheets' : 'No deal sheets yet'}
          description={
            archived
              ? 'Deal sheets you archive will show up here.'
              : 'Generate a proforma for a client to get started.'
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}

      <FAB href="/deals/new" label="New Deal" />
    </div>
  )
}
