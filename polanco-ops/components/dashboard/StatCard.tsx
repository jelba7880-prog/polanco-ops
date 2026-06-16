interface StatCardProps {
  label: string
  value: number
  accentColor: 'success' | 'warning' | 'navy' | 'gold'
  delay?: number // reserved for stagger animation (item 7) — unused for now
}

const BORDER_COLOR_MAP: Record<StatCardProps['accentColor'], string> = {
  success: 'border-l-success',
  warning: 'border-l-warning',
  navy: 'border-l-navy',
  gold: 'border-l-gold',
}

export function StatCard({ label, value, accentColor }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-card border border-[var(--border)] border-l-[3px] ${BORDER_COLOR_MAP[accentColor]} p-4`}
    >
      <p className="font-inter text-[10px] font-medium uppercase tracking-widest text-ink-muted mb-1">
        {label}
      </p>
      <p className="font-cormorant font-semibold text-5xl leading-none tracking-tight text-ink">
        {value}
      </p>
    </div>
  )
}
