'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Car } from 'lucide-react'
import { useCars } from '@/hooks/useCars'
import { CarCard } from '@/components/inventory/CarCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { FAB } from '@/components/ui/FAB'
import type { CarStatus, CarLifecycleStatus } from '@/lib/supabase/types'

const STATUS_FILTERS: { label: string; value: CarStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Sold', value: 'sold' },
]

// Lifecycle tab — a separate dimension from the sales-status chips above.
// 'deleted' cars are intentionally not selectable here (invisible everywhere).
const LIFECYCLE_FILTERS: { label: string; value: Extract<CarLifecycleStatus, 'active' | 'archived'> }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
]

export default function InventoryPage() {
  const [lifecycle, setLifecycle] = useState<'active' | 'archived'>('active')
  const { data: cars, isLoading, error } = useCars(lifecycle)
  const searchParams = useSearchParams()
  const statusParam = searchParams.get('status') as CarStatus | null
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CarStatus | 'all'>(
    statusParam && STATUS_FILTERS.some((f) => f.value === statusParam) ? statusParam : 'all'
  )

  const filtered = useMemo(() => {
    if (!cars) return []

    return cars.filter((car) => {
      const matchesSearch =
        search === '' ||
        `${car.make} ${car.model} ${car.year}`
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || car.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [cars, search, statusFilter])

  return (
    <div className="px-4 py-6 pb-8">
      {/* Lifecycle toggle — Active vs Archived. Sits above the sales-status
          chips; both filters compose (status filtering applies within the
          selected lifecycle tab). */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Lifecycle">
        {LIFECYCLE_FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={lifecycle === f.value}
            onClick={() => setLifecycle(f.value)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium font-inter border active:scale-[0.97] motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out ${
              lifecycle === f.value
                ? 'bg-ink text-base border-ink'
                : 'bg-base text-ink-muted border-[var(--border)] hover:border-ink-soft'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="text"
          placeholder="Search by make, model, year..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-11 pl-9 pr-4 rounded-lg border border-[var(--border-strong)] bg-base font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-navy"
        />
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium font-inter border active:scale-[0.97] motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out ${
              statusFilter === f.value
                ? 'bg-ink text-base border-ink'
                : 'bg-base text-ink-muted border-[var(--border)] hover:border-ink-soft'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-base rounded-xl h-48 animate-pulse border border-[var(--border)]"
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-danger font-inter text-center py-8">
          Failed to load inventory. Pull down to retry.
        </p>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Car}
          title={lifecycle === 'archived' ? 'No archived vehicles' : 'No vehicles found'}
          description={
            search || statusFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : lifecycle === 'archived'
                ? 'Vehicles you archive will show up here.'
                : 'Add your first vehicle to get started.'
          }
          action={
            lifecycle === 'active' && search === '' && statusFilter === 'all'
              ? { label: 'Add Vehicle', onClick: () => (window.location.href = '/inventory/add') }
              : undefined
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filtered.map((car, index) => (
            <CarCard
              key={car.id}
              car={car}
              animationDelay={Math.min(index * 40, 320)}
            />
          ))}
        </div>
      )}

      {/* Count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-center text-xs text-ink-muted font-inter mt-6">
          {filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* FAB — Add vehicle */}
      <FAB href="/inventory/add" label="Add Vehicle" />
    </div>
  )
}
