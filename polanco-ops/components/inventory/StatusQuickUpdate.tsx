'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { useUpdateCarStatus } from '@/hooks/useCars'
import type { CarStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: {
  value: CarStatus
  label: string
  description: string
  colorClass: string
}[] = [
  {
    value: 'available',
    label: 'Available',
    description: 'Car is on the lot and ready to show',
    colorClass: 'text-success',
  },
  {
    value: 'reserved',
    label: 'Reserved',
    description: 'Held for a specific buyer',
    colorClass: 'text-warning',
  },
  {
    value: 'in_transit',
    label: 'In Transit',
    description: 'Being shipped or in customs',
    colorClass: 'text-navy',
  },
  {
    value: 'sold',
    label: 'Sold',
    description: 'Deal closed',
    colorClass: 'text-neutral-tag',
  },
]

interface StatusQuickUpdateProps {
  carId: string
  currentStatus: CarStatus
  currentReservedFor?: string | null
  open: boolean
  onClose: () => void
  onSuccess: (newStatus: CarStatus) => void
}

export function StatusQuickUpdate({
  carId,
  currentStatus,
  currentReservedFor,
  open,
  onClose,
  onSuccess,
}: StatusQuickUpdateProps) {
  const [selected, setSelected] = useState<CarStatus>(currentStatus)
  const [reservedFor, setReservedFor] = useState(currentReservedFor ?? '')
  const updateStatus = useUpdateCarStatus()

  async function handleConfirm() {
    if (
      selected === currentStatus &&
      (selected !== 'reserved' || reservedFor === (currentReservedFor ?? ''))
    ) {
      onClose()
      return
    }

    try {
      await updateStatus.mutateAsync({
        id: carId,
        status: selected,
        reserved_for: selected === 'reserved' ? reservedFor : undefined,
      })
      onSuccess(selected)
      onClose()
    } catch {
      // Error handled by parent via mutation state
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Update Status">
      <div className="flex flex-col gap-2 mb-6">
        {STATUS_OPTIONS.map((option) => {
          const isSelected = selected === option.value
          const isCurrent = currentStatus === option.value

          return (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              className={cn(
                'flex items-center justify-between w-full px-4 py-3.5 rounded-xl border text-left transition-colors duration-150',
                isSelected
                  ? 'border-ink bg-surface-muted'
                  : 'border-[var(--border)] bg-white hover:bg-surface-muted'
              )}
            >
              <div>
                <p className={cn('font-inter font-medium text-sm', option.colorClass)}>
                  {option.label}
                  {isCurrent && (
                    <span className="ml-2 text-xs text-ink-muted font-normal">
                      (current)
                    </span>
                  )}
                </p>
                <p className="font-inter text-xs text-ink-muted mt-0.5">
                  {option.description}
                </p>
              </div>
              {isSelected && (
                <Check size={16} className="text-ink shrink-0 ml-3" />
              )}
            </button>
          )
        })}

        {selected === 'reserved' && (
          <input
            type="text"
            placeholder="Reserved for (client name)"
            value={reservedFor}
            onChange={(e) => setReservedFor(e.target.value)}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-lg border border-[var(--border-strong)] bg-white font-inter text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-navy mt-2"
          />
        )}
      </div>

      <button
        onClick={handleConfirm}
        disabled={updateStatus.isPending}
        className="w-full h-12 bg-gold text-ink font-inter font-medium text-sm rounded-xl disabled:opacity-50 transition-opacity"
      >
        {updateStatus.isPending ? 'Updating...' : 'Confirm'}
      </button>
    </Modal>
  )
}
