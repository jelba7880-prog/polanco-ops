import { cn } from '@/lib/utils'
import type { CarStatus } from '@/lib/supabase/types'

const STATUS_CONFIG: Record<CarStatus, { label: string; className: string }> = {
  available: {
    label: 'Available',
    className: 'bg-success-tint text-success',
  },
  reserved: {
    label: 'Reserved',
    className: 'bg-warning-tint text-warning',
  },
  sold: {
    label: 'Sold',
    className: 'bg-neutral-tint text-neutral-tag',
  },
  in_transit: {
    label: 'In Transit',
    className: 'bg-navy-tint text-navy',
  },
}

interface StatusBadgeProps {
  status: CarStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter',
        'motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
