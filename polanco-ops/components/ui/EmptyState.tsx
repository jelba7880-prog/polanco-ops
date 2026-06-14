import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: ComponentType<LucideProps>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-surface-muted mb-4">
        <Icon size={26} className="text-ink-muted" />
      </div>

      <h3 className="font-display text-xl font-semibold text-ink mb-1">{title}</h3>

      {description && (
        <p className="font-inter text-sm text-ink-muted max-w-xs mb-6">{description}</p>
      )}

      {action && (
        <Button type="button" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
