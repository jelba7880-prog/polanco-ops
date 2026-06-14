'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatUSD, formatDate } from '@/lib/formatters'
import type { DealSheet } from '@/lib/supabase/types'

export default function DealsPage() {
  const [deals, setDeals] = useState<DealSheet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDeals() {
      const supabase = createClient()
      const { data } = await supabase
        .from('deal_sheets')
        .select('*')
        .order('created_at', { ascending: false })
      setDeals((data as DealSheet[]) ?? [])
      setLoading(false)
    }
    fetchDeals()
  }, [])

  if (loading) {
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
      {deals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No deal sheets yet"
          description="Generate a proforma for a client to get started."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {deals.map((deal) => {
            const snapshot = deal.car_snapshot as Record<string, unknown>
            const carLabel = snapshot
              ? `${snapshot.year} ${snapshot.make} ${snapshot.model}`
              : 'Unknown vehicle'

            return (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="block bg-white rounded-xl border border-[var(--border)] shadow-card px-4 py-3.5 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-inter font-semibold text-sm text-ink mb-0.5">
                      {deal.client_name}
                    </p>
                    <p className="font-inter text-xs text-ink-muted mb-2 truncate">
                      {carLabel}
                    </p>
                    <p className="font-inter text-xs text-ink-muted">
                      {formatDate(deal.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-inter font-semibold text-sm text-gold tabular-nums">
                      {formatUSD(deal.total_usd)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Link
        href="/deals/new"
        className="fixed bottom-20 right-4 z-30 flex items-center gap-2 bg-gold text-ink font-inter font-medium text-sm px-4 h-12 rounded-full shadow-elevated active:scale-95 transition-transform"
      >
        <Plus size={18} />
        New Deal
      </Link>
    </div>
  )
}
