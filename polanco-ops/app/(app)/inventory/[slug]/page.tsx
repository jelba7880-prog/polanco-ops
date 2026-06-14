'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, Car } from 'lucide-react'
import { useCar } from '@/hooks/useCars'
import { useSettings } from '@/hooks/useSettings'
import { StatusBadge } from '@/components/inventory/StatusBadge'
import { StatusQuickUpdate } from '@/components/inventory/StatusQuickUpdate'
import { Button } from '@/components/ui/Button'
import {
  formatUSD,
  formatNGN,
  usdToNgn,
  formatMileage,
  formatCarTitle,
  formatRelativeDate,
} from '@/lib/formatters'
import type { CarStatus } from '@/lib/supabase/types'

export default function CarDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { data: car, isLoading, error } = useCar(slug)
  const { data: settings } = useSettings()
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [optimisticStatus, setOptimisticStatus] = useState<CarStatus | null>(null)

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="h-64 bg-surface-muted rounded-xl animate-pulse mb-4" />
        <div className="h-8 bg-surface-muted rounded-lg animate-pulse mb-2 w-3/4" />
        <div className="h-6 bg-surface-muted rounded-lg animate-pulse w-1/2" />
      </div>
    )
  }

  if (error || !car) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-danger font-inter">Vehicle not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-navy font-inter underline"
        >
          Go back
        </button>
      </div>
    )
  }

  const currentStatus = optimisticStatus ?? car.status
  const exchangeRate = settings?.exchange_rate_usd_ngn ?? 1580
  const priceNGN = usdToNgn(car.price_usd, exchangeRate)

  const specs = [
    { label: 'Condition', value: car.condition },
    { label: 'Year', value: car.year.toString() },
    { label: 'Mileage', value: formatMileage(car.mileage_km) },
    { label: 'Transmission', value: car.transmission ?? '—' },
    { label: 'Fuel Type', value: car.fuel_type ?? '—' },
    { label: 'Body Type', value: car.body_type ?? '—' },
    { label: 'Exterior', value: car.color_exterior ?? '—' },
    { label: 'Interior', value: car.color_interior ?? '—' },
    { label: 'Engine', value: car.engine_cc ? `${car.engine_cc.toLocaleString()} cc` : '—' },
    { label: 'Horsepower', value: car.horsepower ? `${car.horsepower} hp` : '—' },
  ]

  return (
    <>
      <div className="pb-8">
        {/* Back button */}
        <div className="px-4 pt-2 pb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-ink-muted font-inter hover:text-ink transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} />
            Inventory
          </button>
        </div>

        {/* Image area */}
        <div className="relative w-full aspect-[16/9] bg-surface-muted mb-6">
          {car.car_images && car.car_images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element -- image domain may not be in remotePatterns yet
            <img
              src={car.car_images.find((i) => i.is_cover)?.url ?? car.car_images[0].url}
              alt={formatCarTitle(car.make, car.model, car.year)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <Car size={56} className="text-ink-muted opacity-20" />
            </div>
          )}
        </div>

        <div className="px-4">
          {/* Title + Status */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="font-display text-2xl font-semibold text-ink leading-tight">
              {formatCarTitle(car.make, car.model, car.year)}
            </h1>
            <button
              onClick={() => setStatusModalOpen(true)}
              className="shrink-0 mt-1"
              aria-label="Update status"
            >
              <StatusBadge status={currentStatus} />
            </button>
          </div>

          {/* Price */}
          <div className="mb-6">
            <p className="font-inter text-2xl font-semibold text-gold tabular-nums">
              {formatUSD(car.price_usd)}
            </p>
            <p className="font-inter text-sm text-ink-muted tabular-nums">
              ≈ {formatNGN(priceNGN)} <span className="text-xs">at ₦{exchangeRate.toLocaleString()}/$</span>
            </p>
          </div>

          {/* Specs grid */}
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden mb-6">
            {specs.map((spec, i) => (
              <div
                key={spec.label}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < specs.length - 1 ? 'border-b border-[var(--border)]' : ''
                }`}
              >
                <span className="font-inter text-sm text-ink-muted">{spec.label}</span>
                <span className="font-inter text-sm font-medium text-ink">{spec.value}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {car.notes && (
            <div className="bg-white rounded-xl border border-[var(--border)] px-4 py-4 mb-6">
              <p className="font-inter text-xs text-ink-muted mb-1">Notes</p>
              <p className="font-inter text-sm text-ink">{car.notes}</p>
            </div>
          )}

          {/* Meta */}
          <p className="font-inter text-xs text-ink-muted mb-6">
            Added {formatRelativeDate(car.created_at)}
            {car.updated_at !== car.created_at && (
              <> · Updated {formatRelativeDate(car.updated_at)}</>
            )}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1 gap-2"
              onClick={() => router.push(`/inventory/${slug}/edit`)}
            >
              <Pencil size={16} />
              Edit
            </Button>
            <Button
              className="flex-1"
              onClick={() => setStatusModalOpen(true)}
            >
              Update Status
            </Button>
          </div>
        </div>
      </div>

      {/* Status modal */}
      <StatusQuickUpdate
        carId={car.id}
        currentStatus={currentStatus}
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSuccess={(newStatus) => setOptimisticStatus(newStatus)}
      />
    </>
  )
}
