interface SectionLabelProps {
  children: React.ReactNode
}

/**
 * Section label with a trailing hairline rule (QUICK ACTIONS, RECENT ACTIVITY…).
 *
 * Layout is the safe, non-wrapping flex pattern: the label is `shrink-0` so it
 * always keeps its full width, and the hairline is `flex-1 h-px` so it stretches
 * from after the label to the right edge of the content container — longer on
 * wider viewports, never forcing a line break. Identical at every breakpoint;
 * only the container width changes.
 */
export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p className="shrink-0 font-inter text-xs font-medium uppercase tracking-wider text-ink-muted">
        {children}
      </p>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}
