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

const BORDER_COLOR_MAP: Record<StatCardProps['accentColor'], string> = {
  success: 'border-l-success',
  warning: 'border-l-warning',
  navy: 'border-l-navy',
  gold: 'border-l-gold',
}

export function StatCard({ label, value, accentColor, delay = 0 }: StatCardProps) {
  const animatedValue = useCountUp(value, { delay })

  return (
    <div
      className={`stat-card-enter bg-white rounded-xl shadow-card border border-[var(--border)] border-l-[3px] ${BORDER_COLOR_MAP[accentColor]} p-4`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="font-inter text-[10px] font-medium uppercase tracking-widest text-ink-muted mb-1">
        {label}
      </p>
      <p className="font-cormorant font-semibold text-5xl leading-none tracking-tight text-ink">
        {animatedValue}
      </p>
    </div>
  )
}
