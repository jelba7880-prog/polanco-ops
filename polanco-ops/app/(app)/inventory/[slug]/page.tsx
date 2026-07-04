'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Pencil, FileText, Archive, RotateCcw, Trash2 } from 'lucide-react'
import { useCar, useSetCarLifecycle } from '@/hooks/useCars'
import { useSettings } from '@/hooks/useSettings'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { StatusBadge } from '@/components/inventory/StatusBadge'
import { StatusQuickUpdate } from '@/components/inventory/StatusQuickUpdate'
import { ImageCarousel } from '@/components/inventory/ImageCarousel'
import { Button } from '@/components/ui/Button'
import { BackLink } from '@/components/ui/BackLink'
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

export default function CarDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { data: car, isLoading, error } = useCar(slug)
  const { data: settings } = useSettings()
  const { data: currentUser } = useCurrentUser()
  const setLifecycle = useSetCarLifecycle()
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  // Which lifecycle confirmation is open: archive (active→archived),
  // restore (archived→active) or delete (archived→deleted).
  const [lifecycleAction, setLifecycleAction] =
    useState<'archive' | 'restore' | 'delete' | null>(null)

  const isAdmin = currentUser?.role === 'admin'

  async function handleLifecycle(next: 'active' | 'archived' | 'deleted') {
    if (!car) return
    try {
      await setLifecycle.mutateAsync({ id: car.id, lifecycle: next })
      setLifecycleAction(null)
      // Restoring keeps the car in-app, so stay put and let the invalidated
      // detail query swap the action buttons. Archive/Delete remove it from the
      // current list context, so return to Inventory.
      if (next !== 'active') router.push('/inventory')
    } catch (err) {
      console.error('Lifecycle update failed:', err)
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
          className="mt-4 text-sm text-navy font-inter underline transition-all duration-150 ease-out active:scale-[0.97]"
        >
          Go back
        </button>
      </div>
    )
  }

  // Reads straight from the React Query cache, which useUpdateCarStatus
  // patches optimistically — so the badge updates instantly on confirm.
  const currentStatus = car.status
  const lifecycle = car.lifecycle_status
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
          <BackLink label="Inventory" onClick={() => router.back()} />
        </div>

        {/* Image carousel */}
        <div className="px-4">
          <ImageCarousel
            images={carImages}
            carName={`${car.year} ${car.make} ${car.model}`}
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
              className="shrink-0 mt-1 transition-all duration-150 ease-out active:scale-[0.97]"
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
            {/* Active car: single admin "Archive" action (the reversible,
                everyday "remove from the active lot" action). */}
            {isAdmin && lifecycle === 'active' && (
              <Button
                variant="secondary"
                className="flex-1 gap-2"
                onClick={() => setLifecycleAction('archive')}
              >
                <Archive size={16} />
                Archive
              </Button>
            )}
          </div>

          {/* Archived car: admin Restore / Delete actions on their own row. */}
          {isAdmin && lifecycle === 'archived' && (
            <div className="flex gap-3 mt-2">
              <Button
                variant="secondary"
                className="flex-1 gap-2"
                onClick={() => setLifecycleAction('restore')}
              >
                <RotateCcw size={16} />
                Restore to Active
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={() => setLifecycleAction('delete')}
              >
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          )}

          {/* Generate deal sheet shortcut (available, active cars only) */}
          {currentStatus === 'available' && lifecycle === 'active' && (
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
      />

      {/* Archive confirmation (active → archived). Reversible, everyday action. */}
      <Modal
        open={lifecycleAction === 'archive'}
        onClose={() => setLifecycleAction(null)}
        title="Archive Vehicle"
      >
        <p className="font-inter text-sm text-ink-soft mb-6">
          Removes this car from active inventory. You can restore it anytime from
          the Archived tab.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setLifecycleAction(null)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleLifecycle('archived')}
            loading={setLifecycle.isPending}
          >
            Archive
          </Button>
        </div>
      </Modal>

      {/* Restore confirmation (archived → active). */}
      <Modal
        open={lifecycleAction === 'restore'}
        onClose={() => setLifecycleAction(null)}
        title="Restore Vehicle"
      >
        <p className="font-inter text-sm text-ink-soft mb-6">
          Returns this car to active inventory. It will appear in the Active tab
          again with all its data and images intact.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setLifecycleAction(null)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => handleLifecycle('active')}
            loading={setLifecycle.isPending}
          >
            Restore to Active
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation (archived → deleted). More serious than Archive,
          but still NOT a real DELETE — the row is kept in Postgres. */}
      <Modal
        open={lifecycleAction === 'delete'}
        onClose={() => setLifecycleAction(null)}
        title="Delete Vehicle"
      >
        <p className="font-inter text-sm text-ink-soft mb-6">
          Removes this car everywhere in the app, including the Archived tab. The
          record is kept and can be recovered by an admin directly in Supabase if
          ever needed.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setLifecycleAction(null)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => handleLifecycle('deleted')}
            loading={setLifecycle.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  )
}
