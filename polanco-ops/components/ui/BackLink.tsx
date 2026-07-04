import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackLinkProps {
  /** Text shown after the arrow, e.g. the parent screen name ("Leads"). */
  label: string
  /** Navigation handler. Behavior is owned by the caller (router.back / push). */
  onClick: () => void
  /** Optional extra classes for outer spacing (e.g. mb-2). */
  className?: string
}

/**
 * Shared back affordance for detail/nested pages. Renders as a fully rounded,
 * transparent pill with a subtle 1px outline so it reads as tappable against
 * the page background. The outer button carries the 48px minimum tap target
 * (per the app-wide rule) while the inner pill stays visually compact — the
 * extra height is hit-area padding, not a taller pill.
 */
export function BackLink({ label, onClick, className }: BackLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group inline-flex items-center min-h-[48px] w-fit transition-all duration-150 ease-out active:scale-[0.97]',
        className
      )}
    >
      <span className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-transparent px-3.5 py-2 text-sm font-inter text-ink-muted transition-colors duration-150 ease-out group-hover:bg-ink/5 group-hover:text-ink">
        <ArrowLeft size={16} />
        {label}
      </span>
    </button>
  )
}
