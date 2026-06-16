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
}

export function CarCard({ car, className }: CarCardProps) {
  const coverImage = car.car_images?.find((img) => img.is_cover) ?? car.car_images?.[0]

  return (
    <Link
      href={`/inventory/${car.slug}`}
      className={cn(
        'block bg-white rounded-xl shadow-card border border-[var(--border)] overflow-hidden',
        'active:scale-[0.98] transition-transform duration-100',
        className
      )}
    >
      {/* Image */}
      <div className="relative w-full aspect-[16/9] bg-surface-muted">
        {coverImage ? (
          <Image
            src={coverImage.url}
            alt={formatCarTitle(car.make, car.model, car.year)}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
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

        <div className="flex items-center gap-3 text-xs text-ink-muted font-inter">
          <span>{toDisplayCase(car.condition)}</span>
          {car.mileage_km !== undefined && (
            <>
              <span className="w-px h-3 bg-border-base" />
              <span>{formatMileage(car.mileage_km)}</span>
            </>
          )}
          {car.transmission && (
            <>
              <span className="w-px h-3 bg-border-base" />
              <span>{toDisplayCase(car.transmission)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
