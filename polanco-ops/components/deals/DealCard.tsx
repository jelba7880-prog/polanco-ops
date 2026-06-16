'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Car } from 'lucide-react'
import { formatUSD, formatNGN, formatDate } from '@/lib/formatters'
import type { DealSheet } from '@/lib/supabase/types'

interface DealCardProps {
  deal: DealSheet
}

export function DealCard({ deal }: DealCardProps) {
  const snapshot = deal.car_snapshot as Record<string, unknown>
  const carLabel = snapshot
    ? `${snapshot.year} ${snapshot.make} ${snapshot.model}`.trim()
    : 'Unknown vehicle'

  // car_snapshot does not currently store an image URL (images live in car_images records);
  // check for it anyway so cards render correctly if the snapshot format is extended later.
  const imageUrl =
    typeof snapshot?.image_url === 'string' && snapshot.image_url
      ? snapshot.image_url
      : null

  const initials = deal.profiles?.full_name
    ? deal.profiles.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block bg-white rounded-xl border border-[var(--border)] shadow-card active:scale-[0.98] transition-transform duration-100"
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Thumbnail */}
        <div className="relative shrink-0 w-11 h-11 rounded-lg bg-surface-muted overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={carLabel}
              fill
              className="object-cover"
              sizes="44px"
            />
          ) : (
            <Car size={18} className="text-ink-muted opacity-30" />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-inter font-semibold text-sm text-ink truncate">
              {deal.client_name}
            </p>
            {initials && (
              <span className="shrink-0 w-5 h-5 rounded-full bg-navy text-white text-[9px] font-inter font-semibold flex items-center justify-center">
                {initials}
              </span>
            )}
          </div>
          <p className="font-inter text-xs text-ink-muted truncate mb-1">
            {carLabel}
          </p>
          <p className="font-inter text-xs text-ink-muted">
            {formatDate(deal.created_at)}
          </p>
        </div>

        {/* Prices */}
        <div className="shrink-0 text-right">
          <p className="font-inter font-semibold text-sm text-gold tabular-nums">
            {formatUSD(deal.total_usd)}
          </p>
          <p className="font-inter text-[10px] text-ink-muted tabular-nums mt-0.5">
            {formatNGN(deal.total_ngn)}
          </p>
        </div>
      </div>
    </Link>
  )
}
