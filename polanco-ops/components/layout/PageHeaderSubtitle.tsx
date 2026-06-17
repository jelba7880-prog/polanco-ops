interface PageHeaderSubtitleProps {
  children: React.ReactNode
}

/** Shared styling for the one-line contextual text under a page title (greeting, counts, etc). */
export function PageHeaderSubtitle({ children }: PageHeaderSubtitleProps) {
  return (
    <p className="font-inter text-xs lg:text-sm text-ink-muted mb-5">
      {children}
    </p>
  )
}
