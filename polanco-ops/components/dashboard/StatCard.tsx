'use client'

import { useCountUp } from '@/hooks/useCountUp'

interface StatCardProps {
  label: string
  value: number
  accentColor: 'success' | 'warning' | 'navy' | 'gold'
  /** Staggered entrance delay (ms). The count-up waits the same amount so the
   *  number starts counting the moment the card fades in. */
  delay?: number
}

// Semantic accent, applied to the TOP edge only. The other three sides carry no
// border — the card shadow defines those edges — so this is a pure top accent,
// not a full-card frame.
const TOP_BORDER_COLOR_MAP: Record<StatCardProps['accentColor'], string> = {
  success: 'border-t-success',
  warning: 'border-t-warning',
  navy: 'border-t-navy',
  gold: 'border-t-gold',
}

// Dark-mode-only subtle status-tinted glow (see .stat-glow-* in globals.css).
// No-op in light mode, where the flat fill + top border stays as-is.
const GLOW_CLASS_MAP: Record<StatCardProps['accentColor'], string> = {
  success: 'stat-glow-success',
  warning: 'stat-glow-warning',
  navy: 'stat-glow-navy',
  gold: 'stat-glow-gold',
}

export function StatCard({ label, value, accentColor, delay = 0 }: StatCardProps) {
  const animatedValue = useCountUp(value, { delay })

  return (
    /* border-t-[3px] semantic accent reads clearly at arm's length; no border on
       the other sides (shadow defines the edge). p-4 on mobile/tablet → lg:p-6
       gives the larger desktop number room. card-hoverable adds the md+ hover
       elevation (pointer devices only — see globals.css @media (hover: hover)). */
    <div
      className={`stat-card-enter card-hoverable bg-base ${GLOW_CLASS_MAP[accentColor]} rounded-xl shadow-card border-t-[3px] ${TOP_BORDER_COLOR_MAP[accentColor]} p-4 lg:p-6`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="font-inter text-[10px] font-medium uppercase tracking-widest text-ink-muted mb-1">
        {label}
      </p>
      <p className="font-cormorant font-semibold text-3xl lg:text-4xl leading-none tracking-tight text-ink">
        {animatedValue}
      </p>
    </div>
  )
}
