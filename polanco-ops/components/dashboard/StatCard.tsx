'use client'

import { useCountUp } from '@/hooks/useCountUp'

interface StatCardProps {
  label: string
  value: number
  /** Staggered entrance delay (ms). The count-up waits the same amount so the
   *  number starts counting the moment the card fades in. */
  delay?: number
}

export function StatCard({ label, value, delay = 0 }: StatCardProps) {
  const animatedValue = useCountUp(value, { delay })

  return (
    /* border-t-[3px] gold accent reads clearly at arm's length on a small phone;
       p-4 on mobile/tablet → lg:p-6 gives the larger desktop number room to
       breathe. card-hoverable adds the md+ hover elevation (pointer devices only
       — see globals.css @media (hover: hover)). */
    <div
      className="stat-card-enter card-hoverable bg-white rounded-xl shadow-card border border-[var(--border)] border-t-[3px] border-t-gold p-4 lg:p-6"
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
