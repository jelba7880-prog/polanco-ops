'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, Car } from 'lucide-react'
import { useCars } from '@/hooks/useCars'
import { CarCard } from '@/components/inventory/CarCard'
import { EmptyState } from '@/components/ui/EmptyState'
import type { CarStatus } from '@/lib/supabase/types'

const STATUS_FILTERS: { label: string; value: CarStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Sold', value: 'sold' },
]

export default function InventoryPage() {
  const { data: cars, isLoading, error } = useCars()
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
          className="w-full h-11 pl-9 pr-4 rounded-lg border border-[var(--border-strong)] bg-white font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-navy"
        />
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium font-inter border transition-all duration-150 ease-out active:scale-[0.97] ${
              statusFilter === f.value
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-ink-muted border-[var(--border)] hover:border-ink-soft'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl h-48 animate-pulse border border-[var(--border)]"
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
          title="No vehicles found"
          description={
            search || statusFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Add your first vehicle to get started.'
          }
          action={
            search === '' && statusFilter === 'all'
              ? { label: 'Add Vehicle', onClick: () => (window.location.href = '/inventory/add') }
              : undefined
          }
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
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
      <Link
        href="/inventory/add"
        className="fab fixed bottom-20 right-4 z-30 flex items-center gap-2 bg-gold text-ink font-inter font-medium text-sm px-4 h-12 rounded-full shadow-elevated active:scale-[0.97] transition-transform duration-150 ease-out"
      >
        <Plus size={18} />
        Add Vehicle
      </Link>
    </div>
  )
}
