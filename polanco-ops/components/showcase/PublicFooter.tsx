export function PublicFooter() {
  return (
    <footer className="border-t-2 border-gold py-12 px-4 text-center">
      <p className="font-display font-semibold text-ink text-lg mb-3">
        POLANCO EXOTIC CARS
      </p>
      <p className="font-inter text-sm text-ink-muted mb-1">
        Plot 2, Km 33 Lekki-Epe Expressway, Lekki Phase 1, Lagos
      </p>
      <a
        href="https://instagram.com/polancoexoticcars"
        target="_blank"
        rel="noopener noreferrer"
        className="font-inter text-sm text-ink-muted hover:text-ink transition-colors duration-150 ease-out"
      >
        @polancoexoticcars
      </a>
      <p className="font-inter text-xs text-ink-muted mt-4">
        © 2026 Polanco Exotic Cars. All rights reserved.
      </p>
    </footer>
  )
}
