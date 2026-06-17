'use client'

import { FileText } from 'lucide-react'
import { useDeals } from '@/hooks/useDeals'
import { DealCard } from '@/components/deals/DealCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { FAB } from '@/components/ui/FAB'

export default function DealsPage() {
  const { data: deals, isLoading } = useDeals()

  if (isLoading) {
    return (
      <div className="px-4 py-6 flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-surface-muted rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="px-4 py-6 pb-8">
      {!deals || deals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No deal sheets yet"
          description="Generate a proforma for a client to get started."
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
