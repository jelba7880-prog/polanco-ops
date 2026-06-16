'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, FileText } from 'lucide-react'
import { useCar, useDeleteCar } from '@/hooks/useCars'
import { useSettings } from '@/hooks/useSettings'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { StatusBadge } from '@/components/inventory/StatusBadge'
import { StatusQuickUpdate } from '@/components/inventory/StatusQuickUpdate'
import { ImageCarousel } from '@/components/inventory/ImageCarousel'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  formatUSD,
  formatNGN,
  usdToNgn,
  formatMileage,
  formatCarTitle,
  formatRelativeDate,
  toDisplayCase,
} from '@/lib/formatters'
import type { CarStatus } from '@/lib/supabase/types'

export default function CarDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { data: car, isLoading, error } = useCar(slug)
  const { data: settings } = useSettings()
  const { data: currentUser } = useCurrentUser()
  const deleteCarMutation = useDeleteCar()
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [optimisticStatus, setOptimisticStatus] = useState<CarStatus | null>(null)

  const isAdmin = currentUser?.role === 'admin'

  async function handleDelete() {
    if (!car) return
    try {
      await deleteCarMutation.mutateAsync(car.id)
      router.push('/inventory')
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

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
  const carImages = car.car_images ?? []
  const exchangeRate = settings?.exchange_rate_usd_ngn ?? 1580
  const priceNGN = usdToNgn(car.price_usd, exchangeRate)

  const specs = [
    { label: 'Condition', value: toDisplayCase(car.condition) },
    { label: 'Year', value: car.year.toString() },
    { label: 'Mileage', value: formatMileage(car.mileage_km) },
    { label: 'Transmission', value: car.transmission ? toDisplayCase(car.transmission) : '—' },
    { label: 'Fuel Type', value: car.fuel_type ? toDisplayCase(car.fuel_type) : '—' },
    { label: 'Body Type', value: car.body_type ? toDisplayCase(car.body_type) : '—' },
    { label: 'Exterior', value: car.color_exterior ? toDisplayCase(car.color_exterior) : '—' },
    { label: 'Interior', value: car.color_interior ? toDisplayCase(car.color_interior) : '—' },
    { label: 'Engine', value: car.engine_cc ? `${car.engine_cc.toLocaleString()} cc` : '—' },
    { label: 'Horsepower', value: car.horsepower ? `${car.horsepower} hp` : '—' },
    ...(car.reserved_for && currentStatus === 'reserved'
      ? [{ label: 'Reserved For', value: car.reserved_for }]
      : []),
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

        {/* Image carousel */}
        <div className="px-4">
          <ImageCarousel
            images={carImages}
            carName={`${car.year} ${toDisplayCase(car.make)} ${toDisplayCase(car.model)}`}
          />
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
            {isAdmin && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setDeleteModalOpen(true)}
              >
                Delete
              </Button>
            )}
          </div>

          {/* Generate deal sheet shortcut (available cars only) */}
          {currentStatus === 'available' && (
            <Button
              variant="secondary"
              className="w-full gap-2 mt-2"
              onClick={() => router.push(`/deals/new?carId=${car.id}`)}
            >
              <FileText size={16} />
              Generate Deal Sheet
            </Button>
          )}
        </div>
      </div>

      {/* Status modal */}
      <StatusQuickUpdate
        carId={car.id}
        currentStatus={currentStatus}
        currentReservedFor={car.reserved_for}
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSuccess={(newStatus) => setOptimisticStatus(newStatus)}
      />

      {/* Delete confirmation modal (admin only) */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Vehicle"
      >
        <p className="font-inter text-sm text-ink-soft mb-6">
          Are you sure you want to delete the {car.year} {toDisplayCase(car.make)} {toDisplayCase(car.model)}?
          This cannot be undone and will remove all associated images.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeleteModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDelete}
            loading={deleteCarMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}
