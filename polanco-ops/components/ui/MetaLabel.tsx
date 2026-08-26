interface MetaLabelProps {
  children: React.ReactNode
  className?: string
}

/**
 * Locked style for uppercase metadata labels — stat-card labels (AVAILABLE,
 * RESERVED, LEADS TODAY…) and form section headers (BASIC INFO…). Consolidates
 * what used to be independently hand-rolled per call site.
 */
export function MetaLabel({ children, className = '' }: MetaLabelProps) {
  return (
    <p
      className={`font-inter text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted ${className}`}
    >
      {children}
    </p>
  )
}
