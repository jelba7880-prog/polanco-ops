import Link from 'next/link'
import Image from 'next/image'
import { Car } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { formatUSD, formatMileage, formatCarTitle, toDisplayCase } from '@/lib/formatters'
import type { Car as CarType } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface CarCardProps {
  car: CarType
  className?: string
  animationDelay?: number
}

export function CarCard({ car, className, animationDelay }: CarCardProps) {
  const coverImage = car.car_images?.find((img) => img.is_cover) ?? car.car_images?.[0]

  return (
    <Link
      href={`/inventory/${car.slug}`}
      style={typeof animationDelay === 'number' ? { animationDelay: `${animationDelay}ms` } : undefined}
      className={cn(
        'block bg-base rounded-xl shadow-card border border-[var(--border)] overflow-hidden',
        // Press feedback shares the app-wide easing/duration (150ms ease-out).
        // Cards use a slightly softer scale (0.98 vs the 0.97 on buttons/chips)
        // because the same proportional shrink reads as more motion on a large
        // full-width element than on a small control.
        'active:scale-[0.98] transition-transform duration-150 ease-out',
        // Hover lift (desktop) and staggered entrance — see globals.css .car-card
        'car-card car-card-enter',
        className
      )}
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg bg-surface-muted">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={formatCarTitle(car.make, car.model, car.year)}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <Car size={40} className="text-ink-muted opacity-30" />
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-3 left-3">
          <StatusBadge status={car.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-ink leading-tight mb-1">
          {formatCarTitle(car.make, car.model, car.year)}
        </h3>

        <p className="font-inter text-xl font-semibold text-gold tabular-nums mb-3">
          {formatUSD(car.price_usd)}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-ink-muted font-inter">
          <span>{toDisplayCase(car.condition)}</span>
          {car.mileage_km !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatMileage(car.mileage_km)}</span>
            </>
          )}
          {car.transmission && (
            <>
              <span aria-hidden="true">·</span>
              <span>{toDisplayCase(car.transmission)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
