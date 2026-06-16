'use client'

import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { useDeals } from '@/hooks/useDeals'
import { DealCard } from '@/components/deals/DealCard'
import { EmptyState } from '@/components/ui/EmptyState'

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

      <Link
        href="/deals/new"
        className="fixed bottom-20 right-4 z-30 flex items-center gap-2 bg-gold text-ink font-inter font-medium text-sm px-4 h-12 rounded-full shadow-elevated active:scale-[0.97] transition-transform duration-150 ease-out"
      >
        <Plus size={18} />
        New Deal
      </Link>
    </div>
  )
}
