import { cn } from '@/lib/utils'

// Solid status chips overlay the car photo. Their fill uses the theme-aware
// status tokens, but the palette's dark-mode status colours are LIGHTER, so
// white text drops below contrast there — flip the label to fixed dark ink in
// dark mode (dark:text-on-accent) while keeping white on the darker light-mode
// fills.
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-success/90 text-white dark:text-on-accent' },
  reserved: { label: 'Reserved', className: 'bg-warning/90 text-white dark:text-on-accent' },
  in_transit: { label: 'In Transit', className: 'bg-navy/90 text-white dark:text-on-accent' },
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
