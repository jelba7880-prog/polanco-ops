'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PublicStatusBadge } from './PublicStatusBadge'
import { formatUSD, formatMileage, toDisplayCase } from '@/lib/formatters'
import type { PublicCar } from '@/lib/showcase/types'

interface PublicCarCardProps {
  car: PublicCar
  priority?: boolean
}

export function PublicCarCard({ car, priority = false }: PublicCarCardProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <Link
      href={`/cars/${car.slug}`}
      className="block bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-muted">
        {car.coverImageUrl ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 bg-surface-muted animate-pulse" />
            )}
            <Image
              src={car.coverImageUrl}
              alt={`${car.year} ${toDisplayCase(car.make)} ${toDisplayCase(car.model)}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              quality={85}
              preload={priority}
              onLoad={() => setLoaded(true)}
              style={{ opacity: loaded ? 1 : 0 }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <span className="font-display text-ink-muted text-lg tracking-widest">
              POLANCO
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3">
          <PublicStatusBadge status={car.status} />
        </div>
      </div>

      <div className="p-5">
        <p className="font-inter text-xs text-ink-muted uppercase tracking-wide mb-1">
          {car.year}
        </p>
        <h3 className="font-display text-[22px] font-semibold text-ink leading-tight mb-1">
          {toDisplayCase(car.make)} {toDisplayCase(car.model)}
        </h3>
        <p className="font-inter text-[13px] text-ink-soft mb-2">
          {toDisplayCase(car.condition)} · {formatMileage(car.mileage_km)}
        </p>
        <p className="font-inter text-lg font-semibold text-gold">
          {formatUSD(car.price_usd)}
        </p>
      </div>
    </Link>
  )
}
