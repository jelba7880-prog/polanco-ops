import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-success/90 text-white' },
  reserved: { label: 'Reserved', className: 'bg-warning/90 text-white' },
  in_transit: { label: 'In Transit', className: 'bg-navy/90 text-white' },
}

interface PublicStatusBadgeProps {
  status: string
  size?: 'sm' | 'lg'
  className?: string
}

export function PublicStatusBadge({ status, size = 'sm', className }: PublicStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  if (!config) return null

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-inter font-medium',
        size === 'lg' ? 'px-4 py-2 text-sm' : 'px-2.5 py-0.5 text-xs',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
