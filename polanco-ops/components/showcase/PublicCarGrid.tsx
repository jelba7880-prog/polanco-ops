'use client'

import { useMemo, useState } from 'react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Search } from 'lucide-react'
import { PublicCarCard } from './PublicCarCard'
import { PublicFilterChips } from './PublicFilterChips'
import type { PublicCar } from '@/lib/showcase/types'

interface PublicCarGridProps {
  cars: PublicCar[]
}

export function PublicCarGrid({ cars }: PublicCarGridProps) {
  const [query, setQuery] = useState('')
  const [selectedMake, setSelectedMake] = useState<string | null>(null)
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null)
  const [gridRef] = useAutoAnimate()

  const makes = useMemo(
    () => Array.from(new Set(cars.map((car) => car.make))).sort(),
    [cars]
  )
  const bodyTypes = useMemo(
    () =>
      Array.from(new Set(cars.map((car) => car.body_type).filter((bt): bt is string => !!bt))).sort(),
    [cars]
  )

  const filteredCars = useMemo(() => {
    const q = query.trim().toLowerCase()

    return cars.filter((car) => {
      if (selectedMake && car.make !== selectedMake) return false
      if (selectedBodyType && car.body_type !== selectedBodyType) return false

      if (q) {
        const haystack = [car.make, car.model, String(car.year), car.body_type ?? '']
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }

      return true
    })
  }, [cars, query, selectedMake, selectedBodyType])

  function clearFilters() {
    setQuery('')
    setSelectedMake(null)
    setSelectedBodyType(null)
  }

  return (
    <div>
      <div className="relative w-full sm:max-w-[480px] mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search make, model, year…"
          className="w-full h-11 pl-9 pr-4 rounded-lg border border-[var(--border)] bg-base font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-navy/30"
        />
      </div>

      <div className="mb-8">
        <PublicFilterChips
          makes={makes}
          bodyTypes={bodyTypes}
          selectedMake={selectedMake}
          selectedBodyType={selectedBodyType}
          onMakeChange={setSelectedMake}
          onBodyTypeChange={setSelectedBodyType}
        />
      </div>

      {filteredCars.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20">
          <p className="font-inter text-ink-muted mb-4">No vehicles match your search.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center h-10 px-5 rounded-lg border border-[var(--border)] bg-base font-inter text-sm text-ink-soft hover:bg-surface-muted transition-colors duration-150 ease-out"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car, index) => (
              <PublicCarCard key={car.id} car={car} priority={index === 0} />
            ))}
          </div>

          <p className="font-inter text-[13px] text-ink-muted text-center mt-10">
            Showing {filteredCars.length} of {cars.length} vehicles
          </p>
        </>
      )}
    </div>
  )
}
